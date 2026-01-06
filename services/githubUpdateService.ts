
interface GitHubFile {
    path: string;
    mode: string;
    type: string;
    sha: string;
    size: number;
    url: string;
}

interface GitHubTree {
    sha: string;
    url: string;
    tree: GitHubFile[];
    truncated: boolean;
}

interface UpdateConfig {
    owner: string;
    repo: string;
    branch: string;
}

export const GitHubUpdateService = {

    // Alapértelmezett konfiguráció - cseréld le a tényleges repo adatokra vagy tedd konfigurálhatóvá
    config: {
        owner: 'user', // Helyőrző
        repo: 'misztikus-tarot-naplo', // Helyőrző
        branch: 'main'
    } as UpdateConfig,

    setConfig(config: Partial<UpdateConfig>) {
        this.config = { ...this.config, ...config };
    },

    async getLatestCommitSha(): Promise<string> {
        const { owner, repo, branch } = this.config;
        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${branch}`);
            if (!response.ok) throw new Error('Nem sikerült lekérni a commitot');
            const data = await response.json();
            return data.sha;
        } catch (e) {
            console.error("Frissítés ellenőrzési hiba:", e);
            throw e;
        }
    },

    async getFileTree(sha: string): Promise<GitHubFile[]> {
        const { owner, repo } = this.config;
        try {
            // Rekurzív fa lekérése
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`);
            if (!response.ok) throw new Error('Nem sikerült lekérni a fájl fát');
            const data: GitHubTree = await response.json();
            return data.tree.filter(f => f.type === 'blob'); // Csak fájlok
        } catch (e) {
            console.error("Fa lekérési hiba:", e);
            throw e;
        }
    },

    async downloadFileContent(path: string): Promise<string> {
        const { owner, repo, branch } = this.config;
        // Raw tartalom URL használata
        const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Nem sikerült letölteni: ${path}`);
        return await response.text();
    },

    async installFile(path: string, content: string, secret: string): Promise<boolean> {
        // Küldés az api.php-nak
        try {
            const dir = path.substring(0, path.lastIndexOf('/'));
            const filename = path.substring(path.lastIndexOf('/') + 1);

            const payload = {
                path: dir, // Relatív útvonal
                filename: filename,
                content: content,
                is_system_update: true, // Jelző az api.php számára
                secret: secret
            };

            const response = await fetch('/api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            return result.status === 'success';
        } catch (e) {
            console.error(`Telepítési hiba ennél: ${path}:`, e);
            return false;
        }
    },

    // Fő folyamat
    async checkForUpdates(currentSha: string | null): Promise<{ hasUpdate: boolean, remoteSha: string, changedFiles: string[] }> {
        const remoteSha = await this.getLatestCommitSha();

        if (!currentSha || currentSha !== remoteSha) {
            // Változások számítása
            // Megjegyzés: Ha nincs helyi fájl hash, feltételezhetjük, hogy MINDEN változott,
            // VAGY összehasonlíthatjuk a fájl fát, ha megvan a régi.
            // Egyszerűség kedvéért, ha a SHA eltér:
            // 1. Letöltünk mindent (biztos, de lassú)
            // 2. GitHub Compare API használata, ha van régi SHA

            let changedFiles: string[] = [];

            if (currentSha) {
                // Compare API használata
                const { owner, repo } = this.config;
                const compareUrl = `https://api.github.com/repos/${owner}/${repo}/compare/${currentSha}...${remoteSha}`;
                const res = await fetch(compareUrl);
                if (res.ok) {
                    const data = await res.json();
                    changedFiles = data.files.map((f: any) => f.filename);
                } else {
                    // Fallback a teljes fára
                    console.warn("Compare API hiba, fallback a teljes fára");
                    const tree = await this.getFileTree(remoteSha);
                    changedFiles = tree.map(f => f.path);
                }
            } else {
                // Első futtatás vagy ismeretlen verzió -> mindent lekérünk
                const tree = await this.getFileTree(remoteSha);
                changedFiles = tree.map(f => f.path);
            }

            return { hasUpdate: true, remoteSha, changedFiles };
        }

        return { hasUpdate: false, remoteSha, changedFiles: [] };
    }
};
