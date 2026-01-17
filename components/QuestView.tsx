
import React, { useState, useEffect, useMemo } from 'react';
import { useTarot } from '../context/TarotContext';
import { Quest, UserQuestProgress, Card } from '../types';
import { QuestService, DAILY_QUESTS, WEEKLY_QUESTS } from '../services/questService';
import { FULL_DECK } from '../constants';

const TAROT_EMOJIS = [
    '🔮', '🌙', '☀️', '⭐', '🃏', '🗡️', '🏆', '🌿', '🪙', '🔥',
    '💧', '🌬️', '🏔️', '🕯️', '🗝️', '📜', '⚖️', '🦁', '🐍', '🦅',
    '🐟', '💀', '🖤', '♾️', '🔔', '🌍', '👑', '🛡️', '🎭', '🎡',
    '🏺', '🏹', '🦂', '🦀', '👯', '🐂', '🐏', '🐐', '🌊', '🪨',
    '🪵', '🍷', '💰', '🧿', '📖', '🚪', '🏰', '🏚️', '👼', '👹',
    '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔'
];

const ZODIAC_SIGNS = ["Kos", "Bika", "Ikrek", "Rák", "Oroszlán", "Szűz", "Mérleg", "Skorpió", "Nyilas", "Bak", "Vízöntő", "Halak"];
const SABBATS = ["Yule", "Imbolc", "Ostara", "Beltane", "Litha", "Lughnasadh", "Mabon", "Samhain"];
const MOON_PHASES = ["Újhold", "Növő Hold", "Telihold", "Fogyó Hold"];
const MONTHS = ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"];

