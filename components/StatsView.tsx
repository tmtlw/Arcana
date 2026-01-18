import React, { useState, useMemo } from 'react';
import { useTarot } from '../context/TarotContext';
import { FULL_DECK, getCardImage, MOODS } from '../constants';
import { t } from '../services/i18nService';
import { CardImage } from './CardImage';

// Moved outside to avoid re-creation on render and type issues
const StalkerCard: React.FC<{ data: any, rank: number }> = ({ data, rank }) => {
    if (!data || !data.card) return null;
    return (
        <div className="flex flex-col items-center group relative">
            <div className="absolute -top-3 -right-3 w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center text-black font-bold border-2 border-[#1a1a2e] z-20 shadow-lg">
                #{rank}
            </div>
            <div className="w-24 md:w-32 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border-2 border-white/10 group-hover:scale-105 transition-transform group-hover:border-gold-500/50">
                <CardImage cardId={data.card.id} className="w-full h-full object-cover" />
            </div>
            <div className="mt-3 text-center">
                <div className="font-bold text-white text-sm">{data.card.name}</div>
                <div className="text-xs text-gold-400">{data.count} alkalommal</div>
            </div>
        </div>
    );
};

const ProgressBar = ({ label, value, max, color }: { label: string, value: number, max: number, color: string }) => {
    const percent = Math.min(100, Math.round((value / (max || 1)) * 100));
    return (
        <div className="mb-3">
            <div className="flex justify-between text-xs uppercase font-bold mb-1 opacity-80">
                <span>{label}</span>
                <span>{value} ({percent}%)</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-1000 ${color}`} style={{ width: `${percent}%` }}></div>
            </div>
        </div>
    );
};

export const StatsView = ({ onBack, embedded }: { onBack: () => void, embedded?: boolean }) => {
    const { readings, currentUser, language } = useTarot();
    const [timeRange, setTimeRange] = useState<'all' | 'month'>('all');
    
    // --- ANALYTICS ENGINE ---
    const stats = useMemo(() => {
        const now = new Date();
        let filteredReadings = readings.filter(r => r.userId === currentUser?.id);

        if (timeRange === 'month') {
            filteredReadings = filteredReadings.filter(r => {
                const d = new Date(r.date);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            });
        }

        filteredReadings.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const totalReadings = filteredReadings.length;
        const allDrawnCards = filteredReadings.flatMap(r => r.cards);
        const totalCards = allDrawnCards.length;

        // 1. CARD FREQUENCY (STALKERS)
        const cardCounts: Record<string, number> = {};
        allDrawnCards.forEach(c => {
            cardCounts[c.cardId] = (cardCounts[c.cardId] || 0) + 1;
        });
        const sortedCards = Object.entries(cardCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([id, count]) => {
                const card = FULL_DECK.find(c => c.id === id);
                return { card, count };
            });

        // 2. SUIT & ELEMENT BALANCE
        const suits = { 'Botok': 0, 'Kelyhek': 0, 'Kardok': 0, 'Érmék': 0, 'Major': 0 };
        const elements = { 'Tűz': 0, 'Víz': 0, 'Levegő': 0, 'Föld': 0 };
        
        allDrawnCards.forEach(dc => {
            const card = FULL_DECK.find(c => c.id === dc.cardId);
            if (card) {
                if (card.arcana === 'Major') {
                    suits.Major++;
                    // Major Arcana elements
                    if (card.element) elements[card.element as keyof typeof elements]++;
                } else {
                    if (card.suit) suits[card.suit]++;
                    if (card.element) elements[card.element as keyof typeof elements]++;
                }
            }
        });

        // 3. CHRONOTYPE (Time of Day)
        const hours = new Array(24).fill(0);
        const weekDays = new Array(7).fill(0);
        filteredReadings.forEach(r => {
            const d = new Date(r.date);
            hours[d.getHours()]++;
            // Shift to Monday=0, Sunday=6 to match visual
            const dayIdx = d.getDay(); // 0=Sun, 1=Mon
            const mondayBasedIdx = dayIdx === 0 ? 6 : dayIdx - 1;
            weekDays[mondayBasedIdx]++;
        });
        const busiestHour = hours.indexOf(Math.max(...hours));
        let timeLabel = "Éjszakai Bagoly 🦉";
        if (busiestHour >= 5 && busiestHour < 12) timeLabel = "Korai Madár 🐦";
        if (busiestHour >= 12 && busiestHour < 18) timeLabel = "Nappali Vándor ☀️";
        if (busiestHour >= 18 && busiestHour < 22) timeLabel = "Esti Gondolkodó 🌙";

        // 4. MOON PHASE AFFINITY
        const moonPhases: Record<string, number> = {};
        filteredReadings.forEach(r => {
            if (r.astrology?.moonPhase) {
                moonPhases[r.astrology.moonPhase] = (moonPhases[r.astrology.moonPhase] || 0) + 1;
            }
        });
        const favMoon = Object.entries(moonPhases).sort((a,b) => b[1] - a[1])[0];

        // 5. STREAK CALCULATION
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        let lastDate: string | null = null;

        // Sort by date ascending
        const sortedDates = filteredReadings.map(r => new Date(r.date).toDateString());
        // Remove duplicates to count unique days
        const uniqueDates: string[] = Array.from(new Set(sortedDates));

        uniqueDates.forEach((dateStr, idx) => {
            if (idx === 0) {
                tempStreak = 1;
            } else {
                const prev = new Date(uniqueDates[idx-1]);
                const curr = new Date(dateStr);
                const diffTime = Math.abs(curr.getTime() - prev.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

                if (diffDays === 1) {
                    tempStreak++;
                } else {
                    if (tempStreak > longestStreak) longestStreak = tempStreak;
                    tempStreak = 1;
                }
            }
            lastDate = dateStr;
        });
        if (tempStreak > longestStreak) longestStreak = tempStreak;

        // Check if streak is active (last reading was today or yesterday)
        const todayStr = new Date().toDateString();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (lastDate === todayStr || lastDate === yesterdayStr) {
            currentStreak = tempStreak;
        } else {
            currentStreak = 0;
        }

        // 6. MOOD ANALYSIS
        const moodCounts: Record<string, number> = {};
        filteredReadings.forEach(r => {
            if (r.mood) moodCounts[r.mood] = (moodCounts[r.mood] || 0) + 1;
        });
        const domMoodId = Object.entries(moodCounts).sort((a,b) => b[1] - a[1])[0]?.[0];
        const dominantMood = MOODS.find(m => m.id === domMoodId);

        // 7. HEATMAP DATA (Last 365 days mostly, but simplified to last 6 months for UI)
        // Only return reading counts per date string "YYYY-MM-DD"
        const activityMap: Record<string, number> = {};
        filteredReadings.forEach(r => {
            const dayKey = r.date.split('T')[0];
            activityMap[dayKey] = (activityMap[dayKey] || 0) + 1;
        });

        // 8. NUMEROLOGY STATS
        const numerologyCounts: Record<number, number> = {};
        allDrawnCards.forEach(dc => {
            const card = FULL_DECK.find(c => c.id === dc.cardId);
            if (card && card.number !== undefined) {
                 numerologyCounts[card.number] = (numerologyCounts[card.number] || 0) + 1;
            }
        });
        const topNumber = Object.entries(numerologyCounts).sort((a,b) => b[1] - a[1])[0];

        // 9. DAY vs NIGHT
        let dayCount = 0;
        let nightCount = 0;
        filteredReadings.forEach(r => {
             const h = new Date(r.date).getHours();
             if (h >= 6 && h < 18) dayCount++; else nightCount++;
        });

        return {
            totalReadings,
            totalCards,
            sortedCards,
            suits,
            elements,
            timeLabel,
            busiestHour,
            favMoon: favMoon ? { name: favMoon[0], count: favMoon[1] } : null,
            currentStreak,
            longestStreak,
            dominantMood,
            activityMap,
            weekDayStats: weekDays,
            topNumber: topNumber ? { num: topNumber[0], count: topNumber[1] } : null,
            dayNight: { day: dayCount, night: nightCount }
        };
    }, [readings, currentUser, timeRange]);

    const Heatmap = () => {
        // Generate last 4 months (approx 120 days)
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
                        <div 
                            key={i} 
                            title={`${d.date.toLocaleDateString()}: ${d.count} húzás`}
                            className={`w-3 h-3 rounded-sm ${d.bgClass} hover:ring-1 hover:ring-white transition-all`}
                        ></div>
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
             // Find readings for this day
             // We use filtered list from context directly to ensure we have cards
             // Note: stats.activityMap only has counts. We need cards.
             const dayReadings = readings.filter(r => r.userId === currentUser?.id && r.date.startsWith(dateStr));

             if (dayReadings.length === 0) return 'bg-white/5 text-white/30';

             // Determine dominant element
             // Priority: Major > Fire/Water/Air/Earth count
             let major = 0, fire = 0, water = 0, air = 0, earth = 0;

             dayReadings.forEach(r => {
                 r.cards.forEach(dc => {
                     const card = FULL_DECK.find(c => c.id === dc.cardId);
                     if (card) {
                         if (card.arcana === 'Major') major += 2; // Weight Major higher
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
                            <div
                                key={d}
                                className={`aspect-square flex items-center justify-center rounded text-xs font-bold transition-transform hover:scale-110 cursor-default ${colorClass}`}
                            >
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

    return (
        <div className="animate-fade-in pb-20 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                {!embedded && (
                    <button onClick={onBack} className="flex items-center gap-2 font-bold text-white/60 hover:text-gold-400">
                        &larr; {t('btn.back', language)}
                    </button>
                )}
                <div className="flex bg-black/40 p-1 rounded-lg ml-auto">
                    <button onClick={() => setTimeRange('all')} className={`px-3 py-1 rounded text-xs font-bold ${timeRange === 'all' ? 'bg-gold-500 text-black' : 'text-white/50'}`}>Mindig</button>
                    <button onClick={() => setTimeRange('month')} className={`px-3 py-1 rounded text-xs font-bold ${timeRange === 'month' ? 'bg-gold-500 text-black' : 'text-white/50'}`}>E hónap</button>
                </div>
            </div>
            
            {!embedded && <h2 className="text-3xl font-serif font-bold text-center mb-2 text-gold-400">Lelki Irányítópult</h2>}
            <p className="text-center text-white/40 text-sm mb-10">Az elmúlt időszak energiamintázatai</p>

            {/* SECTION 1: HERO METRICS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="glass-panel p-4 rounded-2xl border-t-4 border-indigo-500 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="text-3xl font-bold text-white mb-1">{stats.totalReadings}</div>
                    <div className="text-[10px] uppercase font-bold text-indigo-300 tracking-widest">Összes Húzás</div>
                </div>
                <div className="glass-panel p-4 rounded-2xl border-t-4 border-emerald-500 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="text-3xl font-bold text-white mb-1">{stats.currentStreak} <span className="text-sm text-white/40">/ {stats.longestStreak}</span></div>
                    <div className="text-[10px] uppercase font-bold text-emerald-300 tracking-widest">Napos Sorozat</div>
                </div>
                <div className="glass-panel p-4 rounded-2xl border-t-4 border-gold-500 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gold-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="text-3xl font-bold text-white mb-1">{currentUser?.level || 1}</div>
                    <div className="text-[10px] uppercase font-bold text-gold-400 tracking-widest">Látnok Szint</div>
                </div>
                <div className="glass-panel p-4 rounded-2xl border-t-4 border-pink-500 text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="text-3xl font-bold text-white mb-1">{stats.dominantMood?.icon || '-'}</div>
                    <div className="text-[10px] uppercase font-bold text-pink-300 tracking-widest">{stats.dominantMood?.label || 'Hangulat'}</div>
                </div>
            </div>

            {/* SECTION 2: STALKER CARDS */}
            {stats.sortedCards.length > 0 && (
                <div className="glass-panel p-8 rounded-3xl border border-white/10 mb-8 bg-gradient-to-b from-transparent to-black/40">
                    <h3 className="text-xl font-serif font-bold text-center mb-8 flex items-center justify-center gap-2">
                        <span>👻</span> Kísérő Kártyák (Top 3)
                    </h3>
                    <div className="flex justify-center gap-6 md:gap-12 flex-wrap">
                        {stats.sortedCards.map((item, idx) => (
                            <StalkerCard key={idx} data={item} rank={idx + 1} />
                        ))}
                    </div>
                    <div className="text-center mt-6 text-xs text-white/40 italic">
                        Ezek a lapok bukkannak fel a leggyakrabban a húzásaidban.
                    </div>
                </div>
            )}

            {/* SECTION 3: SUITS & ELEMENTS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                    <h3 className="font-bold text-white mb-6 uppercase tracking-widest text-xs flex items-center gap-2">
                        <span>🔥</span> Elemi Egyensúly
                    </h3>
                    <ProgressBar label="Tűz (Szenvedély)" value={stats.elements['Tűz']} max={stats.totalCards} color="bg-red-500" />
                    <ProgressBar label="Víz (Érzelem)" value={stats.elements['Víz']} max={stats.totalCards} color="bg-blue-500" />
                    <ProgressBar label="Levegő (Gondolat)" value={stats.elements['Levegő']} max={stats.totalCards} color="bg-yellow-200" />
                    <ProgressBar label="Föld (Anyag)" value={stats.elements['Föld']} max={stats.totalCards} color="bg-emerald-600" />
                </div>

                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                    <h3 className="font-bold text-white mb-6 uppercase tracking-widest text-xs flex items-center gap-2">
                        <span>⚔️</span> Kis és Nagy Árkánum
                    </h3>
                    <ProgressBar label="Nagy Árkánum (Sors)" value={stats.suits.Major} max={stats.totalCards} color="bg-purple-500" />
                    <div className="h-px bg-white/10 my-4"></div>
                    <ProgressBar label="Kelyhek (Víz)" value={stats.suits.Kelyhek} max={stats.totalCards} color="bg-blue-400/60" />
                    <ProgressBar label="Botok (Tűz)" value={stats.suits.Botok} max={stats.totalCards} color="bg-red-400/60" />
                    <ProgressBar label="Kardok (Levegő)" value={stats.suits.Kardok} max={stats.totalCards} color="bg-yellow-100/60" />
                    <ProgressBar label="Érmék (Föld)" value={stats.suits.Érmék} max={stats.totalCards} color="bg-emerald-400/60" />
                </div>
            </div>

            {/* SECTION 4: TIME & ASTRO */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Chronotype */}
                <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center">
                    <div className="text-4xl mb-2">🕰️</div>
                    <h3 className="font-bold text-gold-400 uppercase tracking-widest text-xs mb-1">Kronotípus</h3>
                    <div className="text-xl font-serif font-bold text-white mb-2">{stats.timeLabel}</div>
                    <p className="text-xs text-white/50">Legaktívabb óra: {stats.busiestHour}:00</p>
                </div>

                {/* Moon Affinity */}
                <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center">
                    <div className="text-4xl mb-2">🌙</div>
                    <h3 className="font-bold text-blue-300 uppercase tracking-widest text-xs mb-1">Holdfázis Affinitás</h3>
                    {stats.favMoon ? (
                        <>
                            <div className="text-xl font-serif font-bold text-white mb-2">{stats.favMoon.name}</div>
                            <p className="text-xs text-white/50">{stats.favMoon.count} alkalommal ebben a fázisban.</p>
                        </>
                    ) : <div className="text-xs opacity-50">Nincs elég adat.</div>}
                </div>

                {/* Day of Week */}
                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                    <h3 className="font-bold text-white mb-4 uppercase tracking-widest text-xs text-center">Heti Ritmus</h3>
                    <div className="flex items-end justify-between h-20 gap-1">
                        {['H', 'K', 'Sz', 'Cs', 'P', 'Sz', 'V'].map((day, i) => {
                            const val = stats.weekDayStats[i];
                            const max = Math.max(...stats.weekDayStats) || 1;
                            const h = Math.max(10, (val / max) * 100);
                            return (
                                <div key={i} className="flex flex-col items-center gap-1 w-full group">
                                    <div 
                                        className="w-full bg-white/10 rounded-t-sm group-hover:bg-gold-500 transition-colors"
                                        style={{ height: `${h}%` }}
                                        title={`${val} húzás`}
                                    ></div>
                                    <span className="text-[10px] text-white/30 font-bold">{day}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* SECTION 5: EXTRA STATS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                 <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center">
                    <div className="text-4xl mb-2">🔢</div>
                    <h3 className="font-bold text-white uppercase tracking-widest text-xs mb-1">Domináns Szám</h3>
                    {stats.topNumber ? (
                         <>
                            <div className="text-xl font-serif font-bold text-gold-400 mb-2">{stats.topNumber.num}</div>
                            <p className="text-xs text-white/50">{stats.topNumber.count} alkalommal</p>
                         </>
                    ) : <span className="text-xs opacity-50">Nincs adat</span>}
                 </div>
                 <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center">
                    <div className="text-4xl mb-2">☀️ / 🌙</div>
                    <h3 className="font-bold text-white uppercase tracking-widest text-xs mb-1">Nappal vs Éjszaka</h3>
                    <div className="flex gap-4 items-center">
                        <div className="text-center">
                            <span className="block text-gold-400 font-bold">{stats.dayNight.day}</span>
                            <span className="text-[10px] uppercase opacity-50">Nappal</span>
                        </div>
                        <div className="h-8 w-px bg-white/10"></div>
                        <div className="text-center">
                            <span className="block text-blue-400 font-bold">{stats.dayNight.night}</span>
                            <span className="text-[10px] uppercase opacity-50">Éjjel</span>
                        </div>
                    </div>
                 </div>
            </div>

            {/* SECTION 6: CALENDAR & ACTIVITY LOG */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full items-start">
                <ElementalCalendar />
                <Heatmap />
            </div>

        </div>
    );
};