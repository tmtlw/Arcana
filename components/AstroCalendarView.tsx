
import React, { useState, useMemo } from 'react';
import { useTarot } from '../context/TarotContext';
import { AstroService } from '../services/astroService';
import { Spread, CommunityEvent } from '../types';
import { t } from '../services/i18nService';
import { HOLIDAY_DETAILS, getAvatarUrl } from '../constants';

export const AstroCalendarView = ({ onBack, onStartReading }: { onBack: () => void, onStartReading: (s: Spread, date?: Date) => void }) => {
    const { allSpreads, userLocation, language, communityEvents, currentUser, addCommunityEvent, joinCommunityEvent, leaveCommunityEvent } = useTarot();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEvent, setSelectedEvent] = useState<{ date: Date, event: any, spread?: Spread, isCommunity?: boolean, communityEvent?: CommunityEvent } | null>(null);
    
    // Create Event Modal State
    const [isCreatingEvent, setIsCreatingEvent] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState("");
    const [newEventDesc, setNewEventDesc] = useState("");
    const [newEventType, setNewEventType] = useState<CommunityEvent['type']>('ritual');
    const [newEventSpreadId, setNewEventSpreadId] = useState("");

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 Sun
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Mon start

    const monthData = useMemo(() => {
        const days = [];
        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
            const astro = AstroService.getAstroData(d, userLocation || undefined);
            const wiccan = AstroService.getWiccanHoliday(d);
            const dailyEvents = (communityEvents || []).filter(ce => {
                const ceDate = new Date(ce.date);
                return ceDate.getDate() === i && ceDate.getMonth() === currentDate.getMonth() && ceDate.getFullYear() === currentDate.getFullYear();
            });
            
            // Determine special events/spreads
            let recommendedSpreadId: string | null = null;
            let eventLabel: string | null = null;
            let eventColor = '';
            let eventIcon = '';
            let eventDesc = '';
            let moonStage: 'glowing' | 'normal' | 'faded' | 'idle' = 'idle';

            const currentPhase = astro.moonPhase;
            
            if (currentPhase === 'Telihold' || currentPhase === 'Újhold') {
                // Find the streak (how many days this phase lasts around this date)
                let streakBefore = 0;
                let streakAfter = 0;
                
                // Look back
                for (let offset = 1; offset <= 5; offset++) {
                    const checkD = new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset);
                    const checkA = AstroService.getAstroData(checkD, userLocation || undefined);
                    if (checkA.moonPhase === currentPhase) streakBefore++;
                    else break;
                }
                // Look forward
                for (let offset = 1; offset <= 5; offset++) {
                    const checkD = new Date(d.getFullYear(), d.getMonth(), d.getDate() + offset);
                    const checkA = AstroService.getAstroData(checkD, userLocation || undefined);
                    if (checkA.moonPhase === currentPhase) streakAfter++;
                    else break;
                }

                const streakLength = streakBefore + streakAfter + 1;
                const midIndex = Math.floor(streakLength / 2);
                const currentIndexInStreak = streakBefore; // 0-based index

                // Strict 1-2-3 logic: Only ONE day for each label
                if (currentIndexInStreak === midIndex) {
                    moonStage = 'normal';
                } else if (currentIndexInStreak === midIndex - 1) {
                    moonStage = 'glowing';
                } else if (currentIndexInStreak === midIndex + 1) {
                    moonStage = 'faded';
                } else {
                    moonStage = 'idle'; // Generic day in the same phase block
                }

                if (currentPhase === 'Telihold') {
                    recommendedSpreadId = 'full-moon-release';
                    eventLabel = 'Telihold';
                    eventColor = moonStage === 'faded' ? 'text-gold-500/40' : 'text-gold-400';
                    eventIcon = '🌕';
                    eventDesc = 'Az elengedés és a tetőzés ideje.';
                } else {
                    recommendedSpreadId = 'new-moon-manifest';
                    eventLabel = 'Újhold';
                    eventColor = moonStage === 'faded' ? 'text-blue-500/40' : 'text-blue-300';
                    eventIcon = '🌑';
                    eventDesc = 'Az új kezdetek és a teremtés ideje.';
                }
            }

            // Priority: Wiccan Holiday -> Moon Phase
            if (wiccan) {
                recommendedSpreadId = wiccan.spreadId;
                eventLabel = wiccan.name;
                eventColor = 'text-purple-300';
                eventIcon = wiccan.icon;
                eventDesc = wiccan.desc;
            }

            days.push({
                date: d,
                day: i,
                astro,
                recommendedSpreadId,
                eventLabel,
                eventColor,
                eventIcon,
                eventDesc,
                moonStage,
                communityEvents: dailyEvents
            });
        }
        return days;
    }, [currentDate, userLocation, communityEvents]);

    const changeMonth = (offset: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    const handleDayClick = (dayData: any) => {
        if (dayData.communityEvents.length > 0) {
            // Priority: Show community event if it exists
            const ce = dayData.communityEvents[0];
            const spread = allSpreads.find(s => s.id === ce.spreadId);
            setSelectedEvent({
                date: dayData.date,
                event: {
                    name: ce.title,
                    icon: ce.type === 'ritual' ? '🔥' : ce.type === 'meditation' ? '🧘' : ce.type === 'circle' ? '⭕' : '📚',
                    desc: ce.description
                },
                spread,
                isCommunity: true,
                communityEvent: ce
            });
        } else if (dayData.eventLabel) {
            const spread = allSpreads.find(s => s.id === dayData.recommendedSpreadId);
            setSelectedEvent({
                date: dayData.date,
                event: {
                    name: dayData.eventLabel,
                    icon: dayData.eventIcon,
                    desc: dayData.eventDesc
                },
                spread
            });
        } else {
            // Normal day clicked
            setSelectedEvent({
                date: dayData.date,
                event: {
                    name: "Csendes Nap",
                    icon: "✨",
                    desc: "Ma nincsenek központi égi események."
                }
            });
        }
    };

    const handleCreateEvent = async () => {
        if (!selectedEvent || !newEventTitle || !currentUser) return;
        
        const event: CommunityEvent = {
            id: `event_${Date.now()}`,
            title: newEventTitle,
            description: newEventDesc,
            date: selectedEvent.date.toISOString(),
            type: newEventType,
            hostId: currentUser.id,
            hostName: currentUser.name,
            hostAvatar: getAvatarUrl(currentUser),
            participants: [currentUser.id],
            participantDetails: [{ uid: currentUser.id, name: currentUser.name, avatar: getAvatarUrl(currentUser) }],
            spreadId: newEventSpreadId,
            createdAt: new Date().toISOString()
        };

        const success = await addCommunityEvent(event);
        if (success) {
            setIsCreatingEvent(false);
            setNewEventTitle("");
            setNewEventDesc("");
            // Refresh detail view to show the new event
            const updatedSpread = allSpreads.find(s => s.id === event.spreadId);
            setSelectedEvent({
                date: selectedEvent.date,
                event: { name: event.title, icon: '🔥', desc: event.description },
                spread: updatedSpread,
                isCommunity: true,
                communityEvent: event
            });
        }
    };

    const handleJoin = async () => {
        if (!selectedEvent?.communityEvent) return;
        await joinCommunityEvent(selectedEvent.communityEvent.id);
    };

    const handleLeave = async () => {
        if (!selectedEvent?.communityEvent) return;
        await leaveCommunityEvent(selectedEvent.communityEvent.id);
    };

    const weekDays = ['H', 'K', 'S', 'C', 'P', 'S', 'V'];

    return (
        <div className="animate-fade-in max-w-5xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-6">
                <button onClick={onBack} className="flex items-center gap-2 font-bold text-white/60 hover:text-gold-400 transition-colors mr-4">
                    <span>&larr;</span> {t('btn.back', language)}
                </button>
                <h2 className="text-2xl font-serif font-bold text-white hidden md:block">Holdnaptár & Közösség</h2>
                <div className="w-20"></div> {/* Spacer */}
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-white/10">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <button onClick={() => changeMonth(-1)} className="text-2xl hover:text-gold-400 transition-colors">◄</button>
                    <div className="text-center">
                        <div className="text-3xl font-bold font-serif text-white">
                            {currentDate.getFullYear()}. {currentDate.toLocaleDateString(language === 'hu' ? 'hu-HU' : 'en-US', { month: 'long' })}
                        </div>
                        <div className="text-xs text-white/40 uppercase tracking-widest mt-1">Év Kereke & Közösségi Események</div>
                    </div>
                    <button onClick={() => changeMonth(1)} className="text-2xl hover:text-gold-400 transition-colors">►</button>
                </div>

                {/* Grid Header */}
                <div className="grid grid-cols-7 mb-4 border-b border-white/10 pb-2">
                    {weekDays.map((d, i) => (
                        <div key={`${d}-${i}`} className="text-center font-bold text-white/30 text-sm">{d}</div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-2 md:gap-4">
                    {Array.from({ length: startOffset }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square"></div>
                    ))}
                    
                    {monthData.map((d) => {
                        const hasCommunity = d.communityEvents.length > 0;
                        const isMoonEvent = d.eventLabel === 'Telihold' || d.eventLabel === 'Újhold';
                        
                        // Dynamic styling based on moon stage
                        let moonClasses = "";
                        if (isMoonEvent) {
                            if (d.moonStage === 'glowing') moonClasses = "shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-pulse-slow ring-2 ring-gold-500/50 scale-105 z-10";
                            else if (d.moonStage === 'faded') moonClasses = "opacity-40 grayscale-[0.7]";
                            else if (d.moonStage === 'normal') moonClasses = "ring-1 ring-white/40 bg-white/10"; // Normal peak
                        }

                        return (
                            <div 
                                key={d.day} 
                                onClick={() => handleDayClick(d)}
                                className={`
                                    aspect-square md:aspect-[4/3] rounded-xl border transition-all cursor-pointer relative overflow-hidden group flex flex-col items-center justify-between p-2
                                    ${(d.eventLabel || hasCommunity) ? 'border-gold-500/30 bg-white/10 hover:bg-white/20' : 'border-white/5 bg-white/5 hover:bg-white/10'}
                                    ${moonClasses}
                                `}
                            >
                                <div className="w-full flex justify-between items-start">
                                    <span className={`text-sm font-bold ${d.date.toDateString() === new Date().toDateString() ? 'text-gold-500 underline decoration-2' : 'text-white/60'}`}>{d.day}</span>
                                    <span className="text-xs opacity-50" title={d.astro.moonPhase}>{d.astro.icon}</span>
                                </div>
                                
                                <div className="flex-1 flex flex-col items-center justify-center gap-1 w-full">
                                    {d.eventLabel ? (
                                        <>
                                            <div className={`text-xl ${d.moonStage === 'glowing' ? 'scale-125' : ''}`}>{d.eventIcon}</div>
                                            <div className={`text-[8px] md:text-[10px] font-bold text-center leading-tight ${d.eventColor} w-full truncate`}>
                                                {d.eventLabel}
                                                {isMoonEvent && d.moonStage === 'glowing' && <span className="block text-[6px] text-gold-200 uppercase mt-0.5">1. nap: Ragyogás</span>}
                                                {isMoonEvent && d.moonStage === 'normal' && <span className="block text-[6px] text-white uppercase mt-0.5">2. nap: Csúcspont</span>}
                                                {isMoonEvent && d.moonStage === 'faded' && <span className="block text-[6px] text-white/50 uppercase mt-0.5">3. nap: Fakó</span>}
                                            </div>
                                        </>
                                    ) : hasCommunity ? (
                                        <>
                                            <div className="text-xl animate-bounce-slow">✨</div>
                                            <div className="text-[8px] md:text-[10px] font-bold text-center leading-tight text-indigo-300 w-full truncate">
                                                {d.communityEvents[0].title}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-[10px] text-white/20 uppercase tracking-wider hidden md:block">{d.astro.moonSign}</div>
                                    )}
                                </div>
                                {hasCommunity && <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-indigo-500 rounded-full m-1 shadow-[0_0_5px_rgba(99,102,241,1)]"></div>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Event Detail Modal */}
            {selectedEvent && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedEvent(null)}>
                    <div 
                        className="glass-panel-dark w-full max-w-xl rounded-3xl border border-gold-500/30 overflow-hidden flex flex-col max-h-[90vh] shadow-[0_0_50px_rgba(234,179,8,0.2)]" 
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header (Sticky) */}
                        <div className="relative h-36 bg-gradient-to-b from-indigo-900/50 to-transparent flex-shrink-0">
                            <button 
                                onClick={() => setSelectedEvent(null)} 
                                className="absolute top-4 right-4 bg-black/50 hover:bg-white/20 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all z-20 backdrop-blur-md"
                            >
                                ✕
                            </button>
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none p-4">
                                <div className="text-5xl mb-2 filter drop-shadow-lg animate-float">{selectedEvent.event.icon}</div>
                                <h3 className="text-2xl md:text-3xl font-serif font-bold text-white shadow-black drop-shadow-md text-center">{selectedEvent.event.name}</h3>
                            </div>
                        </div>
                        
                        {/* Scrollable Content */}
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            <div className="text-center text-gold-400 font-bold uppercase text-xs tracking-widest mb-6">
                                {selectedEvent.date.toLocaleDateString()}
                            </div>

                            {/* Community Event Specifics */}
                            {selectedEvent.isCommunity && selectedEvent.communityEvent && (
                                <div className="mb-8 space-y-6">
                                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                                        <img src={selectedEvent.communityEvent.hostAvatar || ""} className="w-12 h-12 rounded-full border-2 border-gold-500" />
                                        <div>
                                            <div className="text-[10px] uppercase font-bold text-white/40">Esemény Gazda</div>
                                            <div className="font-bold text-white">{selectedEvent.communityEvent.hostName}</div>
                                        </div>
                                    </div>

                                    <p className="text-gray-300 leading-relaxed italic text-center">
                                        "{selectedEvent.event.desc}"
                                    </p>

                                    <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                                        <h4 className="text-xs font-bold uppercase text-gold-500 mb-3 tracking-widest">Résztvevők ({selectedEvent.communityEvent.participants.length})</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedEvent.communityEvent.participantDetails?.map(p => (
                                                <div key={p.uid} className="flex flex-col items-center gap-1 group">
                                                    <img src={p.avatar || ""} className="w-8 h-8 rounded-full border border-white/10" title={p.name} />
                                                    <span className="text-[8px] text-white/30 truncate w-10 text-center">{p.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        {selectedEvent.communityEvent.participants.includes(currentUser?.id || '') ? (
                                            <button 
                                                onClick={handleLeave}
                                                className="flex-1 py-3 bg-red-500/20 text-red-300 font-bold rounded-xl border border-red-500/30 hover:bg-red-500/40 transition-all"
                                            >
                                                Kilépés
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={handleJoin}
                                                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all"
                                            >
                                                Csatlakozás a körhöz
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Holiday & Season Specifics */}
                            {!selectedEvent.isCommunity && HOLIDAY_DETAILS[selectedEvent.event.name] && (
                                <div className="grid gap-4 mb-8">
                                    <p className="text-gray-300 leading-relaxed mb-4 italic text-center">
                                        "{HOLIDAY_DETAILS[selectedEvent.event.name]?.meaning || selectedEvent.event.desc}"
                                    </p>

                                    {/* Quote Block */}
                                    {HOLIDAY_DETAILS[selectedEvent.event.name].quote && (
                                        <div className="mb-6 relative py-4 px-8 border-y border-white/10">
                                            <span className="absolute top-2 left-2 text-2xl text-gold-500/30 font-serif opacity-50">“</span>
                                            <p className="text-white text-center font-serif italic text-lg leading-snug">
                                                {HOLIDAY_DETAILS[selectedEvent.event.name].quote}
                                            </p>
                                            <span className="absolute bottom-2 right-2 text-2xl text-gold-500/30 font-serif opacity-50 rotate-180">“</span>
                                        </div>
                                    )}

                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <h4 className="font-bold text-gold-400 mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">
                                            <span>🎨</span> Színek
                                        </h4>
                                        <p className="text-sm text-gray-300">{HOLIDAY_DETAILS[selectedEvent.event.name].colors}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <h4 className="font-bold text-blue-300 mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">
                                            <span>🌬️</span> Illatok & Kristályok
                                        </h4>
                                        <p className="text-sm text-gray-300">
                                            {HOLIDAY_DETAILS[selectedEvent.event.name].scents} <br/>
                                            <span className="opacity-70 text-xs">({HOLIDAY_DETAILS[selectedEvent.event.name].crystals})</span>
                                        </p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <h4 className="font-bold text-purple-300 mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">
                                            <span>🕯️</span> Javasolt Rituálé
                                        </h4>
                                        <p className="text-sm text-gray-300 italic">
                                            {HOLIDAY_DETAILS[selectedEvent.event.name].ritual}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Spread Recommendation / Creating Community Event */}
                            <div className="space-y-4">
                                {selectedEvent.spread ? (
                                    <div className="bg-gold-500/10 p-5 rounded-2xl border border-gold-500/30">
                                        <h4 className="font-bold text-white text-sm mb-1 text-center">Ajánlott Kirakás</h4>
                                        <div className="text-lg font-serif font-bold text-gold-400 text-center mb-1">{selectedEvent.spread.name}</div>
                                        <p className="text-xs text-white/50 mb-6 text-center italic leading-relaxed">{selectedEvent.spread.description}</p>
                                        <button 
                                            onClick={() => onStartReading(selectedEvent.spread!, selectedEvent.date)}
                                            className="w-full py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-black font-bold rounded-xl shadow-lg transition-all transform hover:-translate-y-1"
                                        >
                                            Saját Kirakás Elvégzése
                                        </button>
                                    </div>
                                ) : !selectedEvent.isCommunity && (
                                    <div className="text-white/40 text-sm text-center py-4 italic border-t border-white/5">Ehhez az eseményhez nincs speciális kirakás.</div>
                                )}

                                {!selectedEvent.isCommunity && (
                                    <button 
                                        onClick={() => setIsCreatingEvent(true)}
                                        className="w-full py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-indigo-300 font-bold rounded-xl text-xs uppercase tracking-widest transition-all"
                                    >
                                        Közösségi Szeánsz Szervezése Erre a Napra
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Event Modal */}
            {isCreatingEvent && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
                    <div className="glass-panel-dark w-full max-w-md rounded-3xl border border-gold-500/30 p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-serif font-bold text-white mb-6 text-center">Új Esemény Létrehozása</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-gold-400 mb-1 ml-1">Esemény Címe</label>
                                <input 
                                    value={newEventTitle} onChange={e => setNewEventTitle(e.target.value)} 
                                    placeholder="Pl. Teliholdas Meditáció" 
                                    className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-gold-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-gold-400 mb-1 ml-1">Típus</label>
                                <select 
                                    value={newEventType} onChange={e => setNewEventType(e.target.value as any)}
                                    className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-gold-500"
                                >
                                    <option value="ritual">🔥 Közös Rituálé</option>
                                    <option value="meditation">🧘 Meditáció</option>
                                    <option value="circle">⭕ Boszorkánykör</option>
                                    <option value="learning">📚 Közös Tanulás</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-gold-400 mb-1 ml-1">Leírás</label>
                                <textarea 
                                    value={newEventDesc} onChange={e => setNewEventDesc(e.target.value)} 
                                    placeholder="Miről szól a szeánsz?" 
                                    className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white h-24 resize-none outline-none focus:border-gold-500"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-gold-400 mb-1 ml-1">Ajánlott Kirakás (Opcionális)</label>
                                <select 
                                    value={newEventSpreadId} onChange={e => setNewEventSpreadId(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-gold-500"
                                >
                                    <option value="">-- Nincs ajánlás --</option>
                                    {allSpreads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            
                            <div className="flex gap-4 mt-8">
                                <button onClick={() => setIsCreatingEvent(false)} className="flex-1 py-3 text-white/50 font-bold hover:text-white">Mégse</button>
                                <button 
                                    onClick={handleCreateEvent}
                                    disabled={!newEventTitle}
                                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all"
                                >
                                    Esemény Publikálása
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                    <h3 className="font-bold text-gold-400 mb-2">🌿 Az Év Kereke</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">
                        A naptár jelzi a 8 fő Wicca ünnepet (Sabbat). Ezek a napfordulókhoz, napéjegyenlőségekhez és a mezőgazdasági ciklusokhoz kötődnek. Kattints az ikonokra a rituálék eléréséhez.
                    </p>
                </div>
                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                    <h3 className="font-bold text-blue-300 mb-2">✨ Közösségi Körök</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">
                        Nem kell egyedül járnod az utat. Hozz létre közösségi eseményeket, vagy csatlakozz mások köréhez a naptárban jelzett napokon. A közös energia felerősíti a jóslatokat.
                    </p>
                </div>
            </div>
        </div>
    );
};
