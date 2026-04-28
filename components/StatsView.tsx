import React, { useState, useMemo } from 'react';
import { useTarot } from '../context/TarotContext';
import { FULL_DECK, MOODS } from '../constants';
import { t } from '../services/i18nService';
import { CardImage } from './CardImage';
import { AnalyticsStats } from '../services/analyticsHook';
import { Card } from '../types';

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
    if (compPercent !== undefined) {
        diff = percent - compPercent;
    }

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
    const { currentUser, language, readings } = useTarot();

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
            days.push({ date: d, count, bgClass });
        }

        return (
            <div className="glass-panel p-6 rounded-2xl border border-white/10 overflow-hidden h-full">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">📅 Aktivitási Hőtérkép</h3>
                <div className="flex flex-wrap gap-1 justify-center md:justify-start content-start">
                    {days.map((d, i) => (
                        <div key={i} title={`${d.date.toLocaleDateString()}: ${d.count} húzás`} className={`w-3 h-3 rounded-sm ${d.bgClass} hover:ring-1 hover:ring-white transition-all`}></div>
                    ))}
                </div>
                <div className="flex justify-end items-center gap-2 mt-4 text-[10px] text-white/40">
                    <span>Kevés</span>
                    <div className="flex gap-1">
                        <div className="w-2 h-2 bg-white/5 rounded-sm"></div>
                        <div className="w-2 h-2 bg-gold-500/30 rounded-sm"></div>
                        <div className="w-2 h-2 bg-gold-500/60 rounded-sm"></div>
                        <div className="w-2 h-2 bg-gold-500 rounded-sm"></div>
                    </div>
                    <span>Sok</span>
                </div>
            </div>
        );
    };

    const ElementalCalendar = () => {
        const [currentMonth, setCurrentMonth] = useState(new Date());

        const getDaysInMonth = (date: Date) => {
            const year = date.getFullYear();
            const month = date.getMonth();
            const days = new Date(year, month + 1, 0).getDate();
            const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
            const offset = firstDay === 0 ? 6 : firstDay - 1; // Mon=0
            return { days, offset, monthName: date.toLocaleDateString('hu-HU', { month: 'long', year: 'numeric' }) };
        };

        const { days, offset, monthName } = getDaysInMonth(currentMonth);

        const changeMonth = (delta: number) => {
            const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1);
            setCurrentMonth(newDate);
        };

        const getDayColor = (day: number) => {
             const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString().split('T')[0];
             const dayReadings = readings.filter(r => r.userId === currentUser?.id && r.date.startsWith(dateStr));

             if (dayReadings.length === 0) return 'bg-white/5 text-white/30';

             let major = 0, fire = 0, water = 0, air = 0, earth = 0;
             dayReadings.forEach(r => {
                 r.cards.forEach(dc => {
                     const card = FULL_DECK.find(c => c.id === dc.cardId);
                     if (card) {
                         if (card.arcana === 'Major') major += 2;
                         else if (card.suit === 'Botok') fire++;
                         else if (card.suit === 'Kelyhek') water++;
                         else if (card.suit === 'Kardok') air++;
                         else if (card.suit === 'Érmék') earth++;
                     }
                 });
             });

             const max = Math.max(major, fire, water, air, earth);
             if (max === 0) return 'bg-white/20 text-white';
             if (max === major) return 'bg-purple-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.5)]';
             if (max === fire) return 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]';
             if (max === water) return 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]';
             if (max === air) return 'bg-yellow-200 text-black shadow-[0_0_10px_rgba(253,224,71,0.5)]';
             if (max === earth) return 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(5,150,105,0.5)]';
             return 'bg-gray-500 text-white';
        };

        return (
            <div className="glass-panel p-6 rounded-2xl border border-white/10 h-full">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white flex items-center gap-2">🗓️ Elemi Naptár</h3>
                    <div className="flex items-center gap-2 bg-black/30 rounded p-1">
                        <button onClick={() => changeMonth(-1)} className="hover:text-gold-400 px-2">◄</button>
                        <span className="text-xs font-bold uppercase w-24 text-center">{monthName}</span>
                        <button onClick={() => changeMonth(1)} className="hover:text-gold-400 px-2">►</button>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[10px] font-bold text-white/30 uppercase">
                    <div>H</div><div>K</div><div>S</div><div>C</div><div>P</div><div>S</div><div>V</div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: offset }).map((_, i) => <div key={`empty-${i}`} />)}
                    {Array.from({ length: days }).map((_, i) => {
                        const d = i + 1;
                        const colorClass = getDayColor(d);
                        return (
                            <div key={d} className={`aspect-square flex items-center justify-center rounded text-xs font-bold transition-transform hover:scale-110 cursor-default ${colorClass}`}>
                                {d}
                            </div>
                        );
                    })}
                </div>
                <div className="flex flex-wrap gap-2 mt-4 justify-center text-[9px] text-white/50 uppercase font-bold">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-purple-600"></span> Nagy Á.</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-600"></span> Tűz</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-600"></span> Víz</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-yellow-200"></span> Lev.</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-600"></span> Föld</span>
                </div>
            </div>
        );
    };

    const DiffIndicator = ({ current, compare, suffix = "" }: { current: number, compare?: number, suffix?: string }) => {
        if (compare === undefined) return null;
        const diff = current - compare;
        if (diff === 0) return null;
        return (
            <span className={`text-xs ml-2 ${diff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {diff > 0 ? '↑' : '↓'} {Math.abs(diff)}{suffix}
            </span>
        );
    };

    return (
        <div className="animate-fade-in pb-20 max-w-5xl mx-auto">
            {!embedded && <h2 className="text-3xl font-serif font-bold text-center mb-2 text-gold-400">Lelki Irányítópult</h2>}
            <p className="text-center text-white/40 text-sm mb-10">Az elemzett időszak energiamintázatai</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="glass-panel p-4 rounded-2xl border-t-4 border-indigo-500 text-center relative overflow-hidden group">
                    <div className="text-3xl font-bold text-white mb-1">
                        {stats.totalReadings}
                        <DiffIndicator current={stats.totalReadings} compare={compareStats?.totalReadings} />
                    </div>
                    <div className="text-[10px] uppercase font-bold text-indigo-300 tracking-widest">Húzás</div>
                </div>
                <div className="glass-panel p-4 rounded-2xl border-t-4 border-emerald-500 text-center relative overflow-hidden group">
                    <div className="text-3xl font-bold text-white mb-1">{stats.currentStreak} <span className="text-sm text-white/40">/ {stats.longestStreak}</span></div>
                    <div className="text-[10px] uppercase font-bold text-emerald-300 tracking-widest">Sorozat</div>
                </div>
                <div className="glass-panel p-4 rounded-2xl border-t-4 border-gold-500 text-center relative overflow-hidden group">
                    <div className="text-3xl font-bold text-white mb-1">{currentUser?.level || 1}</div>
                    <div className="text-[10px] uppercase font-bold text-gold-400 tracking-widest">Szint</div>
                </div>
                <div className="glass-panel p-4 rounded-2xl border-t-4 border-pink-500 text-center relative overflow-hidden group">
                    <div className="text-3xl font-bold text-white mb-1">{stats.dominantMood?.icon || '-'}</div>
                    <div className="text-[10px] uppercase font-bold text-pink-300 tracking-widest">{stats.dominantMood?.label || 'Hangulat'}</div>
                </div>
            </div>

            {stats.sortedCards.length > 0 && (
                <div className="glass-panel p-8 rounded-3xl border border-white/10 mb-8 bg-gradient-to-b from-transparent to-black/40">
                    <h3 className="text-xl font-serif font-bold text-center mb-8 flex items-center justify-center gap-2"><span>👻</span> Kísérő Kártyák</h3>
                    <div className="flex justify-center gap-6 md:gap-12 flex-wrap">
                        {stats.sortedCards.slice(0, 3).map((item, idx) => (
                            <StalkerCard key={idx} data={item} rank={idx + 1} onSelect={onSelectCard} />
                        ))}
                    </div>
                </div>
            )}

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
                <ElementalCalendar />
                <Heatmap />
            </div>
        </div>
    );
};