export const QuestView = ({ onBack }: { onBack: () => void }) => {
    const { currentUser, updateUser, showToast, allSpreads } = useTarot();
    const [activeTab, setActiveTab] = useState<'active' | 'community'>('active');
    const [communityQuests, setCommunityQuests] = useState<Quest[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [newQuest, setNewQuest] = useState<Partial<Quest>>({
        title: '',
        description: '',
        target: 1,
        rewardXP: 50,
        type: 'weekly',
        conditionType: 'reading_count',
        conditionDetail: 'any',
        icon: 'fool_bag',
        isPublic: true,
        filterCardType: 'any',
        filterLogic: 'OR',
        filterCardIds: [],
        timeUnit: undefined,
        timeRangeStart: '',
        timeRangeEnd: '',
        visualEmoji: '🔮',
        filterZodiac: '',
        targetSpreadId: ''
    });

    const [cardSearch, setCardSearch] = useState('');

    useEffect(() => {
        if (activeTab === 'community') {
            loadCommunityQuests();
        }
    }, [activeTab]);

    const loadCommunityQuests = async () => {
        setIsLoading(true);
        const quests = await QuestService.getCommunityQuests();
        setCommunityQuests(quests);
        setIsLoading(false);
    };

    const handleCreateQuest = async () => {
        if (!newQuest.title || !newQuest.description) return showToast("Hiányzó adatok!", "info");

        setIsLoading(true);
        const questToSave: Quest = {
            id: `cq_${Date.now()}`,
            ...newQuest as Quest,
            creatorId: currentUser?.id,
            creatorName: currentUser?.name || 'Admin',
            createdAt: new Date().toISOString(),
            likes: 0,
            participants: []
        };

        const id = await QuestService.createQuest(questToSave);
        if (id) {
            showToast("Kihívás létrehozva!", "success");
            setIsCreating(false);
            loadCommunityQuests();
            setNewQuest({
                title: '',
                description: '',
                target: 1,
                rewardXP: 50,
                type: 'weekly',
                conditionType: 'reading_count',
                conditionDetail: 'any',
                icon: 'fool_bag',
                isPublic: true,
                filterCardType: 'any',
                filterLogic: 'OR',
                filterCardIds: [],
                timeUnit: undefined,
                timeRangeStart: '',
                timeRangeEnd: '',
                visualEmoji: '🔮',
                filterZodiac: '',
                targetSpreadId: ''
            });
        } else {
            showToast("Hiba a mentés során.", "info");
        }
        setIsLoading(false);
    };

    const handleJoinQuest = (quest: Quest) => {
        if (!currentUser) return;
        if (currentUser.activeQuests?.some(q => q.questId === quest.id)) {
            return showToast("Már részt veszel ebben a kihívásban!", "info");
        }

        const newProgress: UserQuestProgress = {
            questId: quest.id,
            progress: 0,
            isCompleted: false,
            claimed: false,
            expiresAt: undefined
        };

        updateUser({
            ...currentUser,
            activeQuests: [...(currentUser.activeQuests || []), newProgress]
        });
        showToast("Csatlakoztál a kihíváshoz!", "success");
    };

    const toggleCardId = (id: string) => {
        const currentIds = newQuest.filterCardIds || [];
        if (currentIds.includes(id)) {
            setNewQuest({ ...newQuest, filterCardIds: currentIds.filter(cid => cid !== id) });
        } else {
            setNewQuest({ ...newQuest, filterCardIds: [...currentIds, id] });
        }
    };

    const filteredCards = FULL_DECK.filter(c => c.name.toLowerCase().includes(cardSearch.toLowerCase()));

    const availableSpreads = useMemo(() => {
        if (!allSpreads) return [];
        // Show user's custom spreads AND public/default spreads
        return allSpreads.filter(s => s.isCustom === false || s.userId === currentUser?.id || s.isPublic);
    }, [allSpreads, currentUser]);

    const activeQuests = (currentUser?.activeQuests || []).map(uq => {
        const staticDef = [...DAILY_QUESTS, ...WEEKLY_QUESTS].find(q => q.id === uq.questId);
        const def = staticDef || communityQuests.find(q => q.id === uq.questId) || {
            id: uq.questId, title: "Ismeretlen Küldetés", description: "Betöltés...", target: 1, icon: 'question', type: 'daily'
        } as Quest;
        return { ...uq, def };
    });

    return (
        <div className="animate-fade-in pb-20 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <button onClick={onBack} className="flex items-center gap-2 font-bold text-white/60 hover:text-gold-400">
                    &larr; Vissza
                </button>
                <div className="flex bg-black/40 p-1 rounded-lg">
                    <button onClick={() => setActiveTab('active')} className={`px-4 py-2 rounded text-xs font-bold uppercase transition-colors ${activeTab === 'active' ? 'bg-gold-500 text-black' : 'text-white/50 hover:text-white'}`}>Aktív</button>
                    <button onClick={() => setActiveTab('community')} className={`px-4 py-2 rounded text-xs font-bold uppercase transition-colors ${activeTab === 'community' ? 'bg-gold-500 text-black' : 'text-white/50 hover:text-white'}`}>Közösségi</button>
                </div>
            </div>

            <h2 className="text-3xl font-serif font-bold text-center mb-2 text-gold-400">Kihívások</h2>
            <p className="text-center text-white/40 text-sm mb-10">Teljesíts küldetéseket, gyűjts XP-t és fejlődj!</p>

            {activeTab === 'active' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeQuests.map((item, idx) => {
                        const percent = Math.min(100, Math.round((item.progress / (item.def.target || 1)) * 100));
                        return (
                            <div key={idx} className={`p-4 rounded-xl border flex gap-4 transition-colors ${item.isCompleted ? 'bg-green-900/20 border-green-500/50' : 'glass-panel border-white/10'}`}>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-3xl border flex-shrink-0 ${item.isCompleted ? 'bg-green-500 text-black border-green-400' : 'bg-white/5 text-gold-400 border-white/10'}`}>
                                    {item.def.visualEmoji || (item.def.icon && item.def.icon.length < 5 ? item.def.icon : '⚔️')}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-white">{item.def.title}</h4>
                                        <span className="text-xs font-bold text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded border border-gold-500/20">+{item.def.rewardXP} XP</span>
                                    </div>
                                    <p className="text-xs text-white/60 mb-3">{item.def.description}</p>

                                    {item.def.timeUnit && (
                                        <div className="mb-2 inline-flex gap-2">
                                            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 uppercase font-bold">
                                                ⏱ {item.def.timeUnit} {item.def.timeRangeStart && `(${item.def.timeRangeStart})`}
                                            </span>
                                        </div>
                                    )}

                                    <div className="relative h-2 bg-black/50 rounded-full overflow-hidden">
                                        <div className={`absolute top-0 left-0 h-full transition-all duration-500 ${item.isCompleted ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${percent}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-[10px] mt-1 text-white/40 font-mono">
                                        <span>{item.progress} / {item.def.target}</span>
                                        <span>{percent}%</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {activeQuests.length === 0 && <div className="col-span-full text-center py-10 opacity-50">Nincs aktív küldetésed.</div>}
                </div>
            )}

            {activeTab === 'community' && (
                <div>
                    <div className="flex justify-end mb-6">
                        <button onClick={() => setIsCreating(true)} className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2 rounded-lg font-bold text-white shadow-lg hover:shadow-indigo-500/50 transition-all flex items-center gap-2">
                            <span>+</span> Új Kihívás
                        </button>
                    </div>

                    {isCreating && (
                        <div className="glass-panel p-6 rounded-2xl border border-white/10 mb-8 animate-fade-in relative">
                            <button onClick={() => setIsCreating(false)} className="absolute top-4 right-4 text-white/30 hover:text-white">✕</button>
                            <h3 className="font-bold text-white mb-6 uppercase tracking-widest border-b border-white/10 pb-2">Kihívás Tervező</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] uppercase font-bold text-white/50 mb-1">Cím</label>
                                    <input value={newQuest.title} onChange={e => setNewQuest({...newQuest, title: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded p-2 text-white" placeholder="Pl. Napi Meditáció" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] uppercase font-bold text-white/50 mb-1">Leírás</label>
                                    <textarea value={newQuest.description} onChange={e => setNewQuest({...newQuest, description: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded p-2 text-white h-16 resize-none" placeholder="Mit kell tenni?" />
                                </div>

                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-white/50 mb-1">Cél Típusa</label>
                                    <select value={newQuest.conditionType} onChange={e => setNewQuest({...newQuest, conditionType: e.target.value as any})} className="w-full bg-black/30 border border-white/10 rounded p-2 text-white">
                                        <option value="reading_count">Húzás (Darabszám)</option>
                                        <option value="card_draw">Kártya Megtalálása</option>
                                        <option value="specific_spread">Konkrét Kirakás</option>
                                        <option value="lesson_read">Lecke Elolvasása</option>
                                        <option value="challenge">Egyedi Kihívás</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-white/50 mb-1">Mennyiség (Cél)</label>
                                    <input type="number" value={newQuest.target} onChange={e => setNewQuest({...newQuest, target: Number(e.target.value)})} className="w-full bg-black/30 border border-white/10 rounded p-2 text-white" min="1" />
                                </div>

                                {/* --- SPREAD SELECTOR (Ha type = specific_spread) --- */}
                                {newQuest.conditionType === 'specific_spread' && (
                                    <div className="md:col-span-2 bg-white/5 p-4 rounded-xl border border-white/10 mt-2">
                                        <h4 className="text-xs font-bold text-gold-400 uppercase mb-3 border-b border-white/10 pb-1">Válassz Kirakást</h4>
                                        <select
                                            value={newQuest.targetSpreadId || ''}
                                            onChange={e => setNewQuest({...newQuest, targetSpreadId: e.target.value})}
                                            className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-xs"
                                        >
                                            <option value="">-- Válassz egy kirakást a listából --</option>
                                            {availableSpreads.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name} ({s.isCustom ? 'Saját' : 'Rendszer'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* --- KÁRTYA SZŰRŐK (Ha típus = card_draw) --- */}
                                {newQuest.conditionType === 'card_draw' && (
                                    <div className="md:col-span-2 bg-white/5 p-4 rounded-xl border border-white/10 mt-2">
                                        <h4 className="text-xs font-bold text-gold-400 uppercase mb-3 border-b border-white/10 pb-1">Kártya Feltételek</h4>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] uppercase font-bold text-white/50 mb-1">Szűrési Szint</label>
                                                <select value={newQuest.filterCardType} onChange={e => setNewQuest({...newQuest, filterCardType: e.target.value as any})} className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-xs">
                                                    <option value="any">Bármelyik lap (Nincs szűrés)</option>
                                                    <option value="major">Csak Nagy Árkánum</option>
                                                    <option value="minor">Csak Kis Árkánum</option>
                                                    <option value="suit">Adott Szín (Kelyhek, Botok...)</option>
                                                    <option value="specific">Konkrét Kártya(k)</option>
                                                </select>
                                            </div>

                                            {newQuest.filterCardType === 'suit' && (
                                                <div>
                                                    <label className="block text-[10px] uppercase font-bold text-white/50 mb-1">Válassz Színt</label>
                                                    <select value={newQuest.filterSuit} onChange={e => setNewQuest({...newQuest, filterSuit: e.target.value as any})} className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-xs">
                                                        <option value="Kelyhek">Kelyhek 🏆</option>
                                                        <option value="Botok">Botok 🌿</option>
                                                        <option value="Kardok">Kardok 🗡️</option>
                                                        <option value="Érmék">Érmék 🪙</option>
                                                    </select>
                                                </div>
                                            )}

                                            {newQuest.filterCardType === 'specific' && (
                                                <div className="md:col-span-2">
                                                    <label className="block text-[10px] uppercase font-bold text-white/50 mb-1">Kártyák Kiválasztása ({(newQuest.filterCardIds || []).length})</label>

                                                    <input
                                                        placeholder="Keress kártyát név szerint..."
                                                        value={cardSearch}
                                                        onChange={e => setCardSearch(e.target.value)}
                                                        className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-xs mb-2 focus:border-gold-500 outline-none"
                                                    />

                                                    <div className="h-60 overflow-y-auto custom-scrollbar bg-black/20 rounded border border-white/5 p-2 grid grid-cols-2 gap-2">
                                                        {filteredCards.map(c => {
                                                            const isSelected = newQuest.filterCardIds?.includes(c.id);
                                                            return (
                                                                <button
                                                                    key={c.id}
                                                                    onClick={() => toggleCardId(c.id)}
                                                                    className={`flex items-center gap-2 text-left px-3 py-2 rounded text-xs transition-colors border ${isSelected ? 'bg-gold-500/20 border-gold-500 text-gold-300' : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'}`}
                                                                >
                                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-gold-500 border-gold-500' : 'border-white/20'}`}>
                                                                        {isSelected && <span className="text-black text-[10px] font-bold">✓</span>}
                                                                    </div>
                                                                    <span className="truncate">{c.name}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    <div className="mt-2 flex items-center gap-2">
                                                        <span className="text-xs text-white/50">Logika:</span>
                                                        <div className="flex bg-black/30 rounded p-0.5 border border-white/10">
                                                            <button
                                                                onClick={() => setNewQuest({...newQuest, filterLogic: 'OR'})}
                                                                className={`px-3 py-0.5 rounded text-[10px] font-bold ${newQuest.filterLogic === 'OR' ? 'bg-gold-500 text-black' : 'text-gray-400'}`}
                                                            >
                                                                VAGY (Bármelyik)
                                                            </button>
                                                            <button
                                                                onClick={() => setNewQuest({...newQuest, filterLogic: 'AND'})}
                                                                className={`px-3 py-0.5 rounded text-[10px] font-bold ${newQuest.filterLogic === 'AND' ? 'bg-gold-500 text-black' : 'text-gray-400'}`}
                                                            >
                                                                ÉS (Mindegyik)
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* --- IDŐZÍTÉS & HOROSZKÓP --- */}
                                <div className="md:col-span-2 bg-white/5 p-4 rounded-xl border border-white/10 mt-2">
                                    <h4 className="text-xs font-bold text-blue-300 uppercase mb-3 border-b border-white/10 pb-1">Időzítés & Asztrológia</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Időegység */}
                                        <div>
                                            <label className="block text-[10px] uppercase font-bold text-white/50 mb-1">Időegység</label>
                                            <select
                                                value={newQuest.timeUnit || ''}
                                                onChange={e => setNewQuest({...newQuest, timeUnit: e.target.value as any || undefined, timeRangeStart: '', timeRangeEnd: ''})}
                                                className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-xs"
                                            >
                                                <option value="">Nincs (Bármikor)</option>
                                                <option value="hour">Óra (pl. 14:00-15:00)</option>
                                                <option value="day">Nap (pl. Hétfő)</option>
                                                <option value="month">Hónap</option>
                                                <option value="sabbat">Sabbat (Ünnep)</option>
                                                <option value="moonphase">Holdállás</option>
                                            </select>
                                        </div>

                                        {/* Idő Értékek (Dinamikus Dropdown) */}
                                        {newQuest.timeUnit && (
                                            <div>
                                                <label className="block text-[10px] uppercase font-bold text-white/50 mb-1">
                                                    {newQuest.timeUnit === 'hour' ? 'Kezdet - Vég (Óra)' : 'Válassz Értéket'}
                                                </label>

                                                {newQuest.timeUnit === 'sabbat' ? (
                                                    <select
                                                        value={newQuest.timeRangeStart}
                                                        onChange={e => setNewQuest({...newQuest, timeRangeStart: e.target.value})}
                                                        className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-xs"
                                                    >
                                                        <option value="">-- Válassz Sabbatot --</option>
                                                        {SABBATS.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                ) : newQuest.timeUnit === 'moonphase' ? (
                                                    <select
                                                        value={newQuest.timeRangeStart}
                                                        onChange={e => setNewQuest({...newQuest, timeRangeStart: e.target.value})}
                                                        className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-xs"
                                                    >
                                                        <option value="">-- Válassz Holdfázist --</option>
                                                        {MOON_PHASES.map(m => <option key={m} value={m}>{m}</option>)}
                                                    </select>
                                                ) : newQuest.timeUnit === 'month' ? (
                                                    <select
                                                        value={newQuest.timeRangeStart}
                                                        onChange={e => setNewQuest({...newQuest, timeRangeStart: e.target.value})}
                                                        className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-xs"
                                                    >
                                                        <option value="">-- Válassz Hónapot --</option>
                                                        {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                                    </select>
                                                ) : newQuest.timeUnit === 'day' ? (
                                                    <select
                                                        value={newQuest.timeRangeStart}
                                                        onChange={e => setNewQuest({...newQuest, timeRangeStart: e.target.value})}
                                                        className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-xs"
                                                    >
                                                        <option value="">-- Válassz Napot --</option>
                                                        <option value="Hétfő">Hétfő</option>
                                                        <option value="Kedd">Kedd</option>
                                                        <option value="Szerda">Szerda</option>
                                                        <option value="Csütörtök">Csütörtök</option>
                                                        <option value="Péntek">Péntek</option>
                                                        <option value="Szombat">Szombat</option>
                                                        <option value="Vasárnap">Vasárnap</option>
                                                    </select>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <input
                                                            value={newQuest.timeRangeStart}
                                                            onChange={e => setNewQuest({...newQuest, timeRangeStart: e.target.value})}
                                                            placeholder="Kezdet..."
                                                            className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-xs"
                                                        />
                                                        <input
                                                            value={newQuest.timeRangeEnd}
                                                            onChange={e => setNewQuest({...newQuest, timeRangeEnd: e.target.value})}
                                                            placeholder="Vég..."
                                                            className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-xs"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Horoszkóp Szűrő */}
                                        <div className="md:col-span-2 pt-2 border-t border-white/5">
                                            <label className="flex items-center gap-2 cursor-pointer mb-2">
                                                <input
                                                    type="checkbox"
                                                    checked={!!newQuest.filterZodiac}
                                                    onChange={e => setNewQuest({...newQuest, filterZodiac: e.target.checked ? ZODIAC_SIGNS[0] : ''})}
                                                    className="w-4 h-4 bg-black/50 border-white/20 rounded accent-gold-500"
                                                />
                                                <span className="text-xs font-bold text-white">Csak adott csillagjegy számára?</span>
                                            </label>

                                            {newQuest.filterZodiac && (
                                                <select
                                                    value={newQuest.filterZodiac}
                                                    onChange={e => setNewQuest({...newQuest, filterZodiac: e.target.value})}
                                                    className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-xs"
                                                >
                                                    {ZODIAC_SIGNS.map(z => <option key={z} value={z}>{z}</option>)}
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* --- Ikon és Emoji --- */}
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-white/50 mb-1">Vizuális Megjelenés (Emoji)</label>
                                    <div className="relative group">
                                        <button className="w-full h-12 bg-white/10 rounded flex items-center justify-between px-4 text-2xl border border-white/10 hover:bg-white/20 transition-colors">
                                            <span>{newQuest.visualEmoji || 'Válassz...'}</span>
                                            <span className="text-xs text-white/30">▼</span>
                                        </button>

                                        {/* Emoji Grid */}
                                        <div className="absolute bottom-full left-0 mb-2 p-3 bg-[#1e1e2e] border border-white/20 rounded-xl shadow-2xl w-full max-w-sm grid grid-cols-8 gap-2 hidden group-hover:grid z-50 h-64 overflow-y-auto custom-scrollbar">
                                            {TAROT_EMOJIS.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => setNewQuest({...newQuest, visualEmoji: emoji})}
                                                    className="aspect-square hover:bg-white/10 rounded flex items-center justify-center text-lg transition-colors border border-transparent hover:border-white/10"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-white/50 mb-1">Jutalom (XP)</label>
                                    <input type="number" value={newQuest.rewardXP} onChange={e => setNewQuest({...newQuest, rewardXP: Number(e.target.value)})} className="w-full bg-black/30 border border-white/10 rounded p-2 text-white" />
                                </div>
                            </div>

                            <button onClick={handleCreateQuest} disabled={isLoading} className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-white shadow-lg transition-all mt-4">
                                {isLoading ? 'Mentés...' : 'Kihívás Közzététele'}
                            </button>
                        </div>
                    )}

                    {isLoading && !isCreating && <div className="text-center py-10 text-white/50">Betöltés...</div>}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {communityQuests.map(quest => (
                            <div key={quest.id} className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col hover:border-gold-500/30 transition-colors group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-3xl border border-white/10 group-hover:scale-110 transition-transform">
                                        {quest.visualEmoji || (quest.icon && quest.icon.length < 5 ? quest.icon : '⚔️')}
                                    </div>
                                    <span className="text-xs font-bold text-gold-400 bg-gold-500/10 px-2 py-1 rounded border border-gold-500/20">+{quest.rewardXP} XP</span>
                                </div>
                                <h4 className="text-lg font-bold text-white mb-2">{quest.title}</h4>
                                <p className="text-xs text-white/60 mb-4 flex-1 leading-relaxed">{quest.description}</p>

                                <div className="space-y-1 mb-4">
                                    {quest.timeUnit && (
                                        <div className="text-[10px] text-blue-300 font-bold uppercase flex items-center gap-1">
                                            <span>⏱</span> {quest.timeUnit} {quest.timeRangeStart && `(${quest.timeRangeStart})`}
                                        </div>
                                    )}
                                    {quest.filterZodiac && (
                                        <div className="text-[10px] text-purple-300 font-bold uppercase flex items-center gap-1">
                                            <span>♈</span> Csak: {quest.filterZodiac}
                                        </div>
                                    )}
                                    {quest.conditionType === 'specific_spread' && (
                                        <div className="text-[10px] text-green-300 font-bold uppercase flex items-center gap-1">
                                            <span>🃏</span> Konkrét Kirakás
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                    <div className="text-[10px] text-white/30">
                                        Készítette: <span className="text-white/60">{quest.creatorName || 'Admin'}</span>
                                    </div>
                                    <button
                                        onClick={() => handleJoinQuest(quest)}
                                        className="text-xs font-bold uppercase tracking-widest text-blue-300 hover:text-white transition-colors"
                                    >
                                        Csatlakozás &rarr;
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
