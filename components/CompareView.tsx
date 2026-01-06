
import React from 'react';
import { Reading, Spread } from '../types';
import { useTarot } from '../context/TarotContext';
import { CardImage } from './CardImage';
import { FULL_DECK } from '../constants';

interface CompareViewProps {
    reading1: Reading;
    reading2: Reading;
    onBack: () => void;
}

export const CompareView = ({ reading1, reading2, onBack }: CompareViewProps) => {
    const { allSpreads } = useTarot();

    const renderReadingColumn = (reading: Reading) => {
        const spread = allSpreads.find(s => s.id === reading.spreadId);
        
        return (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="bg-black/30 p-4 border-b border-white/10 text-center">
                    <div className="text-gold-400 font-bold text-lg">{new Date(reading.date).toLocaleDateString()}</div>
                    <div className="text-xs opacity-50 uppercase tracking-widest">{spread?.name || 'Ismeretlen'}</div>
                    <div className="italic text-white/80 mt-2 text-sm">"{reading.question || 'Nincs kérdés'}"</div>
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
                        <div>
                            <span className="opacity-50 block">Napjegy</span>
                            <span>{reading.astrology?.sunSign || '-'}</span>
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
                            <p className="text-sm italic text-gray-300 whitespace-pre-wrap">{reading.notes}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="animate-fade-in h-[calc(100vh-100px)] flex flex-col max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-4 px-4">
                <button onClick={onBack} className="flex items-center gap-2 font-bold text-white/60 hover:text-gold-400">
                    &larr; Vissza a Naplóhoz
                </button>
                <h2 className="text-xl font-serif font-bold text-white hidden md:block">Összehasonlító Elemzés</h2>
            </div>

            <div className="flex-1 glass-panel rounded-2xl border border-white/10 overflow-hidden flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/10">
                {renderReadingColumn(reading1)}
                
                {/* Central Divider / Insight (Desktop only) */}
                <div className="hidden md:flex w-12 bg-black/40 items-center justify-center border-l border-r border-white/5 relative">
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-16 opacity-30">
                        <span>⚡</span>
                        <span>⚡</span>
                        <span>⚡</span>
                    </div>
                </div>

                {renderReadingColumn(reading2)}
            </div>
        </div>
    );
};
