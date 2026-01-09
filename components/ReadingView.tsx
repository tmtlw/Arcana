
import React, { useState, useMemo, useEffect } from 'react';
import { useTarot } from '../context/TarotContext';
import { Card, Spread, DrawnCard, SpreadPosition, Reading } from '../types';
import { THEMES, getAvatarUrl, MOODS } from '../constants';
import { CardImage } from './CardImage';
import { CommunityService } from '../services/communityService';
import { AstroService } from '../services/astroService';
import { t } from '../services/i18nService';
import { ReadingAnalysis } from './ReadingAnalysis'; // Import new component

export const ReadingView = ({ spread, deck, onCancel, targetDate }: { spread: Spread, deck: Card[], onCancel: () => void, targetDate?: Date }) => {
    const { currentUser, addReading, playSound, language, showToast, activeThemeKey, userLocation } = useTarot();
    
    // Core State
    const [cards, setCards] = useState<DrawnCard[]>([]);
    const [question, setQuestion] = useState("");
    const [notes, setNotes] = useState("");
    const [isPublic, setIsPublic] = useState(false);
    const [selectedMood, setSelectedMood] = useState<string>('calm');
    
    // UI States
    const [isShuffling, setIsShuffling] = useState(false);
    const [layoutParams, setLayoutParams] = useState({ w: 140, h: 210, gap: 24, padding: 48, scale: 0.95 });
    const [finishedReading, setFinishedReading] = useState<Reading | null>(null); // Store finished reading

    // Selector Modal State
    const [selectingPosition, setSelectingPosition] = useState<SpreadPosition | null>(null);
    const [selectorSearch, setSelectorSearch] = useState("");
    const [selectorReversed, setSelectorReversed] = useState(false);

    // Responsive Layout Logic
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) {
                setLayoutParams({ w: 85, h: 130, gap: 10, padding: 20, scale: 0.95 });
            } else {
                setLayoutParams({ w: 140, h: 210, gap: 24, padding: 48, scale: 0.95 });
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isFreeform = useMemo(() => {
        return !!spread.backgroundImage || spread.positions.some(p => p.x > 15 || p.y > 15);
    }, [spread]);

    const maxX = isFreeform ? 0 : Math.max(...spread.positions.map(p => p.x));
    const maxY = isFreeform ? 0 : Math.max(...spread.positions.map(p => p.y));

    const date = useMemo(() => targetDate || new Date(), [targetDate]);
    const astroData = useMemo(() => AstroService.getAstroData(date, userLocation || undefined), [date, userLocation]);

    const filteredDeck = deck.filter(c => c.name.toLowerCase().includes(selectorSearch.toLowerCase()));

    const handleSlotClick = (pos: SpreadPosition) => {
        setSelectingPosition(pos);
        setSelectorSearch("");
        setSelectorReversed(false);
    };

    const handleSelectCard = (card: Card) => {
        if (!selectingPosition) return;
        const newDrawn: DrawnCard = { positionId: selectingPosition.id, cardId: card.id, isReversed: selectorReversed };
        const others = cards.filter(c => c.positionId !== selectingPosition.id);
        setCards([...others, newDrawn]);
        playSound('flip');
        setSelectingPosition(null);
    };

    const handleRemoveCard = (e: React.MouseEvent, posId: number) => {
        e.stopPropagation(); 
        setCards(cards.filter(c => c.positionId !== posId));
    };

    const handleShuffle = () => {
        setIsShuffling(true);
        setTimeout(() => { setIsShuffling(false); setCards([]); }, 1000);
    };

    const handleSave = async () => {
        if(!currentUser || cards.length !== spread.positions.length) return;
        const entryDate = targetDate ? targetDate.toISOString() : new Date().toISOString();
        const readingId = Math.random().toString(36).substr(2, 9);
        
        const newReading: Reading = {
            id: readingId, userId: currentUser.id, date: entryDate, spreadId: spread.id, cards, notes: notes,
            question, isFavorite: false, astrology: astroData, isPublic: isPublic, mood: selectedMood,
            authorName: currentUser.name, authorAvatar: getAvatarUrl(currentUser), likes: 0
        };
        
        // Save locally/to user profile first
        addReading(newReading);
        
        if (isPublic) {
            const success = await CommunityService.publishReading(newReading);
            if (!success) {
                showToast("A publikálás sikertelen (de a naplóba mentve).", "info");
            }
        }
        
        // Instead of closing, switch to analysis mode
        setFinishedReading(newReading);
    };

    const isComplete = cards.length === spread.positions.length;

    // IF READING IS SAVED, SHOW ANALYSIS
    if (finishedReading) {
        return <ReadingAnalysis reading={finishedReading} spread={spread} onClose={onCancel} />;
    }

    return (
        <>
            <div className="max-w-7xl mx-auto pb-20 animate-fade-in px-2 md:px-4">
                {/* Header Controls */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 no-print">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button onClick={onCancel} className="glass-button px-4 py-2 rounded-full flex items-center gap-2 font-bold text-sm text-white">
                            <span>&larr;</span> {t('reading.back', language)}
                        </button>
                        {targetDate && (
                            <div className="text-gold-400 text-xs uppercase font-bold tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/10">
                                Dátum: {targetDate.toLocaleDateString()}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex flex-col items-center flex-1">
                        <h2 className="text-2xl font-serif font-bold text-gold-400 text-center uppercase tracking-wider">{spread.name}</h2>
                        {spread.description && <p className="text-xs text-white/50 italic max-w-lg text-center mt-1">{spread.description}</p>}
                    </div>

                    <div className="flex gap-2 items-center">
                        <button onClick={handleShuffle} className="glass-button px-3 py-2 rounded-full font-bold text-xs hover:text-gold-400" title="Kártyák újrakeverése">🌪️</button>
                        <button onClick={handleSave} disabled={!isComplete} className={`px-6 py-2 rounded-full font-bold text-sm shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-all transform hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:shadow-none bg-gradient-to-r from-gold-500 to-gold-600 text-black`}>
                            {t('reading.save', language)}
                        </button>
                    </div>
                </div>

                {/* Question Input */}
                <div className="mb-8 glass-panel p-6 rounded-2xl relative overflow-hidden">
                    <div className="flex flex-col md:flex-row gap-6 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-bold uppercase tracking-wider opacity-50 mb-2 text-gold-400">{t('reading.question_label', language)}</label>
                            <input 
                                className="w-full bg-transparent border-b border-white/20 p-2 text-2xl font-serif text-white placeholder-white/20 focus:outline-none focus:border-gold-500 transition-colors"
                                placeholder={t('reading.question_placeholder', language)}
                                value={question}
                                onChange={e => setQuestion(e.target.value)}
                            />
                            {/* Personal Notes (Pre-save) */}
                            <div className="mt-4">
                                <label className="block text-[10px] font-bold uppercase tracking-wider opacity-50 mb-1 text-white">Személyes Jegyzet (Opcionális)</label>
                                <textarea
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold-500 transition-colors resize-none h-20"
                                    placeholder="Itt már most elkezdheted az értelmezést..."
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-white/10">
                        {/* Mood Selection First */}
                        <div className="flex items-center gap-2 bg-black/20 p-1 rounded-lg">
                            {MOODS.map(m => (
                                <button 
                                    key={m.id} 
                                    onClick={() => setSelectedMood(m.id)}
                                    className={`w-8 h-8 rounded flex items-center justify-center transition-all ${selectedMood === m.id ? 'bg-white/20 scale-110 shadow-lg' : 'opacity-50 hover:opacity-100'}`}
                                    title={m.label}
                                >
                                    {m.icon}
                                </button>
                            ))}
                        </div>

                        {/* Astro Info Badge (Planetary Hour & Moon Sign added) - Positioned after mood */}
                        <div className="flex flex-wrap gap-2 text-[10px] uppercase font-bold tracking-widest text-white/60">
                            <span className="bg-black/30 px-2 py-1 rounded border border-white/10 text-gold-200" title="Planéták Órája">🪐 {astroData.planetHour}</span>
                            <span className="bg-black/30 px-2 py-1 rounded border border-white/10" title="Napjegy">☀️ {astroData.sunSign}</span>
                            <span className="bg-black/30 px-2 py-1 rounded border border-white/10 text-blue-200" title={`Hold: ${Math.round(astroData.illumination * 100)}%`}>
                                {astroData.icon} {astroData.moonSign} ({Math.round(astroData.illumination * 100)}%)
                            </span>
                        </div>

                        <label className={`flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg border transition-all ml-auto ${isPublic ? 'bg-green-500/20 border-green-500 text-green-200' : 'bg-white/5 border-white/10 text-white/50'}`}>
                            <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="hidden" />
                            <span className="text-sm font-bold">{isPublic ? '🌐 Publikus' : '🔒 Privát'}</span>
                        </label>
                    </div>
                </div>

                {/* MAIN CONTENT AREA */}
                <div className={`transition-all duration-500 ${isShuffling ? 'opacity-50 blur-sm' : 'opacity-100'}`}>
                    <div className="mb-12">
                        {isFreeform ? (
                            <div className="relative w-full aspect-[4/3] md:aspect-video bg-black/40 rounded-3xl border-2 border-white/10 overflow-hidden shadow-2xl mx-auto max-w-5xl">
                                {spread.backgroundImage && <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: `url(${spread.backgroundImage})` }}></div>}
                                {spread.positions.map(pos => {
                                    const drawn = cards.find(c => c.positionId === pos.id);
                                    const cardData = drawn ? deck.find(c => c.id === drawn.cardId) : null;
                                    return (
                                        <div key={pos.id} onClick={() => handleSlotClick(pos)} className="absolute cursor-pointer transition-transform hover:z-50 hover:scale-110 origin-center"
                                            style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: '12%', aspectRatio: '2/3', transform: `translate(-50%, -50%) rotate(${pos.rotation || 0}deg)` }}>
                                            <div className={`w-full h-full rounded-lg shadow-xl relative transition-all duration-300 ${drawn ? '' : 'border-2 border-dashed border-white/30 bg-white/5 hover:bg-white/10'}`}>
                                                {!drawn && <div className="flex flex-col items-center justify-center h-full text-center p-1"><div className="w-5 h-5 rounded-full bg-gold-500 text-black font-bold flex items-center justify-center text-[10px] mb-1">{pos.id}</div><span className="text-[8px] font-bold uppercase opacity-80 leading-tight text-white bg-black/50 px-1 rounded">{pos.name}</span></div>}
                                                {drawn && cardData && <><CardImage cardId={cardData.id} className={`w-full h-full object-cover rounded-lg shadow-md ${drawn.isReversed ? 'rotate-180' : ''}`} /><button onClick={(e) => handleRemoveCard(e, pos.id)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-lg z-20 hover:scale-110 transition-transform border border-white">✕</button></>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="overflow-x-auto custom-scrollbar p-4 perspective-1000 text-center">
                                <div className="inline-grid rounded-[3rem] relative shadow-2xl border-8 border-double border-white/5 transform-gpu text-left"
                                    style={{ background: 'radial-gradient(circle at center, #1e1b4b 0%, #000000 100%)', gridTemplateColumns: `repeat(${maxX}, ${layoutParams.w}px)`, gridTemplateRows: `repeat(${maxY}, ${layoutParams.h}px)`, gap: `${layoutParams.gap}px`, padding: `${layoutParams.padding}px`, transform: `rotateX(25deg) scale(${layoutParams.scale})`, transformStyle: 'preserve-3d', transformOrigin: 'center center' }}>
                                    {spread.positions.map(pos => {
                                        const drawn = cards.find(c => c.positionId === pos.id);
                                        const cardData = drawn ? deck.find(c => c.id === drawn.cardId) : null;
                                        return (
                                            <div key={pos.id} onClick={() => handleSlotClick(pos)} className="relative cursor-pointer transition-all duration-500 hover:z-50"
                                                style={{ gridColumn: pos.x, gridRow: pos.y, zIndex: pos.id, transformStyle: 'preserve-3d', transform: `translateZ(${drawn ? '10px' : '0px'}) rotate(${pos.rotation || 0}deg)` }}>
                                                <div className={`w-full h-full rounded-xl relative transition-all duration-700 transform-style-preserve-3d ${drawn ? '' : 'border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10'}`}>
                                                    {!drawn && <div className="flex flex-col items-center justify-center h-full text-center" style={{transform: `rotate(-${pos.rotation || 0}deg)`}}><div className="w-8 h-8 md:w-12 md:h-12 rounded-full border border-white/20 flex items-center justify-center mb-1 md:mb-2 text-white/40 font-serif text-sm md:text-xl">{pos.id}</div><span className="text-[9px] md:text-xs font-bold uppercase opacity-60 leading-tight text-gold-200 px-1">{pos.name}</span></div>}
                                                    {drawn && cardData && <><div className="absolute inset-0 backface-hidden bg-indigo-900 rounded-lg" style={{transform: 'rotateY(180deg)'}}></div><div className="w-full h-full relative animate-fade-in backface-hidden bg-black rounded-lg shadow-2xl"><CardImage cardId={cardData.id} className={`w-full h-full object-cover rounded-lg ${drawn.isReversed ? 'rotate-180' : ''}`} /></div><button onClick={(e) => handleRemoveCard(e, pos.id)} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-lg z-20 hover:scale-110 transition-transform">✕</button></>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {!isComplete && (
                        <div className="text-center py-10 opacity-50 animate-pulse text-white/50">
                            Válassz ki minden lapot a részletes elemzés megtekintéséhez.
                        </div>
                    )}

                    {/* Spread Position Legend (Requested Feature) */}
                    <div className="mt-12 border-t border-white/10 pt-8">
                        <h3 className="text-sm font-bold uppercase text-gold-500 mb-6 tracking-widest text-center">A Lapok Helye & Jelentése</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {spread.positions.sort((a,b) => a.id - b.id).map(pos => {
                                const drawn = cards.find(c => c.positionId === pos.id);
                                const card = drawn ? deck.find(d => d.id === drawn.cardId) : null;
                                return (
                                    <div key={pos.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4 items-start hover:bg-white/10 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-gold-500/20 text-gold-400 font-bold flex items-center justify-center border border-gold-500/30 flex-shrink-0">
                                            {pos.id}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-sm mb-1">{pos.name}</div>
                                            <div className="text-xs text-white/50 leading-relaxed mb-2">{pos.description}</div>
                                            {card && (
                                                <div className="bg-black/30 p-2 rounded border border-white/5 mt-2 flex items-center gap-2">
                                                    <span className="text-lg">🎴</span>
                                                    <div>
                                                        <div className="font-serif font-bold text-gold-200 text-xs">{card.name}</div>
                                                        {drawn?.isReversed && <span className="text-[9px] text-red-400 uppercase font-bold">Fordított</span>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Selector Modal */}
            {selectingPosition && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="glass-panel-dark w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/20">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <div><h3 className="font-serif font-bold text-2xl text-gold-400">{selectingPosition.name}</h3><p className="text-sm opacity-60">{selectingPosition.description}</p></div>
                            <button onClick={() => setSelectingPosition(null)} className="text-2xl hover:bg-white/10 w-12 h-12 rounded-full flex items-center justify-center transition-colors">✕</button>
                        </div>
                        <div className="p-6 border-b border-white/10 flex flex-col md:flex-row gap-4 bg-black/20">
                            <input autoFocus type="text" placeholder="Keresés..." className="flex-1 bg-white/10 border border-white/10 p-3 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors" value={selectorSearch} onChange={e => setSelectorSearch(e.target.value)} />
                            <label className={`flex items-center gap-3 px-6 py-3 rounded-xl cursor-pointer transition-all border ${selectorReversed ? 'bg-red-900/40 border-red-500 text-red-200' : 'bg-white/5 border-white/10 text-gray-400'}`}>
                                <input type="checkbox" className="w-5 h-5 accent-red-500" checked={selectorReversed} onChange={e => setSelectorReversed(e.target.checked)} />
                                <span className="font-bold uppercase text-sm tracking-wider">Fordított</span>
                            </label>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
                                {filteredDeck.map(card => (
                                    <div key={card.id} onClick={() => handleSelectCard(card)} className="group cursor-pointer flex flex-col items-center">
                                        <div className="w-full aspect-[2/3] rounded-xl overflow-hidden mb-3 relative shadow-lg transition-all duration-300 group-hover:scale-105 border border-white/10">
                                            <CardImage cardId={card.id} className={`w-full h-full object-cover transition-transform duration-500 ${selectorReversed ? 'rotate-180' : ''}`} />
                                        </div>
                                        <div className="text-center font-serif font-bold text-xs text-gray-300 group-hover:text-gold-400">{card.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
