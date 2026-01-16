
import React from 'react';
import { useTarot } from '../context/TarotContext';
import { DAILY_QUESTS, WEEKLY_QUESTS } from '../services/questService';

export const QuestLog = () => {
    const { currentUser } = useTarot();
    if (!currentUser || !currentUser.activeQuests) return null;

    const quests = currentUser.activeQuests.map(uq => {
        const def = [...DAILY_QUESTS, ...WEEKLY_QUESTS].find(q => q.id === uq.questId);
        return { ...uq, def };
    }).filter(q => q.def);

    const dailies = quests.filter(q => q.def?.type === 'daily');
    const weeklies = quests.filter(q => q.def?.type === 'weekly');

    const QuestItem = ({ item }: { item: any }) => {
        const percent = Math.min(100, Math.round((item.progress / item.def.target) * 100));
        return (
            <div className={`p-3 rounded-xl border mb-2 flex items-center gap-3 transition-colors ${item.isCompleted ? 'bg-green-900/20 border-green-500/50' : 'bg-black/20 border-white/5'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl border ${item.isCompleted ? 'bg-green-500 text-black border-green-400' : 'bg-white/5 text-gray-400 border-white/10'}`}>
                    {item.isCompleted ? '✓' : item.def.icon}
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                        <div className="font-bold text-xs text-white">{item.def.title}</div>
                        <div className="text-[10px] text-gold-400 font-bold">+{item.def.rewardXP} XP</div>
                    </div>
                    <div className="text-[10px] text-white/50 mb-2">{item.def.description}</div>
                    <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-500 ${item.isCompleted ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${percent}%` }}></div>
                    </div>
                    <div className="text-[9px] text-right mt-1 opacity-50">{item.progress} / {item.def.target}</div>
                </div>
            </div>
        );
    };

    return (
        <div className="animate-fade-in">
            <h3 className="text-xs font-bold uppercase text-gold-500 tracking-widest mb-4 flex items-center gap-2">
                <span>⚔️</span> Kihívások
            </h3>

            {dailies.length > 0 && (
                <div className="mb-4">
                    <h4 className="text-[10px] font-bold text-white/30 uppercase mb-2">Napi Küldetések</h4>
                    {dailies.map(q => <QuestItem key={q.questId} item={q} />)}
                </div>
            )}

            {weeklies.length > 0 && (
                <div>
                    <h4 className="text-[10px] font-bold text-white/30 uppercase mb-2">Heti Küldetések</h4>
                    {weeklies.map(q => <QuestItem key={q.questId} item={q} />)}
                </div>
            )}

            {quests.length === 0 && <div className="text-xs text-white/30 italic text-center">Nincs aktív küldetés.</div>}
        </div>
    );
};
