
import { ShopItem } from '../constants/shopItems';
import React, { useState, useEffect } from 'react';
import { useTarot } from '../context/TarotContext';
import { AdminService } from '../services/adminService';
import { CommunityService } from '../services/communityService';
import { User, Reading, Spread, DeckMeta, Lesson, TarotNotification } from '../types';
import { MarkdownEditor, MarkdownRenderer } from './MarkdownSupport';
import { ContentEditor } from './ContentEditor';

type AdminTab = 'users' | 'readings' | 'spreads' | 'decks' | 'lessons' | 'system' | 'content' | 'marketplace';

export const AdminDashboard = ({ onBack }: { onBack: () => void }) => {
    const { currentUser, showToast } = useTarot();
    const [activeTab, setActiveTab] = useState<AdminTab>('system');
    const [loading, setLoading] = useState(false);
    
    // Data States
    const [users, setUsers] = useState<User[]>([]);
    const [readings, setReadings] = useState<Reading[]>([]);
    const [spreads, setSpreads] = useState<Spread[]>([]);
    const [decks, setDecks] = useState<DeckMeta[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [marketItems, setMarketItems] = useState<any[]>([]);

    // System States
    const [systemInfo, setSystemInfo] = useState<any>(null);

    // Settings State
    const [enableGeminiSpreadImport, setEnableGeminiSpreadImport] = useState(false);
    const [enableRegistration, setEnableRegistration] = useState(true);
    const [enableShop, setEnableShop] = useState(true);

    // Detail Modal State
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    
    // Edit Modal State
    const [isEditingLesson, setIsEditingLesson] = useState(false);
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

    // Create Market Item State
    const [isCreatingMarketItem, setIsCreatingMarketItem] = useState(false);
    const [newMarketItem, setNewMarketItem] = useState({
        name: '',
        description: '',
        type: 'background',
        cost: 0,
        value: '', // CSS or URL
        previewUrl: '',
        isPremium: false,
        category: 'general'
    });

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
                case 'marketplace':
                    const mItems = await CommunityService.getMarketplaceItems();
                    setMarketItems(mItems);
                    break;
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
            setSystemInfo({ version: __APP_VERSION__, last_update: __BUILD_TIME__, commit_sha: __COMMIT_SHA__ });

            const settings = await CommunityService.getGlobalSettings();
            if (settings) {
                setEnableGeminiSpreadImport(settings.enableGeminiSpreadImport || false);
                setEnableRegistration(settings.enableRegistration !== undefined ? settings.enableRegistration : true);
                setEnableShop(settings.enableShop !== undefined ? settings.enableShop : true);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const saveSettings = async () => {
        try {
            await CommunityService.saveGlobalSettings({
                enableGeminiSpreadImport,
                enableRegistration,
                enableShop
            });
            showToast("Beállítások mentve!", "success");
        } catch (e) {
            showToast("Hiba a mentéskor.", "error");
        }
    };

    const handleCreateMarketItem = async () => {
        if (!newMarketItem.name || !newMarketItem.type) {
            alert("Név és típus kötelező!");
            return;
        }

        const id = `item_${Date.now()}`;
        const item = {
            id,
            ...newMarketItem,
            type: newMarketItem.type as ShopItem['type'],
            createdBy: currentUser?.id || 'admin'
        };

        const success = await CommunityService.createMarketplaceItem(item);
        if (success) {
            showToast("Piactér elem létrehozva!", "success");
            setIsCreatingMarketItem(false);
            setNewMarketItem({
                name: '', description: '', type: 'background', cost: 0, value: '', previewUrl: '', isPremium: false, category: 'general'
            });
            loadData();
        } else {
            showToast("Hiba létrehozáskor.", "error");
        }
    };

    const handleDelete = async (id: string, userId: string | undefined, type: 'user' | 'reading' | 'spread' | 'deck' | 'lesson' | 'market', itemName?: string) => {
        const reason = prompt("Kérlek indokold meg a törlést (az érintett felhasználó értesítést kap róla):", "Szabályzat megsértése");
        if (reason === null) return;

        try {
            if (userId && type !== 'market') {
                const notif: TarotNotification = {
                    id: `admin_del_${Date.now()}`,
                    userId: userId,
                    type: 'system_alert',
                    title: 'Rendszerüzenet: Tartalom törölve',
                    message: `Egy általad létrehozott tartalom (${type}: ${itemName || id}) törlésre került adminisztrátor által. Indoklás: ${reason}`,
                    isRead: false,
                    createdAt: new Date().toISOString()
                };
                await CommunityService.addNotification(notif);
            }

            switch (type) {
                case 'user':
                    if (userId) await AdminService.banUser(id);
                    setUsers(prev => prev.filter(u => u.id !== id));
                    break;
                case 'reading':
                    if (userId) await AdminService.deleteReading(userId, id);
                    setReadings(prev => prev.filter(r => r.id !== id));
                    break;
                case 'spread':
                    if (userId) await AdminService.deleteSpread(userId, id);
                    setSpreads(prev => prev.filter(s => s.id !== id));
                    break;
                case 'deck':
                    if (userId) await AdminService.deleteDeck(userId, id);
                    setDecks(prev => prev.filter(d => d.id !== id));
                    break;
                case 'lesson':
                    if (userId) {
                        if (lessons.find(l => l.id === id)?.isPublic) {
                            await AdminService.deletePublicLesson(id);
                        } else {
                            await AdminService.deleteLesson(userId, id);
                        }
                    }
                    setLessons(prev => prev.filter(l => l.id !== id));
                    break;
                case 'market':
                    await CommunityService.deleteMarketplaceItem(id);
                    setMarketItems(prev => prev.filter(i => i.id !== id));
                    break;
            }
            showToast("Sikeres törlés.", "success");
        } catch (e) {
            alert("Hiba a törléskor: " + e);
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
            loadData();
        } catch (e) {
            alert("Hiba a mentéskor: " + e);
        }
    };

    const maskData = (data: string | undefined) => {
        if (!data) return '-';
        return '******** (Titkosítva)';
    };

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

    const CreateMarketItemModal = () => {
        if (!isCreatingMarketItem) return null;
        return (
            <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4">
                <div className="bg-[#1e1e2e] w-full max-w-md rounded-2xl p-6 border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-4">Új Piactér Elem</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500">Típus</label>
                            <select
                                value={newMarketItem.type}
                                onChange={e => setNewMarketItem({...newMarketItem, type: e.target.value})}
                                className="w-full bg-black/30 border border-white/10 rounded p-2 text-white"
                            >
                                <option value="background">Háttér</option>
                                <option value="cover">Kártya Hátlap</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Név</label>
                            <input
                                value={newMarketItem.name}
                                onChange={e => setNewMarketItem({...newMarketItem, name: e.target.value})}
                                className="w-full bg-black/30 border border-white/10 rounded p-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Leírás</label>
                            <input
                                value={newMarketItem.description}
                                onChange={e => setNewMarketItem({...newMarketItem, description: e.target.value})}
                                className="w-full bg-black/30 border border-white/10 rounded p-2 text-white"
                            />
                        </div>
                         <div>
                            <label className="text-xs text-gray-500">Kategória (pl. 'nature', 'dark')</label>
                            <input
                                value={newMarketItem.category}
                                onChange={e => setNewMarketItem({...newMarketItem, category: e.target.value})}
                                className="w-full bg-black/30 border border-white/10 rounded p-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Ár (Pont)</label>
                            <input
                                type="number"
                                value={newMarketItem.cost}
                                onChange={e => setNewMarketItem({...newMarketItem, cost: parseInt(e.target.value)})}
                                className="w-full bg-black/30 border border-white/10 rounded p-2 text-white"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Érték (CSS Gradient vagy Kép URL)</label>
                            <textarea
                                value={newMarketItem.value}
                                onChange={e => setNewMarketItem({...newMarketItem, value: e.target.value})}
                                className="w-full bg-black/30 border border-white/10 rounded p-2 text-white h-20"
                                placeholder="bg-gradient-to-r from-red-500... VAGY https://..."
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Előnézet URL (Opcionális)</label>
                            <input
                                value={newMarketItem.previewUrl}
                                onChange={e => setNewMarketItem({...newMarketItem, previewUrl: e.target.value})}
                                className="w-full bg-black/30 border border-white/10 rounded p-2 text-white"
                            />
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => setNewMarketItem({...newMarketItem, isPremium: !newMarketItem.isPremium})} className={`px-3 py-1 rounded text-xs border ${newMarketItem.isPremium ? 'bg-gold-500 text-black border-gold-500' : 'border-white/20'}`}>
                                {newMarketItem.isPremium ? 'Prémium' : 'Normál'}
                             </button>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                         <button onClick={() => setIsCreatingMarketItem(false)} className="text-gray-400 px-4 py-2 hover:text-white">Mégse</button>
                         <button onClick={handleCreateMarketItem} className="bg-gold-500 text-black px-4 py-2 rounded font-bold hover:bg-gold-400">Létrehozás</button>
                    </div>
                </div>
            </div>
        );
    };


    return (
        <div className="min-h-screen bg-[#13131a] text-gray-300 font-sans animate-fade-in flex flex-col md:flex-row">
            {selectedItem && <DetailModal />}
            {isEditingLesson && <EditLessonModal />}
            {isCreatingMarketItem && <CreateMarketItemModal />}
            
            <div className="w-full md:w-64 bg-[#1e1e2e] flex-shrink-0 flex flex-col border-r border-white/5">
                <div className="p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold text-white tracking-widest uppercase">Admin Pult</h2>
                    <p className="text-xs text-red-400 mt-1 font-bold">⚠️ Isten Mód (Mindent lát)</p>
                </div>
                <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
                    <TabButton id="system" label="Rendszer" icon="🖥️" />
                    <TabButton id="marketplace" label="Piactér Kezelő" icon="🏷️" />
                    <TabButton id="content" label="Tartalom Szerkesztő" icon="📝" />
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

            <div className="flex-1 overflow-hidden flex flex-col h-screen">
                <header className="p-6 bg-[#1e1e2e] border-b border-white/5 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-white">
                            {activeTab === 'system' && 'Rendszer Állapot'}
                            {activeTab === 'marketplace' && 'Piactér Tartalmak (Hátterek, Borítók)'}
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
                            {activeTab === 'content' && (
                                <ContentEditor />
                            )}

                            {activeTab === 'marketplace' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-bold text-white">Hátterek és Kártya Hátlapok</h4>
                                        <button onClick={() => setIsCreatingMarketItem(true)} className="bg-gold-500 text-black px-4 py-2 rounded font-bold hover:bg-gold-400">
                                            + Új Elem
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {marketItems.map(item => (
                                            <div key={item.id} className="bg-[#2a2a3c] p-4 rounded-xl border border-white/10 flex flex-col gap-2">
                                                <div className="h-20 bg-black/40 rounded overflow-hidden mb-2 relative">
                                                    {item.previewUrl || (item.value && item.value.startsWith('bg-')) ? (
                                                        (item.previewUrl?.startsWith('http') || item.previewUrl?.startsWith('data') || (item.value && item.value.startsWith('bg-'))) ? (
                                                            <div className={`w-full h-full ${item.value.startsWith('bg-') ? item.value : ''}`}>
                                                                {item.previewUrl?.startsWith('http') && <img src={item.previewUrl} className="w-full h-full object-cover" />}
                                                            </div>
                                                        ) : null
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full text-2xl">🖼️</div>
                                                    )}
                                                    <div className="absolute top-1 right-1 bg-black/60 text-white px-2 rounded text-[10px] font-bold uppercase">{item.type}</div>
                                                </div>
                                                <div className="font-bold text-white">{item.name}</div>
                                                <div className="text-xs text-gray-400">{item.description}</div>
                                                <div className="text-xs text-gold-400 font-bold">{item.cost} pont {item.isPremium && '(PREMIUM)'}</div>
                                                <div className="mt-auto pt-2 border-t border-white/5 flex justify-between">
                                                    <span className="text-[10px] text-gray-500 font-mono">{item.id}</span>
                                                    <button onClick={() => handleDelete(item.id, undefined, 'market')} className="text-red-400 hover:text-red-300 text-xs font-bold uppercase">Törlés</button>
                                                </div>
                                            </div>
                                        ))}
                                        {marketItems.length === 0 && <div className="text-gray-500 italic col-span-3 text-center py-10">Nincsenek feltöltött elemek.</div>}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'system' && (
                                <div className="space-y-8 max-w-4xl mx-auto">
                                    <div className="bg-[#2a2a3c] rounded-2xl p-6 border border-white/10">
                                        <h4 className="text-xl font-bold text-white mb-4">Rendszer Információ</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="bg-black/20 p-4 rounded-xl">
                                                <div className="text-xs text-gray-500 uppercase tracking-widest">Jelenlegi Verzió</div>
                                                <div className="text-2xl font-bold text-gold-400">{systemInfo?.version || 'Ismeretlen'}</div>
                                            </div>
                                            <div className="bg-black/20 p-4 rounded-xl">
                                                <div className="text-xs text-gray-500 uppercase tracking-widest">Build ideje</div>
                                                <div className="text-sm font-bold text-white">{systemInfo?.last_update || '-'}</div>
                                            </div>
                                            <div className="bg-black/20 p-4 rounded-xl">
                                                <div className="text-xs text-gray-500 uppercase tracking-widest">Commit SHA</div>
                                                <div className="text-xs font-mono text-gray-400 break-all">{systemInfo?.commit_sha || '-'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-[#2a2a3c] rounded-2xl p-6 border border-white/10 mb-8">
                                        <h4 className="text-xl font-bold text-white mb-4">Globális Beállítások</h4>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl">
                                                <div>
                                                    <div className="font-bold text-white">Regisztráció Engedélyezése</div>
                                                    <div className="text-xs text-gray-500">Új felhasználók regisztrálhatnak az oldalon.</div>
                                                </div>
                                                <button
                                                    onClick={() => setEnableRegistration(!enableRegistration)}
                                                    className={`w-12 h-6 rounded-full p-1 transition-colors ${enableRegistration ? 'bg-green-500' : 'bg-gray-600'}`}
                                                >
                                                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${enableRegistration ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl">
                                                <div>
                                                    <div className="font-bold text-white">Gemini AI Kirakás Import</div>
                                                    <div className="text-xs text-gray-500">Képfelismerés és automatikus kirakás létrehozás engedélyezése.</div>
                                                </div>
                                                <button
                                                    onClick={() => setEnableGeminiSpreadImport(!enableGeminiSpreadImport)}
                                                    className={`w-12 h-6 rounded-full p-1 transition-colors ${enableGeminiSpreadImport ? 'bg-blue-500' : 'bg-gray-600'}`}
                                                >
                                                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${enableGeminiSpreadImport ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl">
                                                <div>
                                                    <div className="font-bold text-white">Piactér & Pontrendszer</div>
                                                    <div className="text-xs text-gray-500">Felhasználók vásárolhatnak tartalmakat pontokért.</div>
                                                </div>
                                                <button
                                                    onClick={() => setEnableShop(!enableShop)}
                                                    className={`w-12 h-6 rounded-full p-1 transition-colors ${enableShop ? 'bg-gold-500' : 'bg-gray-600'}`}
                                                >
                                                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${enableShop ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                                </button>
                                            </div>

                                            {enableGeminiSpreadImport && (
                                                <div className="bg-black/20 p-4 rounded-xl">
                                                    <p className="text-xs text-gray-400">
                                                        A Gemini API kulcs titokként a Cloudflare-ben van tárolva (<code>GEMINI_API_KEY</code>), a felületen nem állítható.
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex justify-end">
                                                <button onClick={saveSettings} className="bg-gold-500 text-black px-6 py-2 rounded-lg font-bold hover:bg-gold-400 transition-colors">
                                                    Beállítások Mentése
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'users' && (
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead className="bg-[#2a2a3c] text-white/50 text-xs uppercase sticky top-0">
                                        <tr>
                                            <th className="p-4">Megjelenített Név / ID</th>
                                            <th className="p-4">Aktivitás</th>
                                            <th className="p-4">Státusz</th>
                                            <th className="p-4 text-right">Művelet</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {users.map(u => {
                                            return (
                                            <tr key={u.id} className="hover:bg-[#1e1e2e] transition-colors cursor-pointer" onClick={() => setSelectedItem(u)}>
                                                <td className="p-4">
                                                    <div className="font-bold text-white">{u.name}</div>
                                                    <div className="text-xs text-gray-500 font-mono">{u.id}</div>
                                                </td>
                                                <td className="p-4 text-gray-400 font-mono text-xs">
                                                    <div>Reg: {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</div>
                                                    <div>Login: {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'N/A'}</div>
                                                </td>
                                                <td className="p-4 text-gray-400">
                                                    {u.isAdmin ? <span className="text-red-400 font-bold">ADMIN</span> : (u.isAnonymous ? 'Vendég' : 'Regisztrált')}
                                                    <br/>
                                                    <span className="text-xs opacity-50">Lvl {u.level || 1}</span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    {!u.isAdmin && <DeleteButton onClick={() => handleDelete(u.id, u.id, 'user', u.name)} />}
                                                </td>
                                            </tr>
                                        )})}
                                    </tbody>
                                </table>
                            )}

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
                                                    <DeleteButton onClick={() => handleDelete(r.id, r.userId, 'reading', r.question)} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

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
                                                    <DeleteButton onClick={() => handleDelete(s.id, s.userId, 'spread', s.name)} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

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
                                                    <DeleteButton onClick={() => handleDelete(d.id, d.userId, 'deck', d.name)} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

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
                                                    <DeleteButton onClick={() => handleDelete(l.id, l.userId, 'lesson', l.title)} />
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
