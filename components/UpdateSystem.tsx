
import React, { useState, useEffect } from 'react';
import { GitHubUpdateService } from '../services/githubUpdateService';

export const UpdateSystem = () => {
    const [config, setConfig] = useState(GitHubUpdateService.config);
    const [status, setStatus] = useState<'idle' | 'checking' | 'ready' | 'updating' | 'done' | 'error'>('idle');
    const [logs, setLogs] = useState<string[]>([]);
    const [changes, setChanges] = useState<string[]>([]);
    const [remoteSha, setRemoteSha] = useState<string>('');
    const [currentSha, setCurrentSha] = useState<string>(localStorage.getItem('app_version_sha') || '');
    const [updateSecret, setUpdateSecret] = useState('');

    const log = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const handleCheck = async () => {
        setStatus('checking');
        setLogs([]);
        log("Checking for updates...");
        GitHubUpdateService.setConfig(config);

        try {
            const result = await GitHubUpdateService.checkForUpdates(currentSha || null);
            if (result.hasUpdate) {
                setStatus('ready');
                setChanges(result.changedFiles);
                setRemoteSha(result.remoteSha);
                log(`Update found! Remote SHA: ${result.remoteSha.substring(0, 7)}`);
                log(`${result.changedFiles.length} files changed.`);
            } else {
                setStatus('idle');
                log("System is up to date.");
            }
        } catch (e: any) {
            setStatus('error');
            log(`Error: ${e.message}`);
        }
    };

    const handleUpdate = async () => {
        if (!updateSecret) {
            alert("Kérlek add meg a biztonsági frissítési kulcsot!");
            return;
        }

        setStatus('updating');
        log("Starting update...");

        let successCount = 0;
        let failCount = 0;

        for (const file of changes) {
            // Skip ignored files? (optional)
            if (file.endsWith('.php') || file === 'metadata.json') {
                // Be careful updating api.php itself!
            }

            log(`Downloading ${file}...`);
            try {
                const content = await GitHubUpdateService.downloadFileContent(file);
                log(`Installing ${file}...`);
                const saved = await GitHubUpdateService.installFile(file, content, updateSecret);
                if (saved) {
                    successCount++;
                } else {
                    failCount++;
                    log(`FAILED to save ${file}`);
                }
            } catch (e: any) {
                failCount++;
                log(`FAILED ${file}: ${e.message}`);
            }
        }

        log(`Update finished. Success: ${successCount}, Failed: ${failCount}`);

        if (failCount === 0) {
            localStorage.setItem('app_version_sha', remoteSha);
            setCurrentSha(remoteSha);
            setStatus('done');
            log("Update applied successfully! Please reload.");
        } else {
            setStatus('error');
            log("Update completed with errors.");
        }
    };

    return (
        <div className="p-6 glass-panel-dark rounded-xl border border-white/10 text-white">
            <h2 className="text-xl font-bold mb-4 text-gold-400">System Update</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="block text-xs text-white/50 mb-1">GitHub Owner</label>
                    <input
                        type="text"
                        value={config.owner}
                        onChange={e => setConfig({...config, owner: e.target.value})}
                        className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs text-white/50 mb-1">Repo Name</label>
                    <input
                        type="text"
                        value={config.repo}
                        onChange={e => setConfig({...config, repo: e.target.value})}
                        className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs text-white/50 mb-1">Branch</label>
                    <input
                        type="text"
                        value={config.branch}
                        onChange={e => setConfig({...config, branch: e.target.value})}
                        className="w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-sm"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <div className="text-sm">
                    <span className="text-white/50">Current Version:</span>
                    <span className="font-mono ml-2">{currentSha ? currentSha.substring(0, 7) : 'Unknown'}</span>
                </div>
                <button
                    onClick={handleCheck}
                    disabled={status === 'checking' || status === 'updating'}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-bold transition-colors disabled:opacity-50"
                >
                    {status === 'checking' ? 'Checking...' : 'Check for Updates'}
                </button>
            </div>

            {status === 'ready' && (
                <div className="mb-4">
                    <label className="block text-xs text-white/50 mb-1">Update Secret Key</label>
                    <input
                        type="password"
                        value={updateSecret}
                        onChange={e => setUpdateSecret(e.target.value)}
                        placeholder="Enter secret key to authorize write..."
                        className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm"
                    />
                </div>
            )}

            {status === 'ready' && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <h3 className="font-bold text-green-400 mb-2">Update Available</h3>
                    <div className="max-h-40 overflow-y-auto text-xs font-mono bg-black/20 p-2 rounded mb-3">
                        {changes.map(f => <div key={f}>{f}</div>)}
                    </div>
                    <button
                        onClick={handleUpdate}
                        className="w-full py-2 bg-green-600 hover:bg-green-500 rounded font-bold transition-colors"
                    >
                        Install Update ({changes.length} files)
                    </button>
                </div>
            )}

            {status === 'done' && (
                <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-center">
                    <h3 className="font-bold text-green-300 text-lg mb-2">Update Successful!</h3>
                    <button onClick={() => window.location.reload()} className="px-6 py-2 bg-white text-green-900 font-bold rounded hover:bg-gray-100">
                        Reload Application
                    </button>
                </div>
            )}

            <div className="bg-black/50 rounded-lg p-3 font-mono text-xs h-48 overflow-y-auto custom-scrollbar border border-white/5">
                {logs.length === 0 ? <span className="text-white/30">System logs...</span> : logs.map((l, i) => (
                    <div key={i} className="mb-0.5">{l}</div>
                ))}
            </div>
        </div>
    );
};
