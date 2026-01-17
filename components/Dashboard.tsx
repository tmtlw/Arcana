
import React, { useMemo, useState, useEffect } from 'react';
import { useTarot } from '../context/TarotContext';
import { THEMES, BADGES, getAvatarUrl, ZODIAC_INFO, QUICK_ACTION_OPTIONS } from '../constants';
import { WESTERN_HOROSCOPES } from '../constants/horoscopes_western';
import { CHINESE_HOROSCOPES, getChineseZodiac } from '../constants/horoscopes_chinese';
import { Spread, SpreadPosition, SpreadCategory } from '../types';
import { CardImage } from './CardImage';
import { CommunityService } from '../services/communityService';
import { AstroService } from '../services/astroService';
import { t } from '../services/i18nService';
import { QuestLog } from './QuestLog'; // Import QuestLog

export const Dashboard = ({ onNavigate, onStartReading, onEditSpread }: any) => {
    const { currentUser, readings, allSpreads, deleteCustomSpread, deck, activeDeck, showToast, userLocation, language, activeThemeKey, toggleFavoriteSpread, communityEvents } = useTarot();
    
    // Fix: Use activeThemeKey resolved in context with safe fallback
    const theme = THEMES[activeThemeKey] || THEMES['mystic'] || THEMES['auto'];
    // Fallback again if THEMES itself is missing keys or malformed
    const cardBg = theme?.cardBg || 'glass-panel rounded-2xl';
    
    // Calendar State
    const [calDate, setCalDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<{ day: number, month: number, year: number } | null>(null);
    // Publishing State
    const [publishingId, setPublishingId] = useState<string | null>(null);
    // Real-time clock for Ascendant update
    const [now, setNow] = useState(new Date());
    // Zodiac Modal State
    const [zodiacModal, setZodiacModal] = useState<{ type: 'Nap'|'Hold'|'Aszcendens'|'Kínai', sign: string, detail?: any } | null>(null);
    
    // Spread Category Tab State
    const [activeCategory, setActiveCategory] = useState<SpreadCategory | 'all' | 'favorites'>('favorites');

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    if (!currentUser) return null;

    const userReadings = readings.filter(r => r.userId === currentUser.id);
    const xpProgress = (currentUser.xp || 0) % 100;

    // --- Precise Astro Data for NOW using LOCATION ---
    const astroData = useMemo(() => {
        const data = AstroService.getAstroData(now, userLocation || undefined) as any;
        const chinese = getChineseZodiac(now.getFullYear());
        return { ...data, chinese };
    }, [now, userLocation]);

    const handleDeleteSpread = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        deleteCustomSpread(id);
    };

    const handleEditClick = (e: React.MouseEvent, spread: Spread) => {
        e.stopPropagation();
        onEditSpread(spread);
    };

    const handlePublishSpread = async (e: React.MouseEvent, spread: Spread) => {
        e.stopPropagation();
        if(!confirm(`Szeretnéd megosztani a "${spread.name}" kirakást a piactéren?`)) return;
        setPublishingId(spread.id);
        try {
            await CommunityService.publishSpread(spread, currentUser.name, currentUser.id);
            showToast(t('reading.public_success', language), "success");
        } catch (error) {
            showToast(t('reading.error', language), "info");
        } finally {
            setPublishingId(null);
        }
    };

    // --- Calendar Logic ---
    const getCalendarDays = () => {
        const year = calDate.getFullYear();
        const month = calDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const startOffset = firstDay === 0 ? 6 : firstDay - 1;
        const days = [];
        for (let i = 0; i < startOffset; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);
        return days;
    };

    const changeMonth = (offset: number) => {
        const newDate = new Date(calDate.getFullYear(), calDate.getMonth() + offset, 1);
        setCalDate(newDate);
    };

    const isToday = (day: number) => {
        const today = new Date();
        return day === today.getDate() && calDate.getMonth() === today.getMonth() && calDate.getFullYear() === today.getFullYear();
    };

    const getReadingsForDay = (day: number) => {
        return userReadings.filter(r => {
            const d = new Date(r.date);
            return d.getDate() === day && d.getMonth() === calDate.getMonth() && d.getFullYear() === calDate.getFullYear();
        });
    };

    const getEventsForDay = (day: number) => {
        return (communityEvents || []).filter(e => {
            const d = new Date(e.date);
            return d.getDate() === day && d.getMonth() === calDate.getMonth() && d.getFullYear() === calDate.getFullYear();
        });
    };

    // Fix: corrected parameter name from invalid 'day.number' to 'day' to resolve scope issues.
    const handleDayClick = (day: number) => {
        setSelectedDay({ day, month: calDate.getMonth(), year: calDate.getFullYear() });
    };

    const handleAddReadingForDate = () => {
        if (!selectedDay) return;
        const targetDate = new Date(selectedDay.year, selectedDay.month, selectedDay.day, 12, 0, 0); 
        const dailySpread = allSpreads.find((s: Spread) => s.id === 'single');
        if (dailySpread) {
            onStartReading(dailySpread, targetDate);
            setSelectedDay(null);
        } else {
            alert("Hiba: Nem található a Napi Húzás sablon.");
        }
    };

    const monthNames = ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"];

    const openZodiacModal = (type: 'Nap'|'Hold'|'Aszcendens'|'Kínai', sign: string) => {
        let detail = null;
        if (type === 'Kínai') {
            detail = CHINESE_HOROSCOPES.find(c => c.name === sign);
        } else {
            // Mapping for Western names if needed, usually they match
            // ZODIAC_INFO keys are Hungarian: "Kos", "Bika", etc.
            // WESTERN_HOROSCOPES names are also Hungarian.
            detail = WESTERN_HOROSCOPES.find(h => h.name === sign);
        }
        setZodiacModal({ type, sign, detail });
    };

    // Calculate daily readings once for selected day to avoid re-renders inside modal
    const selectedReadings = selectedDay ? getReadingsForDay(selectedDay.day) : [];
    const selectedEvents = selectedDay ? getEventsForDay(selectedDay.day) : [];

    // --- Dynamic Quick Actions ---
    const activeActionIds = currentUser.quickActions && currentUser.quickActions.length > 0 
        ? currentUser.quickActions 
        : ['community', 'customSpread', 'astro', 'numerology', 'stats']; // Default if none selected

    const activeActions = activeActionIds
        .map(id => QUICK_ACTION_OPTIONS.find(opt => opt.id === id))
        .filter(Boolean)
        .slice(0, 6); // Reverted to max 6

    // --- Spread Categories Logic ---
    const categories: {id: SpreadCategory | 'all' | 'favorites', label: string, icon: string}[] = [
        { id: 'favorites', label: 'Kedvencek', icon: '⭐' },
        { id: 'general', label: 'Általános', icon: '✨' },
        { id: 'love', label: 'Szerelem', icon: '❤️' },
        { id: 'career', label: 'Karrier', icon: '💼' },
        { id: 'self', label: 'Önismeret', icon: '🧘' },
        { id: 'calendar', label: 'Naptár', icon: '📅' },
        { id: 'decision', label: 'Döntés', icon: '⚖️' },
        { id: 'advice', label: 'Tanács', icon: '💡' },
        { id: 'all', label: 'Összes', icon: '♾️' }
    ];

    const filteredSpreads = allSpreads.filter(s => {
        if (activeCategory === 'favorites') return (currentUser.favoriteSpreads || []).includes(s.id);
        if (activeCategory === 'all') return true;
        return (s.category || 'general') === activeCategory;
    });

    const handleToggleFavSpread = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        toggleFavoriteSpread(id);
    };

    return (
        <>
            <div className="space-y-8 animate-fade-in relative">
                
                {/* Hero Section */}
                <div className={`relative overflow-hidden rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl ${cardBg} group`}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                    
                    <div className="relative z-10 flex flex-col lg:flex-row gap-8 lg:gap-12">
                        
                        {/* LEFT SIDE: Profile & Cosmic HUD */}
                        <div className="flex-1 flex flex-col gap-6">
                            {/* Greeting */}
                            <div className="flex items-center gap-5">
                                <div className="relative cursor-pointer group/avatar" onClick={() => onNavigate('profile')}>
                                    <img 
                                        src={getAvatarUrl(currentUser)} 
                                        className="w-20 h-20 rounded-full border-2 border-gold-500/50 shadow-xl bg-white/5 object-cover transition-transform group-hover/avatar:scale-105" 
                                    />
                                    <div className="absolute -bottom-1 -right-1 bg-black/80 text-gold-400 font-bold px-2 py-0.5 rounded-full border border-gold-500/30 text-[10px]">
                                        Lvl {currentUser.level || 1}
                                    </div>
                                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:avatar:opacity-100 transition-opacity">
                                        <span className="text-xs font-bold text-white">{t('menu.profile', language)} ⚙️</span>
                                    </div>
                                </div>
                                
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-1 flex items-center gap-3">
                                        <span>{t('dashboard.greeting', language)}, {currentUser.name}!</span>
                                        {currentUser.isAdmin && (
                                            <span className="text-[10px] bg-red-600/80 text-white px-2 py-0.5 rounded font-sans uppercase tracking-widest border border-red-400/50 shadow-lg animate-pulse-slow">
                                                Admin
                                            </span>
                                        )}
                                    </h2>
                                    <div className="text-xs text-white/50 mb-2 font-mono flex items-center gap-2">
                                        {now.toLocaleDateString()} • {now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                        {userLocation && <span className="text-[10px] bg-white/10 px-1 rounded ml-1" title="Helyalapú számítás aktív">📍</span>}
                                    </div>
                                    <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-gold-500 transition-all" style={{ width: `${xpProgress}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            {/* COSMIC DATA GRID */}
                            <div className="bg-black/30 rounded-2xl border border-white/5 overflow-hidden backdrop-blur-sm">
                                <div className="grid grid-cols-4 divide-x divide-white/5 border-b border-white/5">
                                    <button onClick={() => openZodiacModal('Nap', astroData.sunSign)} className="p-3 text-center hover:bg-white/5 transition-colors">
                                        <div className="text-[10px] uppercase text-gold-500 font-bold tracking-widest mb-1 truncate">{t('dashboard.sun', language)}</div>
                                        <div className="text-xl">☀️</div>
                                        <div className="text-xs font-bold mt-1 truncate">{astroData.sunSign}</div>
                                    </button>
                                    <button onClick={() => openZodiacModal('Hold', astroData.moonSign)} className="p-3 text-center hover:bg-white/5 transition-colors">
                                        <div className="text-[10px] uppercase text-blue-300 font-bold tracking-widest mb-1 truncate">{t('dashboard.moon', language)}</div>
                                        <div className="text-xl">{astroData.icon}</div>
                                        <div className="text-xs font-bold mt-1 truncate">{astroData.moonSign}</div>
                                    </button>
                                    <button onClick={() => openZodiacModal('Aszcendens', astroData.ascendant)} className="p-3 text-center hover:bg-white/5 transition-colors">
                                        <div className="text-[10px] uppercase text-purple-400 font-bold tracking-widest mb-1 truncate">{t('dashboard.ascendant', language)}</div>
                                        <div className="text-xl">🏹</div>
                                        <div className="text-xs font-bold mt-1 truncate">{astroData.ascendant}</div>
                                    </button>
                                    <button onClick={() => openZodiacModal('Kínai', astroData.chinese.sign)} className="p-3 text-center hover:bg-white/5 transition-colors">
                                        <div className="text-[10px] uppercase text-red-400 font-bold tracking-widest mb-1 truncate">Kínai</div>
                                        <div className="text-xl">🧧</div>
                                        <div className="text-xs font-bold mt-1 truncate">{astroData.chinese.sign}</div>
                                    </button>
                                </div>
                                <div className="grid grid-cols-4 divide-x divide-white/5 bg-white/5">
                                    <div className="p-3 text-center">
                                        <div className="text-[9px] uppercase text-white/40 mb-1">{t('dashboard.phase', language)}</div>
                                        <div className="text-xs font-bold text-white">{astroData.moonPhase}</div>
                                        <div className="text-[9px] text-white/30">{Math.round(astroData.illumination * 100)}%</div>
                                    </div>
                                    <div className="p-3 text-center">
                                        <div className="text-[9px] uppercase text-white/40 mb-1">{t('dashboard.sunrise', language)}</div>
                                        <div className="text-xs font-bold text-gold-200">🌅 {astroData.sunrise}</div>
                                        <div className="text-xs font-bold text-orange-300">🌇 {astroData.sunset}</div>
                                    </div>
                                    <div className="p-3 text-center">
                                        <div className="text-[9px] uppercase text-white/40 mb-1">{t('dashboard.moonrise', language)}</div>
                                        <div className="text-xs font-bold text-blue-200">☾ {astroData.moonrise}</div>
                                        <div className="text-xs font-bold text-indigo-300">— {astroData.moonset}</div>
                                    </div>
                                    <div className="p-3 text-center">
                                        <div className="text-[9px] uppercase text-white/40 mb-1">{t('dashboard.planet_hour', language)}</div>
                                        <div className="text-xs font-bold text-pink-300">🪐 {astroData.planetHour}</div>
                                        <div className="text-[9px] text-white/30">Uralom</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT SIDE: Compact Calendar & Quests */}
                        <div className="w-full lg:w-72 flex-shrink-0 self-start space-y-4">
                            {/* Calendar */}
                            <div className="glass-panel p-3 rounded-xl bg-black/20 border border-white/10">
                                <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/5">
                                    <button onClick={() => changeMonth(-1)} className="hover:bg-white/10 rounded px-2 text-xs">◄</button>
                                    <span className="font-bold uppercase tracking-widest text-gold-500 text-xs">
                                        {calDate.getFullYear()} {monthNames[calDate.getMonth()]}
                                    </span>
                                    <button onClick={() => changeMonth(1)} className="hover:bg-white/10 rounded px-2 text-xs">►</button>
                                </div>
                                <div className="grid grid-cols-7 gap-1 text-center text-[9px] mb-1 font-bold opacity-40">
                                    <div>H</div><div>K</div><div>S</div><div>C</div><div>P</div><div>S</div><div>V</div>
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {getCalendarDays().map((d, i) => {
                                        if (d === null) return <div key={`empty-${i}`} className="aspect-square"></div>;

                                        const dayDate = new Date(calDate.getFullYear(), calDate.getMonth(), d);
                                        const dayReadings = getReadingsForDay(d);
                                        const dayEvents = getEventsForDay(d);

                                        const astroDay = AstroService.getAstroData(dayDate, userLocation || undefined);
                                        const wiccanDay = AstroService.getWiccanHoliday(dayDate);

                                        const isCurrentDay = isToday(d);
                                        const hasReading = dayReadings.length > 0;

                                        const currentPhase = astroDay.moonPhase;
                                        let moonClass = "";
                                        if (currentPhase === 'Telihold' || currentPhase === 'Újhold') {
                                            // Streak logic for mini-calendar with unique 1-2-3 rule
                                            let streakBefore = 0;
                                            let streakAfter = 0;
                                            for (let offset = 1; offset <= 5; offset++) {
                                                const checkD = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate() - offset);
                                                const checkA = AstroService.getAstroData(checkD, userLocation || undefined);
                                                if (checkA.moonPhase === currentPhase) streakBefore++;
                                                else break;
                                            }
                                            for (let offset = 1; offset <= 5; offset++) {
                                                const checkD = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate() + offset);
                                                const checkA = AstroService.getAstroData(checkD, userLocation || undefined);
                                                if (checkA.moonPhase === currentPhase) streakAfter++;
                                                else break;
                                            }

                                            const streakLength = streakBefore + streakAfter + 1;
                                            const midIndex = Math.floor(streakLength / 2);
                                            const currentIndexInStreak = streakBefore;

                                            if (currentIndexInStreak === midIndex) {
                                                // Peak
                                                moonClass = "ring-1 ring-white/30 bg-white/5";
                                            } else if (currentIndexInStreak === midIndex - 1) {
                                                // Glowing
                                                moonClass = currentPhase === 'Telihold'
                                                    ? "animate-pulse-slow shadow-[0_0_15px_rgba(251,191,36,0.6)] ring-1 ring-gold-500/50"
                                                    : "animate-pulse-slow shadow-[0_0_15px_rgba(59,130,246,0.5)] ring-1 ring-blue-500/50";
                                            } else if (currentIndexInStreak === midIndex + 1) {
                                                // Faded
                                                moonClass = "opacity-40 grayscale-[0.7]";
                                            }
                                        }

                                        const hasEvent = dayEvents.length > 0 || wiccanDay || currentPhase === 'Telihold' || currentPhase === 'Újhold';

                                        let iconContent: React.ReactNode = d;
                                        let tooltip = `${d}.`;

                                        // PRIORITÁS: Húzás > Sabbat > Hold > Közösségi Esemény > Szám
                                        if (hasReading) {
                                            iconContent = <span className="text-lg filter drop-shadow-md">🎴</span>;
                                            tooltip += " - Húzás elvégezve";
                                        } else if (wiccanDay) {
                                            iconContent = <span className="text-lg filter drop-shadow-md">{wiccanDay.icon}</span>;
                                            tooltip += ` - ${wiccanDay.name}`;
                                        } else if (currentPhase === 'Telihold') {
                                            iconContent = <span className={`text-lg filter drop-shadow-md ${moonClass}`}>🌕</span>;
                                            tooltip += " - Telihold";
                                        } else if (currentPhase === 'Újhold') {
                                            iconContent = <span className={`text-lg filter drop-shadow-md ${moonClass}`}>🌑</span>;
                                            tooltip += " - Újhold";
                                        } else if (dayEvents.length > 0) {
                                            iconContent = <span className="text-lg filter drop-shadow-md">✨</span>;
                                            tooltip += " - Közösségi szeánsz";
                                        }

                                        return (
                                            <div
                                                key={d}
                                                onClick={() => handleDayClick(d)}
                                                title={tooltip}
                                                className={`aspect-square flex items-center justify-center rounded cursor-pointer text-xs relative transition-all duration-300 ${isCurrentDay ? 'bg-gold-500 text-black font-bold ring-2 ring-gold-400/50' : 'hover:bg-white/10 bg-white/5'} ${hasReading && !isCurrentDay ? 'bg-indigo-500/20 border border-indigo-500/50' : ''} ${(hasEvent && !hasReading) ? 'ring-1 ring-white/10' : ''} ${moonClass}`}
                                            >
                                                {iconContent}
                                                {dayEvents.length > 0 && !hasReading && !wiccanDay && currentPhase !== 'Telihold' && currentPhase !== 'Újhold' && (
                                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full border border-black"></div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Quest Log Widget */}
                            <div id="quest-log-container" className="glass-panel p-4 rounded-xl bg-black/20 border border-white/10">
                                <QuestLog />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions Strip (Dynamic 6 items) */}
                <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3`}>
                    {activeActions.map((item: any) => (
                        <button 
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`glass-panel px-4 py-3 rounded-xl flex items-center gap-3 hover:bg-white/10 transition-all border border-white/5 group ${item.color.includes('bg-') ? item.color : ''}`}
                        >
                            <span className={`text-xl ${!item.color.includes('bg-') ? item.color : ''} group-hover:scale-110 transition-transform`}>{item.icon}</span>
                            <span className="font-bold text-sm text-gray-200 group-hover:text-white truncate">{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* Spreads Horizontal Scroll */}
                <div id="spread-selector-container">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-px bg-white/10 flex-1"></div>
                        <h3 className="text-xl font-serif font-bold text-gold-400 uppercase tracking-widest flex items-center gap-2">
                            <span>✦</span> {t('dashboard.choose_spread', language)} <span>✦</span>
                        </h3>
                        <div className="h-px bg-white/10 flex-1"></div>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar mb-4 justify-center md:justify-start">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap border ${activeCategory === cat.id ? 'bg-gold-500 text-black border-gold-500' : 'bg-white/5 text-white/50 border-white/10 hover:border-white/30'}`}
                            >
                                <span className="text-sm">{cat.icon}</span> {cat.label}
                            </button>
                        ))}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSpreads.map(s => {
                            const isFav = (currentUser.favoriteSpreads || []).includes(s.id);
                            return (
                                <div 
                                    key={s.id} 
                                    onClick={() => onStartReading(s)} 
                                    className={`glass-panel p-6 rounded-2xl cursor-pointer hover:border-gold-500/50 transition-all hover:shadow-[0_0_20px_rgba(234,179,8,0.1)] group relative overflow-hidden flex flex-col h-full border ${isFav ? 'border-gold-500/40 bg-gold-500/5' : 'border-white/5'}`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h4 className="font-serif font-bold text-lg text-white group-hover:text-gold-400 transition-colors">{s.name}</h4>
                                        <div className="flex gap-2 items-center">
                                            <button 
                                                onClick={(e) => handleToggleFavSpread(e, s.id)}
                                                className={`text-lg transition-all transform hover:scale-125 ${isFav ? 'text-gold-500' : 'text-white/20 hover:text-white/40'}`}
                                                title="Kedvenc kirakás"
                                            >
                                                {isFav ? '★' : '☆'}
                                            </button>
                                            <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-white/60 font-mono">{s.positions.length} {t('dashboard.cards', language)}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mb-4 flex-1 line-clamp-2">{s.description}</p>
                                    
                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                        <span className="text-xs font-bold uppercase tracking-wider text-gold-500/80 group-hover:text-gold-400">{t('dashboard.start', language)} &rarr;</span>
                                        <div className="flex gap-2">
                                            {s.isCustom && (
                                                <>
                                                    <button onClick={(e) => handlePublishSpread(e, s)} className="text-[10px] hover:text-white text-white/40" title={t('dashboard.share', language)}>🌐</button>
                                                    <button onClick={(e) => handleEditClick(e, s)} className="text-[10px] hover:text-white text-white/40" title={t('dashboard.edit', language)}>✎</button>
                                                    <button onClick={(e) => handleDeleteSpread(e, s.id)} className="text-[10px] hover:text-red-400 text-white/40" title={t('dashboard.delete', language)}>✕</button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredSpreads.length === 0 && (
                            <div className="col-span-full text-center py-10 text-white/30 italic">
                                {activeCategory === 'favorites' ? 'Még nincsenek kedvenc kirakásaid.' : 'Ebben a kategóriában még nincsenek kirakások.'}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Day Details Modal - Fixed Center Z-100 */}
            {selectedDay && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedDay(null)}>
                    <div className="glass-panel-dark w-full max-w-2xl rounded-3xl p-0 border border-white/20 overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h3 className="text-2xl font-serif font-bold text-gold-400">
                                {selectedDay.year}. {monthNames[selectedDay.month]} {selectedDay.day}.
                            </h3>
                            <button onClick={() => setSelectedDay(null)} className="text-white/50 hover:text-white text-2xl">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            
                            {/* Events Section */}
                            {selectedEvents.length > 0 && (
                                <div className="mb-8 space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-widest text-gold-400 opacity-60">Közösségi Események</h4>
                                    {selectedEvents.map(ev => (
                                        <div key={ev.id} className="bg-indigo-900/30 border border-indigo-500/30 p-4 rounded-xl flex justify-between items-center">
                                            <div>
                                                <div className="font-bold text-white">{ev.title}</div>
                                                <div className="text-xs text-indigo-300">Gazda: {ev.hostName} • {ev.participants.length} résztvevő</div>
                                            </div>
                                            <button 
                                                onClick={() => onNavigate('astro')} // Navigate to calendar to see details/join
                                                className="bg-indigo-600 px-3 py-1 rounded text-[10px] font-bold text-white"
                                            >
                                                Megtekintés
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedReadings.length > 0 ? (
                                <div className="space-y-8">
                                    {selectedReadings.map((r) => (
                                        <div key={r.id} className="border-b border-white/10 pb-8 last:border-0 last:pb-0">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <span className="text-xs font-bold uppercase tracking-widest text-white/50 bg-white/5 px-2 py-1 rounded">
                                                        {allSpreads.find((s: Spread) => s.id === r.spreadId)?.name || 'Ismeretlen'}
                                                    </span>
                                                    {r.astrology && (
                                                        <div className="flex gap-2 mt-2 text-[10px] opacity-70">
                                                            <span>☀️ {r.astrology.sunSign}</span>
                                                            <span className="font-bold text-blue-200">{r.astrology.icon} {r.astrology.moonSign}</span>
                                                            <span>🏹 {r.astrology.ascendant}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-xs opacity-40 font-mono">{new Date(r.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                            </div>
                                            {r.question && <div className="mb-4 italic text-white/80 font-serif border-l-2 border-gold-500/50 pl-3">"{r.question}"</div>}
                                            <div className="grid gap-4">
                                                {r.cards.map((drawnCard) => {
                                                    const cardInfo = deck.find((c: any) => c.id === drawnCard.cardId);
                                                    if (!cardInfo) return null;
                                                    const meaningText = cardInfo.dailyMeaning || cardInfo.generalMeaning || cardInfo.meaningUpright;
                                                    return (
                                                        <div key={drawnCard.positionId} className="flex gap-4 items-start bg-black/20 p-4 rounded-xl">
                                                            <div className="w-16 h-24 flex-shrink-0 rounded-lg overflow-hidden shadow-lg border border-white/10">
                                                                <CardImage cardId={cardInfo.id} className={`w-full h-full object-cover ${drawnCard.isReversed ? 'rotate-180' : ''}`} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="font-bold text-gold-200 mb-1 text-sm">{cardInfo.name}</div>
                                                                <div className="text-xs text-gray-300 leading-relaxed">{meaningText}</div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                !selectedEvents.length && (
                                    <div className="text-center py-12 flex flex-col items-center gap-4 opacity-50">
                                        <div className="text-4xl">🎴</div>
                                        <div className="text-sm font-serif italic">{t('dashboard.no_reading_day', language)}</div>
                                    </div>
                                )
                            )}
                        </div>
                        <div className="p-6 bg-black/40 border-t border-white/10">
                            <button id="btn-daily-reading" onClick={handleAddReadingForDate} className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-bold text-white shadow-lg hover:shadow-indigo-500/50 transition-all flex items-center justify-center gap-3 transform hover:-translate-y-1">
                                <span className="text-xl">✨</span> {t('dashboard.day_reading', language)}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Zodiac Info Modal - Detailed - Fixed Center Z-100 */}
            {zodiacModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setZodiacModal(null)}>
                    <div className="glass-panel-dark w-full max-w-2xl rounded-2xl border border-white/20 relative shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex justify-between items-start bg-white/5 relative overflow-hidden rounded-t-2xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div>
                                <div className="text-xs font-bold uppercase tracking-widest text-white/50 mb-1">{zodiacModal.type}</div>
                                <h3 className="text-3xl font-serif font-bold text-gold-400 flex items-center gap-3">
                                    {zodiacModal.type === 'Nap' ? '☀️' : zodiacModal.type === 'Hold' ? '🌕' : zodiacModal.type === 'Aszcendens' ? '🏹' : '🧧'}
                                    {zodiacModal.sign}
                                </h3>
                            </div>
                            <button onClick={() => setZodiacModal(null)} className="text-white/50 hover:text-white text-xl z-10 p-2">✕</button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            {zodiacModal.detail ? (
                                <div className="space-y-6">
                                    <p className="text-gray-200 leading-relaxed italic border-l-2 border-gold-500/50 pl-4 bg-white/5 p-3 rounded-r-lg">
                                        "{zodiacModal.detail.description}"
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Box 1: Keywords/Strength */}
                                        {(zodiacModal.detail.strengths || zodiacModal.detail.career) && (
                                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                                <h4 className="text-xs font-bold uppercase tracking-widest text-green-400 mb-3">
                                                    {zodiacModal.type === 'Kínai' ? 'Karrier' : 'Erősségek'}
                                                </h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {zodiacModal.type === 'Kínai' ? (
                                                        <div className="text-sm text-gray-300">{zodiacModal.detail.career}</div>
                                                    ) : (
                                                        zodiacModal.detail.strengths?.map((s: string) => (
                                                            <span key={s} className="bg-green-500/10 text-green-300 text-xs px-2 py-1 rounded border border-green-500/20">{s}</span>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Box 2: Weakness/Compatibility */}
                                        {(zodiacModal.detail.weaknesses || zodiacModal.detail.loveCompatibility) && (
                                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                                <h4 className="text-xs font-bold uppercase tracking-widest text-red-400 mb-3">
                                                    {zodiacModal.type === 'Kínai' ? 'Szerelem' : 'Gyengeségek'}
                                                </h4>
                                                {zodiacModal.type === 'Kínai' ? (
                                                    <div className="text-sm">
                                                        <div className="mb-1"><span className="text-green-400">Jó:</span> {zodiacModal.detail.loveCompatibility?.best}</div>
                                                        <div><span className="text-red-400">Kerülni:</span> {zodiacModal.detail.loveCompatibility?.worst}</div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-wrap gap-2">
                                                        {zodiacModal.detail.weaknesses?.map((w: string) => (
                                                            <span key={w} className="bg-red-500/10 text-red-300 text-xs px-2 py-1 rounded border border-red-500/20">{w}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Box 3: Favorites/Lucky */}
                                        <div className="bg-white/5 p-4 rounded-xl border border-white/5 md:col-span-2">
                                            <h4 className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-3">Szerencse & Jellemzők</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <div className="opacity-50 text-[10px] uppercase">Számok</div>
                                                    <div className="font-mono text-gold-200">{zodiacModal.detail.luckyNumbers || zodiacModal.detail.numbers}</div>
                                                </div>
                                                <div>
                                                    <div className="opacity-50 text-[10px] uppercase">Szín</div>
                                                    <div className="text-white">{zodiacModal.detail.luckyColors || zodiacModal.detail.color}</div>
                                                </div>
                                                <div>
                                                    <div className="opacity-50 text-[10px] uppercase">Virág</div>
                                                    <div className="text-pink-300">{zodiacModal.detail.luckyFlowers || zodiacModal.detail.flower}</div>
                                                </div>
                                                <div>
                                                    <div className="opacity-50 text-[10px] uppercase">Irányl / Bolygó</div>
                                                    <div className="text-blue-300">{zodiacModal.detail.luckyDirections || zodiacModal.detail.rulingPlanet}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-10 opacity-50 italic">
                                    Részletes leírás nem található.
                                    <br/><span className="text-xs">(Ellenőrizd az admin panelen a feltöltött adatokat)</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
