import React, { useState } from 'react';
import { useTarot } from '../context/TarotContext';
import { MOODS } from '../constants';
import { t } from '../services/i18nService';
import { CardImage } from './CardImage';
import { AnalyticsStats } from '../services/analyticsHook';
import { Card, Reading } from '../types';

const StalkerCard: React.FC<{ data: any, rank: number, onSelect: (c: Card) => void }> = ({ data, rank, onSelect }) => {
    if (!data || !data.card) return null;
    return (
        <div className="flex flex-col items-center group relative cursor-pointer" onClick={() => onSelect(data.card)}>
            <div className="absolute -top-3 -right-3 w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center text-black font-bold border-2 border-[#1a1a2e] z-20 shadow-lg">
                #{rank}
            </div>
            <div className="w-24 md:w-32 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border-2 border-white/10 group-hover:scale-105 transition-transform group-hover:border-gold-500/50">
                <CardImage cardId={data.card.id} className="w-full h-full object-cover" />
            </div>
            <div className="mt-3 text-center">
                <div className="font-bold text-white text-sm group-hover:text-gold-400 transition-colors">{data.card.name}</div>
                <div className="text-xs text-gold-400">{data.count} alkalommal</div>
            </div>
        </div>
    );
};

const ProgressBar = ({ label, value, max, color, compareValue, compareMax }: { label: string, value: number, max: number, color: string, compareValue?: number, compareMax?: number }) => {
    const percent = Math.min(100, Math.round((value / (max || 1)) * 100));
    const compPercent = (compareValue !== undefined && compareMax !== undefined) ? Math.min(100, Math.round((compareValue / (compareMax || 1)) * 100)) : undefined;
    let diff = 0;
    if (compPercent !== undefined) diff = percent - compPercent;

    return (
        <div className="mb-4">
            <div className="flex justify-between text-xs uppercase font-bold mb-1 opacity-80">
                <span>{label}</span>
                <div className="flex items-center gap-2">
                    {compPercent !== undefined && (
                        <span className={`text-[10px] ${diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-white/30'}`}>
                            {diff > 0 ? `+${diff}` : diff}%
                        </span>
                    )}
                    <span>{value} ({percent}%)</span>
                </div>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden relative">
                {compPercent !== undefined && (
                    <div className="absolute inset-0 bg-white/5 border-r border-white/20" style={{ width: `${compPercent}%`, zIndex: 5 }}></div>
                )}
                <div className={`h-full transition-all duration-1000 relative z-10 ${color}`} style={{ width: `${percent}%` }}></div>
            </div>
        </div>
    );
};

