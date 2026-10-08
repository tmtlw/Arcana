import { getAuthHeaders } from './authToken';

/** Admin tartalomfájlok olvasása / commitolása a Cloudflare Function-ön (/api/content) keresztül. */
export const ContentApi = {
    async read(file: string): Promise<{ content?: string; error?: string }> {
        const res = await fetch(`/api/content?file=${encodeURIComponent(file)}`, { headers: await getAuthHeaders() });
        const body = await res.json().catch(() => ({}));
        return res.ok ? body : { error: body.error || `HTTP ${res.status}` };
    },

    async write(file: string, content: string): Promise<{ success?: boolean; backup?: string; error?: string }> {
        const res = await fetch(`/api/content?file=${encodeURIComponent(file)}`, {
            method: 'POST',
            headers: await getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ content }),
        });
        const body = await res.json().catch(() => ({}));
        return res.ok ? body : { error: body.error || `HTTP ${res.status}` };
    },
};
