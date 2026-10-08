/**
 * Közös segédek a Pages Functions-höz:
 *  - Firebase ID token ellenőrzés (RS256, Google JWKS, Web Crypto)
 *  - admin jogosultság (ADMIN_EMAILS titok, vesszővel elválasztva)
 *  - JSON válaszok, szigorú CORS
 */

export interface Env {
    FIREBASE_PROJECT_ID?: string;
    ADMIN_EMAILS?: string;
    ALLOWED_ORIGINS?: string;
    GEMINI_API_KEY?: string;
    GITHUB_TOKEN?: string;
    GITHUB_REPO?: string;
    GITHUB_BRANCH?: string;
}

const DEFAULT_PROJECT_ID = 'misztikustarot-c4002';
const JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

export interface TokenClaims {
    sub: string;
    email?: string;
    email_verified?: boolean;
    [k: string]: unknown;
}

export class HttpError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

export const json = (status: number, body: unknown, extra: Record<string, string> = {}): Response =>
    new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
            ...extra,
        },
    });

/** CORS: alapból csak same-origin; a ALLOWED_ORIGINS-ban felsorolt originek kapnak engedélyt. */
export const corsHeaders = (req: Request, env: Env): Record<string, string> => {
    const origin = req.headers.get('Origin');
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (origin && allowed.includes(origin)) {
        return {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            Vary: 'Origin',
        };
    }
    return {};
};

export const handleOptions = (req: Request, env: Env): Response =>
    new Response(null, { status: 204, headers: corsHeaders(req, env) });

const b64urlToBytes = (s: string): Uint8Array => {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=');
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
};

const b64urlToJson = (s: string): any => JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));

interface Jwk { kid: string; kty: string; n: string; e: string; alg?: string }
let jwksCache: { keys: Jwk[]; exp: number } | null = null;

const getJwks = async (): Promise<Jwk[]> => {
    if (jwksCache && jwksCache.exp > Date.now()) return jwksCache.keys;
    const res = await fetch(JWKS_URL, { cf: { cacheTtl: 3600, cacheEverything: true } } as RequestInit);
    if (!res.ok) {
        if (jwksCache) return jwksCache.keys;
        throw new HttpError(503, 'Auth keys unavailable');
    }
    const body = (await res.json()) as { keys: Jwk[] };
    jwksCache = { keys: body.keys, exp: Date.now() + 3600_000 };
    return body.keys;
};

/** Visszaadja az ellenőrzött claim-eket, vagy null-t. */
export const verifyIdToken = async (token: string, env: Env): Promise<TokenClaims | null> => {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        const header = b64urlToJson(parts[0]);
        const claims = b64urlToJson(parts[1]) as TokenClaims & { aud?: string; iss?: string; exp?: number; iat?: number };
        if (header.alg !== 'RS256' || !header.kid) return null;

        const jwk = (await getJwks()).find(k => k.kid === header.kid);
        if (!jwk) return null;
        const key = await crypto.subtle.importKey(
            'jwk',
            { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
            { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
            false,
            ['verify'],
        );
        const valid = await crypto.subtle.verify(
            'RSASSA-PKCS1-v1_5',
            key,
            b64urlToBytes(parts[2]),
            new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
        );
        if (!valid) return null;

        const now = Math.floor(Date.now() / 1000);
        const pid = env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID;
        if (claims.aud !== pid) return null;
        if (claims.iss !== `https://securetoken.google.com/${pid}`) return null;
        if (!claims.exp || claims.exp < now) return null;
        if (!claims.iat || claims.iat > now + 60) return null;
        if (!claims.sub) return null;
        return claims;
    } catch {
        return null;
    }
};

const bearer = (req: Request): string => {
    const m = /^Bearer\s+(.+)$/i.exec(req.headers.get('Authorization') || '');
    return m ? m[1].trim() : '';
};

export const requireUser = async (req: Request, env: Env): Promise<TokenClaims> => {
    const claims = await verifyIdToken(bearer(req), env);
    if (!claims) throw new HttpError(401, 'Unauthorized');
    return claims;
};

export const requireAdmin = async (req: Request, env: Env): Promise<TokenClaims> => {
    const claims = await requireUser(req, env);
    const admins = (env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const email = (claims.email || '').toLowerCase();
    if (!email || claims.email_verified !== true || !admins.includes(email)) {
        throw new HttpError(403, 'Forbidden');
    }
    return claims;
};

/** Egységes hibakezelés a végpontokhoz. */
export const guard = (
    handler: (ctx: { request: Request; env: Env }) => Promise<Response>,
) => async (ctx: { request: Request; env: Env }): Promise<Response> => {
    const cors = corsHeaders(ctx.request, ctx.env);
    try {
        const res = await handler(ctx);
        for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
        return res;
    } catch (e) {
        if (e instanceof HttpError) return json(e.status, { status: 'error', error: e.message }, cors);
        console.error('function error', e);
        return json(500, { status: 'error', error: 'Internal error' }, cors);
    }
};
