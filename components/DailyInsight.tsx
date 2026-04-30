
import React from 'react';
import { Reading, Card } from '../types';
import { FULL_DECK } from '../constants';
import { CardImage } from './CardImage';
import { useTarot } from '../context/TarotContext';

interface DailyInsightProps {
    reading: Reading;
    onSelectCard: (card: Card) => void;
}

export const DailyInsight = ({ reading, onSelectCard }: DailyInsightProps) => {
    const { readings } = useTarot();
    const cardDraw = reading.cards[0];
    const card = FULL_DECK.find(c => c.id === cardDraw.cardId);

    if (!card) return <div className="p-8 text-center opacity-50 italic">Kártyaadat nem található.</div>;

    const isMorning = new Date(reading.date).getHours() < 12;
    const dayNum = reading.astrology?.dayNumerology || 0;

    // 1. Synchronicity
    const hasSynchronicity = card.number === dayNum;

    // 4. Astrological Resonance
    const hasAstroResonance = reading.astrology && card.astrology && (
        reading.astrology.moonPhase.includes(card.astrology) ||
        reading.astrology.sunSign === card.astrology ||
        reading.astrology.moonSign === card.astrology
    );

    // 6. Recurring Guest
    const recentReadings = readings.filter(r => {
        const d = new Date(r.date);
        const diff = (new Date().getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
        return diff > 0 && diff <= 7 && r.id !== reading.id;
    });
    const appearanceCount = recentReadings.filter(r => r.cards.some(c => c.cardId === card.id)).length;

    return (
        <div className="animate-fade-in space-y-8 max-w-2xl mx-auto">
            <div className="text-center">
                <h2 className="text-4xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-white to-gold-400 mb-2">
                    Napi Útravaló
                </h2>
                <div className="h-1 w-24 bg-gold-500/30 mx-auto rounded-full"></div>
                <div className="text-[10px] text-white/30 uppercase tracking-[0.3em] mt-2">
                    {new Date(reading.date).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Hero Card */}
            <div className="glass-panel p-8 rounded-3xl border-gold-500/30 bg-black/40 text-center relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-gold-500/10 rounded-full blur-[80px] pointer-events-none"></div>

                <div
                    className={`w-40 h-60 mx-auto rounded-xl shadow-2xl overflow-hidden mb-6 border-2 border-white/10 cursor-pointer hover:scale-105 transition-transform ${cardDraw.isReversed ? 'rotate-180' : ''}`}
                    onClick={() => onSelectCard(card)}
                >
                    <CardImage cardId={card.id} className="w-full h-full object-cover" />
                </div>

                <h3 className="text-3xl font-serif font-bold text-gold-400 mb-2">{card.name}</h3>
                <p className="text-white/60 italic text-sm mb-6">"{card.shortDesc || (card.keywords.slice(0, 3).join(' • '))}"</p>

                {card.affirmation && (
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 italic text-gold-200">
                        <span className="text-2xl block mb-2">✨</span>
                        {card.affirmation}
                    </div>
                )}
            </div>

            {/* Signals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hasSynchronicity && (
                    <div className="bg-indigo-500/20 border border-indigo-500/40 p-4 rounded-2xl flex items-center gap-4 animate-pulse-slow">
                        <div className="text-3xl">🔢</div>
                        <div>
                            <div className="text-[10px] uppercase font-bold text-indigo-300">Szinkronicitás</div>
                            <div className="text-sm font-bold text-white">A kártya száma ({card.number}) egyezik a nap numerológiájával!</div>
                        </div>
                    </div>
                )}
                {hasAstroResonance && (
                    <div className="bg-purple-500/20 border border-purple-500/40 p-4 rounded-2xl flex items-center gap-4">
                        <div className="text-3xl">🌌</div>
                        <div>
                            <div className="text-[10px] uppercase font-bold text-purple-300">Asztrológiai Rezonancia</div>
                            <div className="text-sm font-bold text-white">Kiemelten hangsúlyos üzenet a mai kozmikus állás mellett.</div>
                        </div>
                    </div>
                )}
                {appearanceCount > 0 && (
                    <div className="bg-amber-500/20 border border-amber-500/40 p-4 rounded-2xl flex items-center gap-4">
                        <div className="text-3xl">🔄</div>
                        <div>
                            <div className="text-[10px] uppercase font-bold text-amber-300">Visszatérő Vendég</div>
                            <div className="text-sm font-bold text-white">Ez a lap {appearanceCount + 1}. alkalommal jelenik meg a héten!</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Daily Interpretation */}
            <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/5 to-transparent relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl select-none">
                    {isMorning ? '🌅' : '🌙'}
                </div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-4 flex items-center gap-2">
                    {isMorning ? 'Napi Fókusz' : 'Esti Reflexió'}
                </h4>
                <p className="text-gray-200 text-lg leading-relaxed font-serif italic">
                    {isMorning
                        ? (card.dailyMeaning || card.meaningUpright)
                        : (card.meaningUpright)}
                </p>
                <div className="mt-6 pt-6 border-t border-white/5 text-sm text-white/50">
                    {isMorning
                        ? "Ez az energia kísér végig a mai napodon. Figyeld a jeleket!"
                        : "Vedd számba, hol találkoztál ma ezzel a minőséggel."}
                </div>
            </div>

            {/* Challenges & Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl">
                    <h4 className="text-xs font-bold uppercase text-emerald-400 mb-3 flex items-center gap-2">🎯 Napi Mikro-Kihívás</h4>
                    <p className="text-sm text-gray-300 italic">"{card.advice || 'Figyeld ma tudatosan az események áramlását.'}"</p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
                    <h4 className="text-xs font-bold uppercase text-blue-400 mb-3 flex items-center gap-2">🧘 Elemi Hangolódás</h4>
                    <div className="text-sm text-gray-300">
                        {card.element === 'Tűz' && "Gyújts egy gyertyát vagy végezz aktív mozgást a belső tűz ébresztéséhez."}
                        {card.element === 'Víz' && "Igyál meg egy pohár tiszta vizet tudatosan, vagy vegyél egy relaxáló fürdőt."}
                        {card.element === 'Levegő' && "Szellőztess ki alaposan, és írd le a gondolataidat egy papírra."}
                        {card.element === 'Föld' && "Sétálj a természetben, vagy érints meg egy növényt a leföldeléshez."}
                        {!card.element && "Tarts ma egy rövid meditációt a kártya képével."}
                    </div>
                </div>
            </div>

            {/* Questions */}
            {card.questions && card.questions.length > 0 && (
                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                    <h4 className="text-xs font-bold uppercase text-white/40 mb-4 tracking-widest text-center">Önfeltáró Kérdések</h4>
                    <div className="space-y-3">
                        {card.questions.map((q, i) => (
                            <div key={i} className="text-sm text-gray-300 text-center italic leading-relaxed">"{q}"</div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
