
import { t } from './i18nService';

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

    // Default config - replace with actual repo details or make configurable
    config: {
        owner: 'user', // Placeholder
        repo: 'misztikus-tarot-naplo', // Placeholder
        branch: 'main'
    } as UpdateConfig,

    setConfig(config: Partial<UpdateConfig>) {
        this.config = { ...this.config, ...config };
    },

    async getLatestCommitSha(): Promise<string> {
        const { owner, repo, branch } = this.config;
        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits/${branch}`);
            if (!response.ok) throw new Error('Failed to fetch commit');
            const data = await response.json();
            return data.sha;
        } catch (e) {
            console.error("Update check failed:", e);
            throw e;
        }
    },

    async getFileTree(sha: string): Promise<GitHubFile[]> {
        const { owner, repo } = this.config;
        try {
            // Get recursive tree
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`);
            if (!response.ok) throw new Error('Failed to fetch tree');
            const data: GitHubTree = await response.json();
            return data.tree.filter(f => f.type === 'blob'); // Only files
        } catch (e) {
            console.error("Tree fetch failed:", e);
            throw e;
        }
    },

    async downloadFileContent(path: string): Promise<string> {
        const { owner, repo, branch } = this.config;
        // Use raw content URL
        const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to download ${path}`);
        return await response.text();
    },

    async installFile(path: string, content: string, secret: string): Promise<boolean> {
        // Send to api.php
        try {
            const dir = path.substring(0, path.lastIndexOf('/'));
            const filename = path.substring(path.lastIndexOf('/') + 1);

            const payload = {
                path: dir, // Relative path
                filename: filename,
                content: content,
                is_system_update: true, // Flag for api.php
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
            console.error(`Install failed for ${path}:`, e);
            return false;
        }
    },

    // Main workflow
    async checkForUpdates(currentSha: string | null): Promise<{ hasUpdate: boolean, remoteSha: string, changedFiles: string[] }> {
        const remoteSha = await this.getLatestCommitSha();

        if (!currentSha || currentSha !== remoteSha) {
            // Calculate changes
            // Note: If we don't have local file hashes, we might assume EVERYTHING changed if SHA is different,
            // OR we can compare the file tree blobs if we have the old tree.
            // For simplicity, if SHA differs, we can either:
            // 1. Download everything (safest but slow)
            // 2. Use GitHub Compare API if we have old SHA

            let changedFiles: string[] = [];

            if (currentSha) {
                // Use compare API
                const { owner, repo } = this.config;
                const compareUrl = `https://api.github.com/repos/${owner}/${repo}/compare/${currentSha}...${remoteSha}`;
                const res = await fetch(compareUrl);
                if (res.ok) {
                    const data = await res.json();
                    changedFiles = data.files.map((f: any) => f.filename);
                } else {
                    // Fallback to all files? Or error?
                    console.warn("Compare API failed, falling back to full tree");
                    const tree = await this.getFileTree(remoteSha);
                    changedFiles = tree.map(f => f.path);
                }
            } else {
                // First run or unknown version -> fetch all
                const tree = await this.getFileTree(remoteSha);
                changedFiles = tree.map(f => f.path);
            }

            return { hasUpdate: true, remoteSha, changedFiles };
        }

        return { hasUpdate: false, remoteSha, changedFiles: [] };
    }
};
