
import React, { useState, useMemo, useEffect } from 'react';
import { useTarot } from '../context/TarotContext';
import { Reading } from '../types';
import { FULL_DECK } from '../constants';
import { CardImage } from './CardImage';
import { AnalysisService } from '../services/AnalysisService';
import { MarkdownRenderer } from './MarkdownSupport';

export const MonthlySummaryView = ({ onBack, embedded }: { onBack: () => void, embedded?: boolean }) => {
    const { readings, currentUser } = useTarot();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [summary, setSummary] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const monthReadings = useMemo(() => {
        return readings.filter(r => {
            const d = new Date(r.date);
            return d.getMonth() === currentDate.getMonth() &&
                   d.getFullYear() === currentDate.getFullYear() &&
                   r.userId === currentUser?.id;
        });
    }, [readings, currentDate, currentUser]);

    const stats = useMemo(() => {
        if (monthReadings.length === 0) return null;

        const elements: Record<string, number> = { 'Tűz': 0, 'Víz': 0, 'Levegő': 0, 'Föld': 0 };
        const cardCounts: Record<string, number> = {};

        monthReadings.forEach(r => {
            r.cards.forEach(c => {
                const cardDef = FULL_DECK.find(cd => cd.id === c.cardId);
                if (cardDef?.element) elements[cardDef.element] = (elements[cardDef.element] || 0) + 1;
                cardCounts[c.cardId] = (cardCounts[c.cardId] || 0) + 1;
            });
        });

        const dominantElement = Object.entries(elements).sort((a,b) => b[1] - a[1])[0];
        const topCardEntry = Object.entries(cardCounts).sort((a,b) => b[1] - a[1])[0];
        const topCard = topCardEntry ? FULL_DECK.find(c => c.id === topCardEntry[0]) : null;

        return {
            dominantElement: dominantElement ? dominantElement[0] : 'Ismeretlen',
            topCard: topCard || FULL_DECK[0],
            readingCount: monthReadings.length
        };
    }, [monthReadings]);

    useEffect(() => {
        const generate = async () => {
            if (!stats) {
                setSummary(null);
                return;
            }
            setLoading(true);
            const text = await AnalysisService.generateMonthlyReport(stats, monthReadings);
            setSummary(text);
            setLoading(false);
        };
        generate();
    }, [stats]);

    const changeMonth = (offset: number) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
        setCurrentDate(newDate);
    };

    if (!currentUser) return null;

    return (
        <div className="animate-fade-in max-w-4xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                {!embedded && (
                    <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white font-bold transition-colors">
                        &larr; Vissza
                    </button>
                )}
                <div className={`flex items-center gap-4 bg-black/40 p-2 rounded-full border border-white/10 shadow-lg ${embedded ? 'mx-auto' : ''}`}>
                    <button onClick={() => changeMonth(-1)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors">◄</button>
                    <span className="font-serif font-bold text-gold-400 uppercase tracking-widest min-w-[150px] text-center text-sm md:text-base">
                        {currentDate.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long' })}
                    </span>
                    <button onClick={() => changeMonth(1)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors">►</button>
                </div>
                {!embedded && <div className="w-20 hidden md:block"></div>}
            </div>

            {monthReadings.length === 0 ? (
                <div className="text-center py-20 text-white/30 italic glass-panel p-10 rounded-3xl border border-dashed border-white/10">
                    <div className="text-4xl mb-4 opacity-50">📭</div>
                    Ebben a hónapban nem végeztél húzást.
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Hero Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="glass-panel p-6 rounded-2xl border border-white/10 flex items-center gap-6 bg-gradient-to-br from-white/5 to-transparent">
                            <div className="text-5xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                                {stats?.dominantElement === 'Tűz' ? '🔥' : stats?.dominantElement === 'Víz' ? '🌊' : stats?.dominantElement === 'Levegő' ? '🌬️' : '🌍'}
                            </div>
                            <div>
                                <div className="text-[10px] uppercase font-bold text-white/50 mb-1 tracking-wider">Domináns Energia</div>
                                <div className="text-2xl font-serif font-bold text-white">{stats?.dominantElement}</div>
                            </div>
                        </div>
                        <div className="glass-panel p-6 rounded-2xl border border-white/10 flex items-center gap-6 bg-gradient-to-br from-white/5 to-transparent">
                            {stats?.topCard && (
                                <div className="w-12 h-20 rounded shadow-lg overflow-hidden border border-white/20 transform rotate-3">
                                    <CardImage cardId={stats.topCard.id} className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div>
                                <div className="text-[10px] uppercase font-bold text-white/50 mb-1 tracking-wider">Kulcskártya</div>
                                <div className="text-xl font-serif font-bold text-white leading-tight">{stats?.topCard?.name}</div>
                            </div>
                        </div>
                    </div>

                    {/* AI Analysis */}
                    <div className="glass-panel p-8 rounded-3xl border border-gold-500/30 bg-black/40 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                        <h3 className="font-serif font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-gold-200 via-white to-gold-500 mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
                            <span>🔮</span> Lelki Irányítópult
                        </h3>

                        {loading ? (
                            <div className="py-10 text-center animate-pulse text-gold-400 italic">A szellemek suttognak...</div>
                        ) : (
                            <div className="text-gray-200 leading-relaxed space-y-4">
                                <MarkdownRenderer content={summary || "Nem sikerült az elemzés."} />
                            </div>
                        )}
                    </div>

                    {/* Reading List (Compact) */}
                    <div className="mt-8">
                        <h4 className="text-xs font-bold uppercase text-white/40 mb-4 tracking-widest pl-2">Havi Napló</h4>
                        <div className="grid gap-2">
                            {monthReadings.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(r => (
                                <div key={r.id} className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="text-[10px] font-mono text-white/30 w-12 text-center">
                                        {new Date(r.date).getDate()}.
                                    </div>
                                    <div className="flex-1 truncate">
                                        <div className="text-sm text-white font-bold truncate">{r.question || 'Napi húzás'}</div>
                                        <div className="text-xs text-white/50 truncate">
                                            {r.cards.map(c => FULL_DECK.find(d => d.id === c.cardId)?.name).join(', ')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
