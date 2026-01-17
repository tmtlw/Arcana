
import React, { useState, useEffect } from 'react';
import { useTarot } from '../context/TarotContext';
import { Quest, UserQuestProgress } from '../types';
import { QuestService, DAILY_QUESTS, WEEKLY_QUESTS } from '../services/questService';
import { IconPicker } from './IconPicker';
import { GAME_ICONS } from '../constants/gameIcons';

export const QuestView = ({ onBack }: { onBack: () => void }) => {
    const { currentUser, updateUser, showToast, activeThemeKey } = useTarot();
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
        icon: 'scroll-quill',
        isPublic: true
    });
    const [showIconPicker, setShowIconPicker] = useState(false);

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
        } else {
            showToast("Hiba a mentés során.", "info");
        }
        setIsLoading(false);
    };

    const handleJoinQuest = (quest: Quest) => {
        if (!currentUser) return;
        // Check if already active
        if (currentUser.activeQuests?.some(q => q.questId === quest.id)) {
            return showToast("Már részt veszel ebben a kihívásban!", "info");
        }

        const newProgress: UserQuestProgress = {
            questId: quest.id,
            progress: 0,
            isCompleted: false,
            claimed: false,
            expiresAt: undefined // Community quests might not expire or logic handles it
        };

        updateUser({
            ...currentUser,
            activeQuests: [...(currentUser.activeQuests || []), newProgress]
        });
        showToast("Csatlakoztál a kihíváshoz!", "success");
    };

    // Render Logic
    const activeQuests = (currentUser?.activeQuests || []).map(uq => {
        // Try finding definition in constants first, then community list (if loaded), then fallback
        const staticDef = [...DAILY_QUESTS, ...WEEKLY_QUESTS].find(q => q.id === uq.questId);
        // Ideally we fetch definition if missing, but for now we rely on static or loaded community
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
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border flex-shrink-0 ${item.isCompleted ? 'bg-green-500 text-black border-green-400' : 'bg-white/5 text-gold-400 border-white/10'}`}>
                                    {item.def.icon.length > 2 && GAME_ICONS[item.def.icon] ? (
                                        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d={GAME_ICONS[item.def.icon]} /></svg>
                                    ) : (
                                        item.isCompleted ? '✓' : (item.def.icon.length < 5 ? item.def.icon : '⚔️')
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-white">{item.def.title}</h4>
                                        <span className="text-xs font-bold text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded border border-gold-500/20">+{item.def.rewardXP} XP</span>
                                    </div>
                                    <p className="text-xs text-white/60 mb-3">{item.def.description}</p>

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
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-white/50 mb-1">Cím</label>
                                    <input value={newQuest.title} onChange={e => setNewQuest({...newQuest, title: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded p-2 text-white" />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-white/50 mb-1">XP Jutalom</label>
                                    <input type="number" value={newQuest.rewardXP} onChange={e => setNewQuest({...newQuest, rewardXP: Number(e.target.value)})} className="w-full bg-black/30 border border-white/10 rounded p-2 text-white" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] uppercase font-bold text-white/50 mb-1">Leírás</label>
                                    <textarea value={newQuest.description} onChange={e => setNewQuest({...newQuest, description: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded p-2 text-white h-20 resize-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-white/50 mb-1">Típus</label>
                                    <select value={newQuest.conditionType} onChange={e => setNewQuest({...newQuest, conditionType: e.target.value as any})} className="w-full bg-black/30 border border-white/10 rounded p-2 text-white">
                                        <option value="reading_count">Húzás (Darab)</option>
                                        <option value="card_draw">Kártya (Típus)</option>
                                        <option value="lesson_read">Tanulás</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-white/50 mb-1">Cél (Darab)</label>
                                    <input type="number" value={newQuest.target} onChange={e => setNewQuest({...newQuest, target: Number(e.target.value)})} className="w-full bg-black/30 border border-white/10 rounded p-2 text-white" />
                                </div>
                                <div className="flex items-end">
                                    <button onClick={() => setShowIconPicker(true)} className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded text-sm text-white border border-white/10 hover:bg-white/20 w-full justify-center">
                                        {newQuest.icon && GAME_ICONS[newQuest.icon] ? (
                                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-gold-400"><path d={GAME_ICONS[newQuest.icon]} /></svg>
                                        ) : <span>?</span>}
                                        Ikon Választása
                                    </button>
                                </div>
                            </div>

                            <button onClick={handleCreateQuest} disabled={isLoading} className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-white shadow-lg transition-all">
                                {isLoading ? 'Mentés...' : 'Kihívás Közzététele'}
                            </button>

                            {showIconPicker && <IconPicker onSelect={(icon) => { setNewQuest({...newQuest, icon}); setShowIconPicker(false); }} onClose={() => setShowIconPicker(false)} />}
                        </div>
                    )}

                    {isLoading && !isCreating && <div className="text-center py-10 text-white/50">Betöltés...</div>}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {communityQuests.map(quest => (
                            <div key={quest.id} className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col hover:border-gold-500/30 transition-colors group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-gold-400 border border-white/10 group-hover:scale-110 transition-transform">
                                        {quest.icon && GAME_ICONS[quest.icon] ? (
                                            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d={GAME_ICONS[quest.icon]} /></svg>
                                        ) : '⚔️'}
                                    </div>
                                    <span className="text-xs font-bold text-gold-400 bg-gold-500/10 px-2 py-1 rounded border border-gold-500/20">+{quest.rewardXP} XP</span>
                                </div>
                                <h4 className="text-lg font-bold text-white mb-2">{quest.title}</h4>
                                <p className="text-xs text-white/60 mb-4 flex-1 leading-relaxed">{quest.description}</p>

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
