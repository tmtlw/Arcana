import { Env, HttpError, guard, handleOptions, json, requireAdmin } from './_lib/auth';

/**
 * Admin tartalomszerkesztő: a kártya/lecke/konstans .ts fájlokat a GitHub repóból olvassa és
 * commitolja (a Cloudflare Pages ezután automatikusan újratelepíti az oldalt).
 *  GET  /api/content?file=cards/major.ts          -> { content, sha }
 *  POST /api/content?file=cards/major.ts {content} -> { success, backup }
 * Szükséges titkok: GITHUB_TOKEN (contents:write), GITHUB_REPO ("owner/repo"), opcionálisan GITHUB_BRANCH.
 */

const FILE_RE = /^(cards|constants|lessons)\/[A-Za-z0-9_-]+\.ts$/;
const MAX_BYTES = 2 * 1024 * 1024;

const gh = (env: Env, path: string, init: RequestInit = {}) => {
    if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) throw new HttpError(503, 'Content editing is not configured');
    return fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/contents/${path}`, {
        ...init,
        headers: {
            Authorization: `Bearer ${env.GITHUB_TOKEN}`,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'arcana-content-editor',
            'X-GitHub-Api-Version': '2022-11-28',
            ...(init.headers || {}),
        },
    });
};

const toBase64 = (s: string): string => {
    const bytes = new TextEncoder().encode(s);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(bin);
};
const fromBase64 = (b64: string): string => {
    const bin = atob(b64.replace(/\s/g, ''));
    return new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0)));
};

export const onRequest = guard(async ({ request, env }) => {
    if (request.method === 'OPTIONS') return handleOptions(request, env);
    const admin = await requireAdmin(request, env);

    const file = new URL(request.url).searchParams.get('file') || '';
    if (!FILE_RE.test(file)) throw new HttpError(400, 'Invalid file path');
    const ref = encodeURIComponent(env.GITHUB_BRANCH || 'main');

    if (request.method === 'GET') {
        const res = await gh(env, `${file}?ref=${ref}`);
        if (res.status === 404) throw new HttpError(404, 'File not found');
        if (!res.ok) throw new HttpError(502, `GitHub error: ${res.status}`);
        const data = (await res.json()) as { content: string; sha: string };
        return json(200, { content: fromBase64(data.content), sha: data.sha });
    }

    if (request.method === 'POST') {
        let body: { content?: unknown };
        try { body = await request.json(); } catch { throw new HttpError(400, 'Invalid JSON'); }
        if (typeof body.content !== 'string' || body.content.length > MAX_BYTES) throw new HttpError(400, 'Invalid content');

        // Aktuális sha (frissítéshez kötelező)
        const cur = await gh(env, `${file}?ref=${ref}`);
        if (!cur.ok && cur.status !== 404) throw new HttpError(502, `GitHub error: ${cur.status}`);
        const sha = cur.ok ? ((await cur.json()) as { sha: string }).sha : undefined;

        const res = await gh(env, file, {
            method: 'PUT',
            body: JSON.stringify({
                message: `Content edit: ${file} (by ${admin.email})`,
                content: toBase64(body.content),
                branch: env.GITHUB_BRANCH || 'main',
                ...(sha ? { sha } : {}),
            }),
        });
        if (!res.ok) {
            console.error('github write', res.status, (await res.text()).slice(0, 300));
            throw new HttpError(502, `GitHub write failed: ${res.status}`);
        }
        const out = (await res.json()) as { commit?: { sha?: string } };
        return json(200, { success: true, backup: (out.commit?.sha || '').slice(0, 7) });
    }

    throw new HttpError(405, 'Method not allowed');
});
