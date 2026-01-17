
import React, { useState } from 'react';
import { useTarot } from '../context/TarotContext';
import { THEMES, FULL_DECK } from '../constants';

export const InstallView = ({ onBack }: { onBack: () => void }) => {
    const { currentUser, installPrompt, triggerInstall, exportData, syncToCloud, loadFromCloud, isCloudAvailable, isSyncing, activeThemeKey, importData, showToast, readings } = useTarot();
    const theme = THEMES[activeThemeKey] || THEMES['mystic'];

    const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
    const [importing, setImporting] = useState(false);

    // --- Helpers for CSV / TXT Generation ---
    const downloadFile = (content: string, filename: string, type: string) => {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExportCSV = () => {
        const header = "Date,Question,Spread,Cards,Notes\n";
        const rows = readings.map(r => {
            const date = new Date(r.date).toLocaleDateString();
            const cards = r.cards.map(c => {
                const card = FULL_DECK.find(x => x.id === c.cardId);
                return `${card?.name || c.cardId}${c.isReversed ? ' (R)' : ''}`;
            }).join(' | ');
            return `"${date}","${r.question || ''}","${r.spreadId}","${cards}","${r.notes || ''}"`;
        }).join('\n');

        downloadFile(header + rows, `tarot_readings_${new Date().toISOString().slice(0,10)}.csv`, 'text/csv');
    };

    const handleExportTXT = () => {
        let content = `ARKÁNUM - A LÉLEK TÜKRE\nNapló Export - ${new Date().toLocaleDateString()}\n\n`;
        readings.forEach(r => {
            content += `----------------------------------------\n`;
            content += `Dátum: ${new Date(r.date).toLocaleString()}\n`;
            content += `Kérdés: ${r.question || 'Nincs kérdés'}\n`;
            content += `Kirakás: ${r.spreadId}\n`;
            content += `Kártyák:\n`;
            r.cards.forEach((c, i) => {
                const card = FULL_DECK.find(x => x.id === c.cardId);
                content += `  ${i+1}. ${card?.name || c.cardId} ${c.isReversed ? '(Fordított)' : ''}\n`;
            });
            if (r.notes) content += `Jegyzet:\n${r.notes}\n`;
            content += `\n`;
        });
        downloadFile(content, `tarot_journal_${new Date().toISOString().slice(0,10)}.txt`, 'text/plain');
    };

    const handleExportImage = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 630; // OG Image size
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Background
        const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
        gradient.addColorStop(0, '#312e81');
        gradient.addColorStop(1, '#be185d');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1200, 630);

        // Overlay pattern (dots)
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        for(let i=0; i<100; i++) {
            ctx.beginPath();
            ctx.arc(Math.random()*1200, Math.random()*630, Math.random()*4, 0, Math.PI*2);
            ctx.fill();
        }

        // Card Panel
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.roundRect(100, 100, 1000, 430, 40);
        ctx.fill();
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)'; // Gold
        ctx.lineWidth = 4;
        ctx.stroke();

        // Title
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 60px Cinzel';
        ctx.textAlign = 'center';
        ctx.fillText("Arkánum Profil", 600, 200);

        // User Info
        ctx.fillStyle = 'white';
        ctx.font = '40px Lato';
        ctx.fillText(currentUser?.name || "Utazó", 600, 280);

        // Stats Row
        ctx.font = 'bold 30px Lato';
        ctx.fillStyle = '#e2e8f0';

        ctx.fillText(`Szint: ${currentUser?.level || 1}`, 300, 400);
        ctx.fillText(`Húzások: ${readings.length}`, 600, 400);
        ctx.fillText(`XP: ${currentUser?.xp || 0}`, 900, 400);

        // Footer
        ctx.font = 'italic 20px Lato';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText(new Date().toLocaleDateString(), 600, 500);

        // Trigger Download
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = `tarot_summary_${new Date().toISOString().slice(0,10)}.png`;
        a.click();
    };

    const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImporting(true);
        try {
            const success = await importData(file);
            if (success) {
                showToast("Sikeres importálás!", "success");
            } else {
                showToast("Hiba az importálás során.", "info");
            }
        } catch (err) {
            showToast("Kritikus hiba.", "info");
        } finally {
            setImporting(false);
            e.target.value = ''; // Reset input
        }
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto pb-20">
            <button onClick={onBack} className="mb-6 flex items-center gap-2 font-bold text-white/60 hover:text-gold-400 transition-colors">
                <span>&larr;</span> Vissza
            </button>

            <div className={`p-8 rounded-3xl shadow-2xl border border-white/10 ${theme.cardBg} mb-8 relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                
                <h2 className="text-3xl font-serif font-bold mb-2 text-white">Adatkezelés</h2>
                <p className="text-white/60 mb-8 max-w-2xl font-light">
                    Mentsd le naplódat különböző formátumokban, vagy állítsd vissza egy korábbi állapotot.
                </p>

                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-white/10 pb-1">
                    <button
                        onClick={() => setActiveTab('export')}
                        className={`pb-3 px-4 font-bold uppercase text-xs tracking-widest transition-colors ${activeTab === 'export' ? 'text-gold-400 border-b-2 border-gold-400' : 'text-white/40 hover:text-white'}`}
                    >
                        Exportálás
                    </button>
                    <button
                        onClick={() => setActiveTab('import')}
                        className={`pb-3 px-4 font-bold uppercase text-xs tracking-widest transition-colors ${activeTab === 'import' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-white/40 hover:text-white'}`}
                    >
                        Importálás
                    </button>
                </div>

                {activeTab === 'export' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                        <button onClick={exportData} className="group p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-green-500/20 hover:border-green-500/50 transition-all text-left">
                            <div className="text-3xl mb-2">📦</div>
                            <div className="font-bold text-white mb-1 group-hover:text-green-300">Teljes Mentés (.json)</div>
                            <div className="text-xs text-white/40">Minden adat (napló, beállítások) biztonsági mentése. Ezt töltheted vissza később.</div>
                        </button>

                        <button onClick={handleExportCSV} className="group p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-blue-500/20 hover:border-blue-500/50 transition-all text-left">
                            <div className="text-3xl mb-2">📊</div>
                            <div className="font-bold text-white mb-1 group-hover:text-blue-300">Táblázat (.csv)</div>
                            <div className="text-xs text-white/40">Húzások listája Excel vagy Google Sheets elemzéshez.</div>
                        </button>

                        <button onClick={handleExportTXT} className="group p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-white/30 transition-all text-left">
                            <div className="text-3xl mb-2">📝</div>
                            <div className="font-bold text-white mb-1">Olvasónapló (.txt)</div>
                            <div className="text-xs text-white/40">Formázott szöveges fájl a húzások tartalmával és jegyzeteivel.</div>
                        </button>

                        <button onClick={handleExportImage} className="group p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-pink-500/20 hover:border-pink-500/50 transition-all text-left">
                            <div className="text-3xl mb-2">🖼️</div>
                            <div className="font-bold text-white mb-1 group-hover:text-pink-300">Összegző Kártya (.png)</div>
                            <div className="text-xs text-white/40">Grafikus összefoglaló a profilodról és a statisztikáidról.</div>
                        </button>
                    </div>
                )}

                {activeTab === 'import' && (
                    <div className="animate-fade-in">
                        <div className="border-2 border-dashed border-white/20 rounded-2xl p-10 text-center hover:bg-white/5 transition-colors relative">
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleFileImport}
                                disabled={importing}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="text-4xl mb-4 text-blue-400">📂</div>
                            <h3 className="font-bold text-white text-lg mb-2">Kattints vagy húzd ide a fájlt</h3>
                            <p className="text-sm text-white/50 mb-4">Csak korábban exportált .json fájl támogatott.</p>
                            {importing && <div className="text-gold-400 font-bold animate-pulse">Feldolgozás...</div>}
                        </div>
                        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-3 items-start">
                            <span className="text-xl">⚠️</span>
                            <div className="text-sm text-yellow-200/80">
                                <strong>Figyelem:</strong> Az importálás felülírhatja a jelenlegi adataidat. Érdemes előtte biztonsági mentést készíteni a mostani állapotról.
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Secondary Actions (Cloud/Install) - De-emphasized */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60 hover:opacity-100 transition-opacity">
                 {/* Cloud Sync Small */}
                 <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex items-center justify-between gap-4">
                    <div>
                        <div className="font-bold text-blue-400 text-xs uppercase tracking-widest mb-1">Felhő Szinkron</div>
                        <div className="text-xs text-white/50">{isCloudAvailable ? 'Elérhető' : 'Offline'}</div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={syncToCloud} disabled={!isCloudAvailable} className="px-3 py-1 bg-blue-900/50 hover:bg-blue-800 rounded text-xs text-blue-200">Mentés</button>
                        <button onClick={loadFromCloud} disabled={!isCloudAvailable} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-xs text-white">Letöltés</button>
                    </div>
                 </div>

                 {/* Install Small */}
                 {installPrompt && (
                     <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex items-center justify-between gap-4">
                        <div>
                            <div className="font-bold text-gold-400 text-xs uppercase tracking-widest mb-1">Alkalmazás</div>
                            <div className="text-xs text-white/50">Offline használathoz</div>
                        </div>
                        <button onClick={triggerInstall} className="px-3 py-1 bg-gold-900/50 hover:bg-gold-800 rounded text-xs text-gold-200">Telepítés</button>
                     </div>
                 )}
            </div>

        </div>
    );
};
