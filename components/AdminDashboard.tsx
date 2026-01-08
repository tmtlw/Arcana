
import React, { useState, useEffect } from 'react';
import { useTarot } from '../context/TarotContext';
import { AdminService } from '../services/adminService';
import { UpdateService, UpdateResponse } from '../services/UpdateService';
import { User, Reading, Spread, DeckMeta, Lesson } from '../types';
import { MarkdownEditor, MarkdownRenderer } from './MarkdownSupport';

type AdminTab = 'users' | 'readings' | 'spreads' | 'decks' | 'lessons' | 'system';

export const AdminDashboard = ({ onBack }: { onBack: () => void }) => {
    const { currentUser, showToast } = useTarot();
    const [activeTab, setActiveTab] = useState<AdminTab>('system'); // Default to System for quick update access
    const [loading, setLoading] = useState(false);
    
    // Data States
    const [users, setUsers] = useState<User[]>([]);
    const [readings, setReadings] = useState<Reading[]>([]);
    const [spreads, setSpreads] = useState<Spread[]>([]);
    const [decks, setDecks] = useState<DeckMeta[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);

    // System States
    const [systemInfo, setSystemInfo] = useState<any>(null);
    const [updateCheckResult, setUpdateCheckResult] = useState<UpdateResponse | null>(null);
    const [backups, setBackups] = useState<string[]>([]);
    const [updateLoading, setUpdateLoading] = useState(false);

    // Detail Modal State
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    
    // Edit Modal State
    const [isEditingLesson, setIsEditingLesson] = useState(false);
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

    useEffect(() => {
        if (!currentUser?.isAdmin) {
            onBack();
            return;
        }
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            switch (activeTab) {
                case 'users': setUsers(await AdminService.getAllUsers()); break;
                case 'readings': setReadings(await AdminService.getGlobalReadings()); break;
                case 'spreads': setSpreads(await AdminService.getGlobalSpreads()); break;
                case 'decks': setDecks(await AdminService.getGlobalDecks()); break;
                case 'lessons': setLessons(await AdminService.getGlobalLessons()); break;
                case 'system': await loadSystemData(); break;
            }
        } catch (e) {
            alert("Hiba az adatok betöltésekor: " + e);
        } finally {
            setLoading(false);
        }
    };

    const loadSystemData = async () => {
        try {
            // Load Version
            const vRes = await fetch('./version.json');
            if (vRes.ok) {
                setSystemInfo(await vRes.json());
            }
            // Load Backups
            const bRes = await UpdateService.listBackups();
            if (bRes.status === 'success' && bRes.backups) {
                setBackups(bRes.backups);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleCheckUpdate = async () => {
        setUpdateLoading(true);
        try {
            const res = await UpdateService.checkForUpdates();
            setUpdateCheckResult(res);
            if (res.has_update) {
                showToast("Új frissítés érhető el!", "success");
            } else {
                showToast("A rendszer naprakész.", "info");
            }
        } catch (e) {
            showToast("Hiba a frissítés ellenőrzésekor.", "error");
        } finally {
            setUpdateLoading(false);
        }
    };

    const handlePerformUpdate = async () => {
        if (!confirm("Biztosan frissíteni szeretnéd a rendszert? A folyamat előtt biztonsági mentés készül.")) return;
        setUpdateLoading(true);
        try {
            const res = await UpdateService.performUpdate();
            if (res.status === 'success') {
                alert(`Sikeres frissítés! (Backup ID: ${res.backup_id}) Az oldal újratöltődik...`);
                window.location.reload();
            } else {
                alert("Hiba történt: " + res.message);
            }
        } catch (e) {
            alert("Végzetes hiba a frissítés során.");
        } finally {
            setUpdateLoading(false);
        }
    };

    const handleRestoreBackup = async (id: string) => {
        if (!confirm(`Biztosan visszaállítod ezt a verziót: ${id}? A jelenlegi állapot elveszhet.`)) return;
        setUpdateLoading(true);
        try {
            const res = await UpdateService.restoreBackup(id);
            if (res.status === 'success') {
                alert("Sikeres visszaállítás! Az oldal újratöltődik...");
                window.location.reload();
            } else {
                alert("Hiba történt: " + res.message);
            }
        } catch (e) {
            alert("Végzetes hiba a visszaállítás során.");
        } finally {
            setUpdateLoading(false);
        }
    };

    const handleDelete = async (id: string, userId: string | undefined, type: 'user' | 'reading' | 'spread' | 'deck' | 'lesson') => {
        if (!confirm("⚠️ ADMIN FIGYELMEZTETÉS: Biztosan törlöd ezt az elemet? Ez a művelet visszavonhatatlan és a felhasználó privát adatbázisából is töröl!")) return;

        if (!userId && type !== 'user') {
            alert("Hiba: A tulajdonos ID-ja nem azonosítható.");
            return;
        }

        try {
            switch (type) {
                case 'user':
                    await AdminService.banUser(id);
                    setUsers(prev => prev.filter(u => u.id !== id));
                    break;
                case 'reading':
                    await AdminService.deleteReading(userId!, id);
                    setReadings(prev => prev.filter(r => r.id !== id));
                    break;
                case 'spread':
                    await AdminService.deleteSpread(userId!, id);
                    setSpreads(prev => prev.filter(s => s.id !== id));
                    break;
                case 'deck':
                    await AdminService.deleteDeck(userId!, id);
                    setDecks(prev => prev.filter(d => d.id !== id));
                    break;
                case 'lesson':
                    // If it is a public lesson (system override), delete from public_lessons
                    if (lessons.find(l => l.id === id)?.isPublic) {
                        await AdminService.deletePublicLesson(id);
                    } else {
                        await AdminService.deleteLesson(userId!, id);
                    }
                    setLessons(prev => prev.filter(l => l.id !== id));
                    break;
            }
        } catch (e) {
            alert("Hiba a törléskor (Jogosultság? Ellenőrizd a rules fájlt): " + e);
        }
    };

    const openEditLesson = (lesson: Lesson) => {
        setEditingLesson({ ...lesson });
        setIsEditingLesson(true);
    };

    const saveEditedLesson = async () => {
        if (!editingLesson) return;
        try {
            await AdminService.saveSystemLesson(editingLesson);
            showToast("Lecke sikeresen felülírva a szerveren!", "success");
            setIsEditingLesson(false);
            loadData(); // Refresh list
        } catch (e) {
            alert("Hiba a mentéskor: " + e);
        }
    };

    // --- Helper for Masking Sensitive Data ---
    const maskData = (data: string | undefined) => {
        if (!data) return '-';
        return '******** (Titkosítva)';
    };

    // --- Components ---

    const TabButton = ({ id, label, icon }: { id: AdminTab, label: string, icon: string }) => (
        <button 
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-3 px-6 py-4 text-sm font-bold uppercase tracking-wider transition-colors w-full text-left border-l-4 ${activeTab === id ? 'bg-[#2a2a3c] border-red-500 text-white' : 'border-transparent text-gray-500 hover:bg-[#2a2a3c] hover:text-gray-300'}`}
        >
            <span className="text-lg">{icon}</span>
            {label}
        </button>
    );

    const DeleteButton = ({ onClick }: { onClick: () => void }) => (
        <button onClick={(e) => { e.stopPropagation(); onClick(); }} className="bg-red-500/10 hover:bg-red-600 hover:text-white text-red-500 px-3 py-1 rounded text-xs font-bold uppercase transition-colors">
            Törlés
        </button>
    );

    const StatusBadge = ({ isPublic }: { isPublic?: boolean }) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${isPublic ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
            {isPublic ? 'Publikus' : 'Privát'}
        </span>
    );

    const DetailModal = () => {
        if (!selectedItem) return null;
        
        let displayItem = { ...selectedItem };
        if (activeTab === 'users') {
            displayItem.realName = maskData(displayItem.realName);
            displayItem.birthTime = maskData(displayItem.birthTime);
        }

        return (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setSelectedItem(null)}>
                <div className="bg-[#1e1e2e] w-full max-w-2xl rounded-2xl p-6 border border-white/10 max-h-[80vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-white">Részletes Adatok</h3>
                        <button onClick={() => setSelectedItem(null)} className="text-gray-500 hover:text-white text-2xl">✕</button>
                    </div>
                    
                    {activeTab === 'users' && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded mb-4 text-xs text-yellow-200">
                            🔒 Adatvédelmi okokból a személyes adatok (valódi név, születési idő) maszkolva vannak.
                        </div>
                    )}

                    <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono bg-black/30 p-4 rounded-xl border border-white/5 overflow-x-auto">
                        {JSON.stringify(displayItem, null, 2)}
                    </pre>
                </div>
            </div>
        );
    };

    const EditLessonModal = () => {
        if (!isEditingLesson || !editingLesson) return null;
        
        return (
            <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4">
                <div className="bg-[#1e1e2e] w-full max-w-4xl h-[90vh] rounded-2xl p-6 border border-white/10 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-white">Lecke Szerkesztése ({editingLesson.id})</h3>
                        <button onClick={() => setIsEditingLesson(false)} className="text-gray-500 hover:text-white text-2xl">✕</button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Cím</label>
                            <input 
                                value={editingLesson.title} 
                                onChange={e => setEditingLesson({...editingLesson, title: e.target.value})}
                                className="w-full bg-black/30 border border-white/10 rounded p-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Leírás</label>
                            <textarea 
                                value={editingLesson.description} 
                                onChange={e => setEditingLesson({...editingLesson, description: e.target.value})}
                                className="w-full bg-black/30 border border-white/10 rounded p-2 text-white h-20 resize-none"
                            />
                        </div>
                        <div className="flex-1 flex flex-col">
                            <label className="block text-xs font-bold text-gray-500 mb-1">Tartalom (Markdown támogatott)</label>
                            <MarkdownEditor
                                value={editingLesson.content}
                                onChange={(val) => setEditingLesson({...editingLesson, content: val})}
                                height="h-80"
                            />
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-end gap-2">
                        <button onClick={() => setIsEditingLesson(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Mégse</button>
                        <button onClick={saveEditedLesson} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded shadow-lg">Mentés & Publikálás</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#13131a] text-gray-300 font-sans animate-fade-in flex flex-col md:flex-row">
            {selectedItem && <DetailModal />}
            {isEditingLesson && <EditLessonModal />}
            
            {/* Sidebar */}
            <div className="w-full md:w-64 bg-[#1e1e2e] flex-shrink-0 flex flex-col border-r border-white/5">
                <div className="p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold text-white tracking-widest uppercase">Admin Pult</h2>
                    <p className="text-xs text-red-400 mt-1 font-bold">⚠️ Isten Mód (Mindent lát)</p>
                </div>
                <nav className="flex-1 py-4">
                    <TabButton id="system" label="Rendszer & Frissítés" icon="🖥️" />
                    <div className="my-4 border-t border-white/5"></div>
                    <TabButton id="readings" label="Minden Húzás" icon="📜" />
                    <TabButton id="spreads" label="Minden Kirakás" icon="💠" />
                    <TabButton id="decks" label="Minden Pakli" icon="🎨" />
                    <TabButton id="lessons" label="Minden Lecke" icon="🎓" />
                    <div className="my-4 border-t border-white/5"></div>
                    <TabButton id="users" label="Felhasználók" icon="👤" />
                </nav>
                <div className="p-4 border-t border-white/5">
                    <button onClick={onBack} className="w-full py-3 rounded bg-white/5 hover:bg-white/10 text-xs font-bold uppercase text-white transition-colors">
                        &larr; Kilépés
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex flex-col h-screen">
                <header className="p-6 bg-[#1e1e2e] border-b border-white/5 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-white">
                            {activeTab === 'system' && 'Rendszer Állapot & Frissítés Kezelő'}
                            {activeTab === 'users' && 'Összes Regisztrált Felhasználó (Személyes adatok védve)'}
                            {activeTab === 'readings' && 'Rendszernapló: Összes Húzás (Privát is látható)'}
                            {activeTab === 'spreads' && 'Rendszernapló: Egyéni Kirakások'}
                            {activeTab === 'decks' && 'Rendszernapló: Feltöltött Paklik'}
                            {activeTab === 'lessons' && 'Rendszernapló: Létrehozott Leckék (Alap + Egyéni)'}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            Figyelem: A törlés végleges és a felhasználó saját fiókjából is eltávolítja az adatot.
                        </p>
                    </div>
                    <button onClick={loadData} className="text-xs bg-[#2a2a3c] hover:bg-[#3a3a4e] px-4 py-2 rounded text-white transition-colors">
                        Frissítés ↻
                    </button>
                </header>

                <div className="flex-1 overflow-auto p-6 custom-scrollbar">
                    {loading ? (
                        <div className="text-center py-20 text-white/20">Adatok betöltése az univerzumból...</div>
                    ) : (
                        <div className="w-full">

                            {/* SYSTEM TAB (UPDATER) */}
                            {activeTab === 'system' && (
                                <div className="space-y-8 max-w-4xl mx-auto">
                                    {/* Version Info Card */}
                                    <div className="bg-[#2a2a3c] rounded-2xl p-6 border border-white/10">
                                        <h4 className="text-xl font-bold text-white mb-4">Rendszer Információ</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="bg-black/20 p-4 rounded-xl">
                                                <div className="text-xs text-gray-500 uppercase tracking-widest">Jelenlegi Verzió</div>
                                                <div className="text-2xl font-bold text-gold-400">{systemInfo?.version || 'Ismeretlen'}</div>
                                            </div>
                                            <div className="bg-black/20 p-4 rounded-xl">
                                                <div className="text-xs text-gray-500 uppercase tracking-widest">Utolsó Frissítés</div>
                                                <div className="text-sm font-bold text-white">{systemInfo?.last_update || '-'}</div>
                                            </div>
                                            <div className="bg-black/20 p-4 rounded-xl">
                                                <div className="text-xs text-gray-500 uppercase tracking-widest">Commit SHA</div>
                                                <div className="text-xs font-mono text-gray-400 break-all">{systemInfo?.commit_sha || '-'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Update Actions */}
                                    <div className="bg-[#2a2a3c] rounded-2xl p-6 border border-white/10">
                                        <h4 className="text-xl font-bold text-white mb-4">Frissítés Kezelő</h4>

                                        <div className="flex items-center gap-4 mb-6">
                                            <button
                                                onClick={handleCheckUpdate}
                                                disabled={updateLoading}
                                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2"
                                            >
                                                {updateLoading ? 'Ellenőrzés...' : 'Frissítések Keresése'}
                                            </button>

                                            {updateCheckResult && (
                                                <div className={`px-4 py-3 rounded-xl border ${updateCheckResult.has_update ? 'bg-green-500/20 border-green-500 text-green-300' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                                                    {updateCheckResult.message}
                                                    {updateCheckResult.has_update && (
                                                        <span className="ml-2 font-mono text-xs">({updateCheckResult.remote_sha?.substring(0,7)})</span>
                                                    )}
                                                </div>
                                            )}

                                            {updateCheckResult?.has_update && (
                                                <button
                                                    onClick={handlePerformUpdate}
                                                    disabled={updateLoading}
                                                    className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold animate-pulse"
                                                >
                                                    🚀 Frissítés Indítása
                                                </button>
                                            )}
                                        </div>

                                        {/* Backups List */}
                                        <div className="border-t border-white/10 pt-6">
                                            <h5 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-widest">Biztonsági Mentések</h5>
                                            {backups.length === 0 ? (
                                                <div className="text-sm text-gray-600 italic">Nincsenek mentések.</div>
                                            ) : (
                                                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                                                    {backups.map(backup => (
                                                        <div key={backup} className="flex justify-between items-center bg-black/20 p-3 rounded-lg hover:bg-black/30 transition-colors">
                                                            <span className="font-mono text-sm text-gray-300">{backup}</span>
                                                            <button
                                                                onClick={() => handleRestoreBackup(backup)}
                                                                className="bg-red-500/10 hover:bg-red-600 hover:text-white text-red-400 px-3 py-1 rounded text-xs font-bold uppercase transition-colors"
                                                            >
                                                                Visszaállítás
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* USER TABLE */}
                            {activeTab === 'users' && (
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead className="bg-[#2a2a3c] text-white/50 text-xs uppercase sticky top-0">
                                        <tr>
                                            <th className="p-4">Megjelenített Név / ID</th>
                                            <th className="p-4">Személyes Adatok</th>
                                            <th className="p-4">Státusz</th>
                                            <th className="p-4 text-right">Művelet</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {users.map(u => (
                                            <tr key={u.id} className="hover:bg-[#1e1e2e] transition-colors cursor-pointer" onClick={() => setSelectedItem(u)}>
                                                <td className="p-4">
                                                    <div className="font-bold text-white">{u.name}</div>
                                                    <div className="text-xs text-gray-500 font-mono">{u.id}</div>
                                                </td>
                                                <td className="p-4 text-gray-400 font-mono text-xs">
                                                    <div>Valódi Név: {maskData(u.realName)}</div>
                                                    <div>Születési idő: {maskData(u.birthTime)}</div>
                                                    <div>Születési dátum: {u.birthDate || '-'}</div>
                                                </td>
                                                <td className="p-4 text-gray-400">
                                                    {u.isAdmin ? <span className="text-red-400 font-bold">ADMIN</span> : (u.isAnonymous ? 'Vendég' : 'Regisztrált')}
                                                    <br/>
                                                    <span className="text-xs opacity-50">Lvl {u.level || 1}</span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    {!u.isAdmin && <DeleteButton onClick={() => handleDelete(u.id, u.id, 'user')} />}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {/* READINGS TABLE */}
                            {activeTab === 'readings' && (
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead className="bg-[#2a2a3c] text-white/50 text-xs uppercase sticky top-0">
                                        <tr>
                                            <th className="p-4">Tulajdonos (ID)</th>
                                            <th className="p-4">Kérdés / Jegyzet</th>
                                            <th className="p-4">Dátum / Állapot</th>
                                            <th className="p-4 text-right">Művelet</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {readings.map(r => (
                                            <tr key={r.id} className="hover:bg-[#1e1e2e] transition-colors cursor-pointer" onClick={() => setSelectedItem(r)}>
                                                <td className="p-4">
                                                    <div className="font-bold text-white text-xs font-mono">{r.userId}</div>
                                                    <div className="text-[10px] text-gray-500">{r.authorName || 'Ismeretlen'}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-gray-300 italic truncate max-w-xs">"{r.question || 'Nincs kérdés'}"</div>
                                                    <div className="text-xs text-gray-500 truncate max-w-xs">{r.notes ? `📝 ${r.notes}` : '-'}</div>
                                                </td>
                                                <td className="p-4 text-gray-400">
                                                    {new Date(r.date).toLocaleDateString()}
                                                    <br/>
                                                    <StatusBadge isPublic={r.isPublic} />
                                                </td>
                                                <td className="p-4 text-right">
                                                    <DeleteButton onClick={() => handleDelete(r.id, r.userId, 'reading')} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {/* SPREADS TABLE */}
                            {activeTab === 'spreads' && (
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead className="bg-[#2a2a3c] text-white/50 text-xs uppercase sticky top-0">
                                        <tr>
                                            <th className="p-4">Kirakás Neve</th>
                                            <th className="p-4">Tulajdonos</th>
                                            <th className="p-4">Állapot</th>
                                            <th className="p-4 text-right">Művelet</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {spreads.map(s => (
                                            <tr key={s.id} className="hover:bg-[#1e1e2e] transition-colors cursor-pointer" onClick={() => setSelectedItem(s)}>
                                                <td className="p-4 font-bold text-white">
                                                    {s.name}
                                                    <div className="text-xs font-normal text-gray-500 truncate max-w-xs">{s.description}</div>
                                                </td>
                                                <td className="p-4 text-gray-400 text-xs font-mono">{s.userId || 'System/Unknown'}</td>
                                                <td className="p-4 text-gray-400"><StatusBadge isPublic={s.isPublic} /></td>
                                                <td className="p-4 text-right">
                                                    <DeleteButton onClick={() => handleDelete(s.id, s.userId, 'spread')} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {/* DECKS TABLE */}
                            {activeTab === 'decks' && (
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead className="bg-[#2a2a3c] text-white/50 text-xs uppercase sticky top-0">
                                        <tr>
                                            <th className="p-4">Pakli Neve</th>
                                            <th className="p-4">Tulajdonos</th>
                                            <th className="p-4">Állapot</th>
                                            <th className="p-4 text-right">Művelet</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {decks.map(d => (
                                            <tr key={d.id} className="hover:bg-[#1e1e2e] transition-colors cursor-pointer" onClick={() => setSelectedItem(d)}>
                                                <td className="p-4 font-bold text-white">{d.name}</td>
                                                <td className="p-4 text-gray-400 text-xs font-mono">{d.userId || 'System'}</td>
                                                <td className="p-4 text-gray-400"><StatusBadge isPublic={d.isPublic} /></td>
                                                <td className="p-4 text-right">
                                                    <DeleteButton onClick={() => handleDelete(d.id, d.userId, 'deck')} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {/* LESSONS TABLE */}
                            {activeTab === 'lessons' && (
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead className="bg-[#2a2a3c] text-white/50 text-xs uppercase sticky top-0">
                                        <tr>
                                            <th className="p-4">Lecke Címe</th>
                                            <th className="p-4">Tulajdonos</th>
                                            <th className="p-4">Állapot</th>
                                            <th className="p-4 text-right">Művelet</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {lessons.map(l => (
                                            <tr key={l.id} className="hover:bg-[#1e1e2e] transition-colors cursor-pointer" onClick={() => setSelectedItem(l)}>
                                                <td className="p-4 font-bold text-white">
                                                    {l.title}
                                                    <div className="text-xs font-normal text-gray-500">{l.category} • {l.difficulty}</div>
                                                </td>
                                                <td className="p-4 text-gray-400 text-xs font-mono">{l.userId || 'System'}</td>
                                                <td className="p-4 text-gray-400"><StatusBadge isPublic={l.isPublic} /></td>
                                                <td className="p-4 text-right flex justify-end gap-2">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); openEditLesson(l); }} 
                                                        className="bg-blue-500/10 hover:bg-blue-600 hover:text-white text-blue-400 px-3 py-1 rounded text-xs font-bold uppercase transition-colors"
                                                    >
                                                        Szerkesztés
                                                    </button>
                                                    <DeleteButton onClick={() => handleDelete(l.id, l.userId, 'lesson')} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