export const StatsView = ({ stats, compareStats, onSelectCard, embedded }: { stats: AnalyticsStats, compareStats?: AnalyticsStats, onSelectCard: (c: Card) => void, onBack: () => void, embedded?: boolean }) => {
    const { currentUser, readings, deck } = useTarot();
    const [selectedDayReadings, setSelectedDayReadings] = useState<Reading[] | null>(null);

    const Heatmap = () => {
        const days = [];
        const today = new Date();
        for (let i = 119; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const key = d.toISOString().split('T')[0];
            const count = stats.activityMap[key] || 0;
            let bgClass = 'bg-white/5';
            if (count > 0) bgClass = 'bg-gold-500/30';
            if (count > 1) bgClass = 'bg-gold-500/60';
            if (count > 3) bgClass = 'bg-gold-500';
            days.push({ date: d, count, bgClass, key });
        }

        const handleCellClick = (key: string) => {
            const dr = readings.filter(r => r.userId === currentUser?.id && r.date.startsWith(key));
            if (dr.length > 0) setSelectedDayReadings(dr);
        };

        return (
            <div className="glass-panel p-6 rounded-2xl border border-white/10 overflow-hidden h-full">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">📅 Aktivitási Hőtérkép</h3>
                <div className="flex flex-wrap gap-1 justify-center md:justify-start content-start">
                    {days.map((d, i) => (
                        <div
                            key={i}
                            onClick={() => handleCellClick(d.key)}
                            title={`${d.date.toLocaleDateString()}: ${d.count} húzás`}
                            className={`w-3 h-3 rounded-sm ${d.bgClass} hover:ring-1 hover:ring-white transition-all cursor-pointer`}
                        ></div>
                    ))}
                </div>
            </div>
        );
    };

    const TrendChart = () => {
        const trends = stats.elementTrends.slice(-6); // Last 6 months
        if (trends.length < 2) return null;
        const maxVal = Math.max(...trends.flatMap(t => [t['Tűz'], t['Víz'], t['Levegő'], t['Föld']])) || 1;

        return (
            <div className="glass-panel p-6 rounded-2xl border border-white/10 mt-8">
                <h3 className="font-bold text-white mb-6 uppercase text-xs">📈 Elemi Trendek (Havi)</h3>
                <div className="h-32 flex items-end gap-4">
                    {trends.map((t, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                            <div className="w-full flex items-end justify-center gap-0.5 h-full">
                                <div className="w-1.5 bg-red-500 rounded-t-sm" style={{ height: `${(t['Tűz']/maxVal)*100}%` }}></div>
                                <div className="w-1.5 bg-blue-500 rounded-t-sm" style={{ height: `${(t['Víz']/maxVal)*100}%` }}></div>
                                <div className="w-1.5 bg-yellow-200 rounded-t-sm" style={{ height: `${(t['Levegő']/maxVal)*100}%` }}></div>
                                <div className="w-1.5 bg-emerald-600 rounded-t-sm" style={{ height: `${(t['Föld']/maxVal)*100}%` }}></div>
                            </div>
                            <span className="text-[8px] text-white/30 font-bold uppercase">{t.month.split('-')[1]}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const Delta = ({ val, compVal, percent }: { val: number, compVal?: number, percent?: boolean }) => {
        if (compVal === undefined) return null;
        const diff = val - compVal;
        if (diff === 0) return null;
        return (
            <span className={`text-[10px] font-bold ${diff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {diff > 0 ? '↑' : '↓'} {Math.abs(diff)}{percent ? '%' : ''}
            </span>
        );
    };

    return (
        <div className="animate-fade-in pb-20 max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="glass-panel p-4 rounded-2xl border-t-4 border-indigo-500 text-center relative overflow-hidden group">
                    <div className="flex items-center justify-center gap-2">
                        <div className="text-3xl font-bold text-white">{stats.totalReadings}</div>
                        <Delta val={stats.totalReadings} compVal={compareStats?.totalReadings} />
                    </div>
                    <div className="text-[10px] uppercase font-bold text-indigo-300 tracking-widest">Húzás</div>
                </div>
                <div className="glass-panel p-4 rounded-2xl border-t-4 border-emerald-500 text-center relative overflow-hidden group">
                    <div className="flex items-center justify-center gap-2">
                        <div className="text-3xl font-bold text-white">{stats.currentStreak}</div>
                        <Delta val={stats.currentStreak} compVal={compareStats?.currentStreak} />
                    </div>
                    <div className="text-[10px] uppercase font-bold text-emerald-300 tracking-widest">Aktuális Sorozat</div>
                </div>
                <div className="glass-panel p-4 rounded-2xl border-t-4 border-gold-500 text-center relative overflow-hidden group">
                    <div className="flex items-center justify-center gap-2">
                        <div className="text-3xl font-bold text-white">{stats.majorProgress}</div>
                        <Delta val={stats.majorProgress} compVal={compareStats?.majorProgress} />
                    </div>
                    <div className="text-[10px] uppercase font-bold text-gold-400 tracking-widest">Felfedezett Árkánumok</div>
                </div>
                <div className="glass-panel p-4 rounded-2xl border-t-4 border-pink-500 text-center relative overflow-hidden group">
                    <div className="flex items-center justify-center gap-2">
                        <div className="text-3xl font-bold text-white">{stats.reversedRatio}%</div>
                        <Delta val={stats.reversedRatio} compVal={compareStats?.reversedRatio} percent={true} />
                    </div>
                    <div className="text-[10px] uppercase font-bold text-pink-300 tracking-widest">Fordított Arány</div>
                </div>
            </div>

            {/* VIRTUAL ALTAR */}
            <div className="relative mb-12 py-12 px-6 rounded-[3rem] border border-gold-500/20 bg-black/40 overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.1)]">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
                <h3 className="text-2xl font-serif font-bold text-center text-gold-400 mb-10 relative z-10 uppercase tracking-[0.2em]">Szakrális Oltárad</h3>
                <div className="flex justify-center gap-4 md:gap-12 flex-wrap relative z-10">
                    {stats.sortedCards.slice(0, 3).map((item, idx) => (
                        <StalkerCard key={idx} data={item} rank={idx + 1} onSelect={onSelectCard} />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                    <h3 className="font-bold text-white mb-6 uppercase tracking-widest text-xs flex items-center gap-2"><span>🔥</span> Elemi Egyensúly</h3>
                    <ProgressBar label="Tűz" value={stats.elements['Tűz']} max={stats.totalCards} color="bg-red-500" compareValue={compareStats?.elements['Tűz']} compareMax={compareStats?.totalCards} />
                    <ProgressBar label="Víz" value={stats.elements['Víz']} max={stats.totalCards} color="bg-blue-500" compareValue={compareStats?.elements['Víz']} compareMax={compareStats?.totalCards} />
                    <ProgressBar label="Levegő" value={stats.elements['Levegő']} max={stats.totalCards} color="bg-yellow-200" compareValue={compareStats?.elements['Levegő']} compareMax={compareStats?.totalCards} />
                    <ProgressBar label="Föld" value={stats.elements['Föld']} max={stats.totalCards} color="bg-emerald-600" compareValue={compareStats?.elements['Föld']} compareMax={compareStats?.totalCards} />
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                    <h3 className="font-bold text-white mb-6 uppercase tracking-widest text-xs flex items-center gap-2"><span>⚔️</span> Árkánumok</h3>
                    <ProgressBar label="Nagy Árkánum" value={stats.suits.Major} max={stats.totalCards} color="bg-purple-500" compareValue={compareStats?.suits.Major} compareMax={compareStats?.totalCards} />
                    <div className="h-px bg-white/10 my-4"></div>
                    <ProgressBar label="Kelyhek" value={stats.suits.Kelyhek} max={stats.totalCards} color="bg-blue-400/60" compareValue={compareStats?.suits.Kelyhek} compareMax={compareStats?.totalCards} />
                    <ProgressBar label="Botok" value={stats.suits.Botok} max={stats.totalCards} color="bg-red-400/60" compareValue={compareStats?.suits.Botok} compareMax={compareStats?.totalCards} />
                    <ProgressBar label="Kardok" value={stats.suits.Kardok} max={stats.totalCards} color="bg-yellow-100/60" compareValue={compareStats?.suits.Kardok} compareMax={compareStats?.totalCards} />
                    <ProgressBar label="Érmék" value={stats.suits.Érmék} max={stats.totalCards} color="bg-emerald-400/60" compareValue={compareStats?.suits.Érmék} compareMax={compareStats?.totalCards} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full items-start">
                <div className="space-y-8">
                    <Heatmap />
                    <TrendChart />
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                    <h3 className="font-bold text-white mb-4 text-xs uppercase">☀️ Napi Ritmus</h3>
                    <div className="flex items-end justify-between h-20 gap-1">
                        {stats.weekDays.map((val, i) => {
                            const max = Math.max(...stats.weekDays) || 1;
                            return (
                                <div key={i} className="flex flex-col items-center gap-1 w-full group">
                                    <div className="w-full bg-white/10 rounded-t-sm group-hover:bg-gold-500 transition-colors" style={{ height: `${Math.max(10, (val/max)*100)}%` }}></div>
                                    <span className="text-[10px] text-white/30 font-bold">{['H', 'K', 'S', 'C', 'P', 'S', 'V'][i]}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {selectedDayReadings && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in" onClick={() => setSelectedDayReadings(null)}>
                    <div className="glass-panel-dark w-full max-w-xl rounded-2xl p-6 border border-white/20" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-serif font-bold text-gold-400 mb-6">Napi Húzások</h3>
                        <div className="space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {selectedDayReadings.map(r => (
                                <div key={r.id} className="bg-white/5 p-4 rounded-xl">
                                    <div className="text-xs text-white/40 mb-2">{new Date(r.date).toLocaleTimeString()}</div>
                                    <div className="font-bold text-white mb-2">{r.question || "Napi húzás"}</div>
                                    <div className="flex gap-2">
                                        {r.cards.map(c => (
                                            <div key={c.positionId} className="w-10 h-14 rounded overflow-hidden border border-white/10 cursor-pointer" onClick={() => { const card = deck.find(x => x.id === c.cardId); if (card) onSelectCard(card); }}>
                                                <CardImage cardId={c.cardId} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setSelectedDayReadings(null)} className="w-full mt-6 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 font-bold">Bezárás</button>
                    </div>
                </div>
            )}
        </div>
    );
};
