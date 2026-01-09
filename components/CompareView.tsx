
import React, { useState, useEffect } from 'react';
import { Reading } from '../types';
import { useTarot } from '../context/TarotContext';
import { CardImage } from './CardImage';
import { FULL_DECK } from '../constants';
import { DeckService } from '../services/deckService';

interface CompareViewProps {
    readings?: Reading[]; // Changed from reading1, reading2 to array
    cardIdToCompare?: string; // New mode: Compare specific card across decks
    onBack: () => void;
}

export const CompareView = ({ readings, cardIdToCompare, onBack }: CompareViewProps) => {
    const { allSpreads, availableDecks } = useTarot();
    const [selectedDecks, setSelectedDecks] = useState<string[]>([]);

    useEffect(() => {
        if (cardIdToCompare && availableDecks.length > 0) {
            // Default select first 3 decks (or fewer)
            setSelectedDecks(availableDecks.slice(0, 3).map(d => d.id));
        }
    }, [cardIdToCompare, availableDecks]);

    // --- MODE 1: READING COMPARISON ---
    if (readings && readings.length > 0) {
        return (
            <div className="animate-fade-in h-[calc(100vh-100px)] flex flex-col max-w-full mx-auto">
                <div className="flex justify-between items-center mb-4 px-4">
                    <button onClick={onBack} className="flex items-center gap-2 font-bold text-white/60 hover:text-gold-400">
                        &larr; Vissza a Naplóhoz
                    </button>
                    <h2 className="text-xl font-serif font-bold text-white hidden md:block">Összehasonlító Elemzés ({readings.length})</h2>
                </div>

                <div className="flex-1 glass-panel rounded-2xl border border-white/10 overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/10">
                    {readings.map((reading, index) => {
                        const spread = allSpreads.find(s => s.id === reading.spreadId);
                        return (
                            <div key={reading.id} className="flex-1 flex flex-col h-full overflow-hidden min-w-[300px]">
                                {/* Header */}
                                <div className="bg-black/30 p-4 border-b border-white/10 text-center">
                                    <div className="text-gold-400 font-bold text-lg">{new Date(reading.date).toLocaleDateString()}</div>
                                    <div className="text-xs opacity-50 uppercase tracking-widest">{spread?.name || 'Ismeretlen'}</div>
                                    <div className="italic text-white/80 mt-2 text-sm line-clamp-2" title={reading.question}>"{reading.question || 'Nincs kérdés'}"</div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                                    {/* Stats */}
                                    <div className="glass-panel p-3 rounded-xl flex justify-between text-xs mb-4">
                                        <div>
                                            <span className="opacity-50 block">Hangulat</span>
                                            <span>{reading.mood || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="opacity-50 block">Hold</span>
                                            <span>{reading.astrology?.moonPhase || '-'}</span>
                                        </div>
                                    </div>

                                    {/* Cards */}
                                    {reading.cards.map((c, idx) => {
                                        const card = FULL_DECK.find(d => d.id === c.cardId);
                                        const pos = spread?.positions.find(p => p.id === c.positionId);
                                        if (!card) return null;

                                        return (
                                            <div key={idx} className="bg-white/5 border border-white/5 p-3 rounded-lg flex gap-3 items-center">
                                                <div className="w-12 h-16 flex-shrink-0">
                                                    <CardImage cardId={card.id} className={`w-full h-full object-cover rounded ${c.isReversed ? 'rotate-180' : ''}`} />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-gold-500 uppercase font-bold">{pos?.name || `#${c.positionId}`}</div>
                                                    <div className="font-bold text-white text-sm">{card.name}</div>
                                                    {c.isReversed && <span className="text-[9px] text-red-300 bg-red-900/30 px-1 rounded">Fordított</span>}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Notes */}
                                    {reading.notes && (
                                        <div className="bg-indigo-900/20 p-4 rounded-xl border border-indigo-500/20 mt-4">
                                            <div className="text-[10px] uppercase font-bold opacity-50 mb-2">Jegyzetek</div>
                                            <p className="text-sm italic text-gray-300 whitespace-pre-wrap line-clamp-6 hover:line-clamp-none transition-all">{reading.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // --- MODE 2: CARD DECK COMPARISON ---
    if (cardIdToCompare) {
        const card = FULL_DECK.find(c => c.id === cardIdToCompare);
        if (!card) return null;

        const toggleDeck = (deckId: string) => {
            if (selectedDecks.includes(deckId)) {
                setSelectedDecks(prev => prev.filter(id => id !== deckId));
            } else {
                if (selectedDecks.length < 4) {
                    setSelectedDecks(prev => [...prev, deckId]);
                }
            }
        };

        return (
            <div className="animate-fade-in max-w-6xl mx-auto pb-20">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={onBack} className="flex items-center gap-2 font-bold text-white/60 hover:text-gold-400">
                        &larr; Vissza
                    </button>
                    <h2 className="text-2xl font-serif font-bold text-white">Pakli Összehasonlító: {card.name}</h2>
                </div>

                <div className="mb-8 overflow-x-auto pb-4">
                    <div className="flex gap-2">
                        {availableDecks.map(d => (
                            <button
                                key={d.id}
                                onClick={() => toggleDeck(d.id)}
                                className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors whitespace-nowrap
                                    ${selectedDecks.includes(d.id)
                                        ? 'bg-gold-500 text-black border-gold-500'
                                        : 'bg-white/5 text-gray-400 border-white/20 hover:text-white'}
                                `}
                            >
                                {d.name}
                            </button>
                        ))}
                    </div>
                    <div className="text-xs text-gray-500 mt-2 ml-1">Válassz ki maximum 4 paklit az összehasonlításhoz.</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {selectedDecks.map(deckId => {
                        const deckMeta = availableDecks.find(d => d.id === deckId);
                        if (!deckMeta) return null;

                        // We need to construct URL manually because CardImage uses context's active deck or props.
                        // Ideally CardImage should accept deckMeta object.
                        // Checking CardImage implementation... usually it takes `deck` prop which is DeckMeta.

                        return (
                            <div key={deckId} className="glass-panel p-4 rounded-xl flex flex-col items-center">
                                <div className="text-sm font-bold text-gold-400 mb-4">{deckMeta.name}</div>
                                <div className="w-full aspect-[2/3] rounded-lg overflow-hidden shadow-2xl relative">
                                    {/* Using CardImage with explicit deck prop */}
                                    <img
                                        src={DeckService.getCardImageUrl(card.id, deckMeta)}
                                        className="w-full h-full object-cover transition-transform hover:scale-105"
                                        alt={`${card.name} in ${deckMeta.name}`}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return null;
};
