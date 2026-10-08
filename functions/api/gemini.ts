import { Env, HttpError, guard, handleOptions, json, requireUser } from './_lib/auth';

const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
const MAX_IMAGE_CHARS = 8 * 1024 * 1024;

// Best-effort, izolátumonkénti korlátozás (10 hívás / perc / felhasználó).
const hits = new Map<string, number[]>();
const rateLimited = (uid: string): boolean => {
    const now = Date.now();
    const recent = (hits.get(uid) || []).filter(t => t > now - 60_000);
    if (recent.length >= 10) { hits.set(uid, recent); return true; }
    recent.push(now);
    hits.set(uid, recent);
    return false;
};

export const onRequest = guard(async ({ request, env }) => {
    if (request.method === 'OPTIONS') return handleOptions(request, env);
    if (request.method !== 'POST') throw new HttpError(405, 'Method not allowed');

    const user = await requireUser(request, env);
    if (rateLimited(user.sub)) throw new HttpError(429, 'Too many requests');
    if (!env.GEMINI_API_KEY) throw new HttpError(503, 'AI service is not configured');

    let body: { image?: unknown; lang?: unknown };
    try { body = await request.json(); } catch { throw new HttpError(400, 'Invalid JSON'); }

    let image = typeof body.image === 'string' ? body.image : '';
    const lang = body.lang === 'en' ? 'English' : 'Hungarian';
    let mime = 'image/jpeg';
    if (!image) throw new HttpError(400, 'Missing image');

    const m = /^data:(image\/(?:jpeg|png|webp));base64,/.exec(image);
    if (m) { mime = m[1]; image = image.slice(m[0].length); }
    if (image.length > MAX_IMAGE_CHARS || !/^[A-Za-z0-9+/=\s]+$/.test(image)) throw new HttpError(400, 'Invalid image');

    const prompt = `Analyze this Tarot spread image. Identify the spread positions (numbered 1, 2, etc.) and their descriptions.
Translate the position names and descriptions to ${lang}.
Estimate the x and y coordinates for each position on a 0-100 grid (where x=0 is left, x=100 is right, y=0 is top, y=100 is bottom).
Return ONLY a valid JSON object with this structure:
{
  "name": "Spread Name (${lang})",
  "description": "Brief description (${lang})",
  "positions": [
    { "id": 1, "name": "Position Name", "description": "Description", "x": 50, "y": 50 }
  ]
}`;
    const payload = JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mime, data: image } }] }],
    });

    let res: Response | null = null;
    for (const model of MODELS) {
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
            body: payload,
        });
        if (res.status !== 404) break;
    }
    if (!res || !res.ok) {
        console.error('gemini upstream', res?.status, (await res?.text())?.slice(0, 500));
        throw new HttpError(502, `AI service error: ${res?.status ?? 0}`);
    }

    const data = (await res.json()) as any;
    let text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const fenced = /```json\s*(\{[\s\S]*\})\s*```/.exec(text);
    if (fenced) text = fenced[1];
    try {
        return json(200, JSON.parse(text));
    } catch {
        throw new HttpError(502, 'AI returned an invalid response');
    }
});
