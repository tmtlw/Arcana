import React, { useState, useMemo } from 'react';
import { useTarot } from '../context/TarotContext';
import { FULL_DECK, ZODIAC_INFO } from '../constants';
import { WESTERN_HOROSCOPES } from '../constants/horoscopes_western';
import { CHINESE_HOROSCOPES, getChineseZodiac } from '../constants/horoscopes_chinese';
import { CardImage } from './CardImage';
import { AstroService } from '../services/astroService';
import { ReadingAnalysis } from './ReadingAnalysis';

export const SoulCompass = () => {
    const { currentUser, readings, userLocation } = useTarot();
    const [zodiacModal, setZodiacModal] = useState<{ type: 'Nap'|'Hold'|'Aszcendens'|'Kínai', sign: string } | null>(null);

    // Filter readings for current user
    const userReadings = useMemo(() => {
        if (!currentUser) return [];
        return readings.filter(r => r.userId === currentUser.id);
    }, [readings, currentUser]);

    // Calculate Stats
    const statsData = useMemo(() => {
        if (userReadings.length === 0) return null;

        const cardCounts: Record<string, number> = {};
        const elements: Record<string, number> = { wands: 0, cups: 0, swords: 0, pentacles: 0, major: 0 };

        userReadings.forEach(r => {
            r.cards.forEach(c => {
                cardCounts[c.cardId] = (cardCounts[c.cardId] || 0) + 1;
                const cardDef = FULL_DECK.find(d => d.id === c.cardId);
                if (cardDef) {
                    if (cardDef.arcana === 'Major') elements.major++;
                    else if (cardDef.suit === 'Botok') elements.wands++;
                    else if (cardDef.suit === 'Kelyhek') elements.cups++;
                    else if (cardDef.suit === 'Kardok') elements.swords++;
                    else if (cardDef.suit === 'Érmék') elements.pentacles++;
                }
            });
        });

        let max = 0;
        let signatureId = '';
        for (const [id, count] of Object.entries(cardCounts)) {
            if (count > max) {
                max = count;
                signatureId = id;
            }
        }
        const signatureCard = signatureId ? FULL_DECK.find(d => d.id === signatureId) : null;

        const total = Object.values(elements).reduce((a,b) => a+b, 0);
        const elementPcts = {
            wands: total ? Math.round((elements.wands / total) * 100) : 0,
            cups: total ? Math.round((elements.cups / total) * 100) : 0,
            swords: total ? Math.round((elements.swords / total) * 100) : 0,
            pentacles: total ? Math.round((elements.pentacles / total) * 100) : 0,
            major: total ? Math.round((elements.major / total) * 100) : 0,
        };

        return { signatureCard, count: max, elementPcts };
    }, [userReadings]);

    // Calculate Natal Info
    const natalInfo = useMemo(() => {
        if (!currentUser?.birthDate) return null;
        const dateTimeString = `${currentUser.birthDate}T${currentUser.birthTime || "12:00"}:00`;
        const date = new Date(dateTimeString);
        const western = AstroService.getAstroData(date, userLocation || undefined);
        const chinese = getChineseZodiac(date.getFullYear());
        return { ...western, chinese };
    }, [currentUser, userLocation]);

    if (!currentUser) return null;

    return (
        <div className="animate-fade-in max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl font-serif font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-white to-gold-400 mb-6">
                Lelki Iránytű
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Stats Section */}
                <div className="space-y-6">
                    {statsData && statsData.signatureCard ? (
                        <div className="glass-panel p-6 rounded-2xl border border-white/5">
                            <h3 className="font-bold text-white/60 text-xs uppercase tracking-widest mb-4">Elemi Egyensúly</h3>

                            {/* Signature Card */}
                            <div className="flex items-center gap-4 mb-6 bg-black/20 p-3 rounded-xl border border-white/5">
                                <div className="w-12 h-16 rounded overflow-hidden flex-shrink-0">
                                    <CardImage cardId={statsData.signatureCard.id} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="text-[10px] text-gold-500 uppercase font-bold">Leggyakoribb Lap</div>
                                    <div className="font-serif font-bold text-white leading-tight">{statsData.signatureCard.name}</div>
                                    <div className="text-xs opacity-50">{statsData.count}x húzva</div>
                                </div>
                            </div>

                            {/* Element Bars */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-xs">
                                    <div className="w-16 opacity-70">Tűz</div>
                                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-red-500" style={{ width: `${statsData.elementPcts.wands}%` }}></div></div>
                                    <div className="w-8 text-right opacity-50">{statsData.elementPcts.wands}%</div>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <div className="w-16 opacity-70">Víz</div>
                                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${statsData.elementPcts.cups}%` }}></div></div>
                                    <div className="w-8 text-right opacity-50">{statsData.elementPcts.cups}%</div>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <div className="w-16 opacity-70">Levegő</div>
                                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-yellow-500" style={{ width: `${statsData.elementPcts.swords}%` }}></div></div>
                                    <div className="w-8 text-right opacity-50">{statsData.elementPcts.swords}%</div>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <div className="w-16 opacity-70">Föld</div>
                                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-green-500" style={{ width: `${statsData.elementPcts.pentacles}%` }}></div></div>
                                    <div className="w-8 text-right opacity-50">{statsData.elementPcts.pentacles}%</div>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <div className="w-16 opacity-70 text-purple-300">Nagy Árk.</div>
                                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-purple-500" style={{ width: `${statsData.elementPcts.major}%` }}></div></div>
                                    <div className="w-8 text-right opacity-50">{statsData.elementPcts.major}%</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-panel p-8 text-center opacity-50 rounded-2xl">
                            <div className="text-4xl mb-2">📊</div>
                            <p className="text-sm">Végezz el pár húzást, hogy lásd az elemi statisztikáidat!</p>
                        </div>
                    )}
                </div>

                {/* Zodiac Section */}
                <div className="space-y-4">
                    <h3 className="font-bold text-gold-400 text-xs uppercase tracking-widest pl-2">Kozmikus Identitás</h3>

                    {natalInfo ? (
                        <>
                            <div onClick={() => setZodiacModal({type: 'Nap', sign: natalInfo.sunSign})} className="glass-panel p-4 rounded-xl border border-gold-500/20 bg-gradient-to-r from-gold-900/20 to-transparent cursor-pointer hover:border-gold-500/50 transition-all group">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="text-gold-400 font-bold text-sm">Napjegy</div>
                                    <div className="text-2xl group-hover:scale-110 transition-transform">☀️</div>
                                </div>
                                <div className="text-2xl font-serif font-bold text-white mb-1">{natalInfo.sunSign}</div>
                                <div className="text-xs text-white/50">Esszencia, Tudatosság, Cél</div>
                            </div>

                            <div onClick={() => setZodiacModal({type: 'Hold', sign: natalInfo.moonSign})} className="glass-panel p-4 rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-900/20 to-transparent cursor-pointer hover:border-blue-500/50 transition-all group">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="text-blue-300 font-bold text-sm">Holdjegy</div>
                                    <div className="text-2xl group-hover:scale-110 transition-transform">{natalInfo.icon}</div>
                                </div>
                                <div className="text-2xl font-serif font-bold text-white mb-1">{natalInfo.moonSign}</div>
                                <div className="text-xs text-white/50">Érzelmek, Ösztön, Lélek</div>
                            </div>

                            <div onClick={() => setZodiacModal({type: 'Aszcendens', sign: natalInfo.ascendant})} className="glass-panel p-4 rounded-xl border border-purple-500/20 bg-gradient-to-r from-purple-900/20 to-transparent cursor-pointer hover:border-purple-500/50 transition-all group">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="text-purple-400 font-bold text-sm">Aszcendens</div>
                                    <div className="text-2xl group-hover:scale-110 transition-transform">🏹</div>
                                </div>
                                <div className="text-2xl font-serif font-bold text-white mb-1">{natalInfo.ascendant}</div>
                                <div className="text-xs text-white/50">Megjelenés, Álarc, Út</div>
                            </div>

                            <div onClick={() => setZodiacModal({type: 'Kínai', sign: natalInfo.chinese.sign})} className="glass-panel p-4 rounded-xl border border-red-500/20 bg-gradient-to-r from-red-900/20 to-transparent cursor-pointer hover:border-red-500/50 transition-all group">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="text-red-400 font-bold text-sm">Kínai Horoszkóp</div>
                                    <div className="text-2xl group-hover:scale-110 transition-transform">🏮</div>
                                </div>
                                <div className="text-2xl font-serif font-bold text-white mb-1">{natalInfo.chinese.sign}</div>
                                <div className="text-xs text-white/50">{natalInfo.chinese.element} Elem</div>
                            </div>
                        </>
                    ) : (
                        <div className="glass-panel p-8 text-center opacity-50 rounded-2xl border-dashed border-2 border-white/10">
                            <div className="text-4xl mb-2">🔭</div>
                            <p className="text-sm mb-4">Add meg a születési adataidat a profilban az asztrológiai elemzéshez!</p>
                        </div>
                    )}
                </div>
            </div>

             {/* Modal for Zodiac Details (Reused from ProfileView logic) */}
             {zodiacModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setZodiacModal(null)}>
                    <div className="glass-panel-dark w-full max-w-2xl rounded-2xl p-6 border border-white/20 relative shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setZodiacModal(null)} className="absolute top-4 right-4 text-white/50 hover:text-white text-xl z-10">✕</button>

                        {zodiacModal.type === 'Kínai' ? (
                            (() => {
                                const data = CHINESE_HOROSCOPES.find(h => h.name === zodiacModal.sign);
                                if (!data) return <div className="text-center p-10">Nincs adat a '{zodiacModal.sign}' jegyről.</div>;
                                return (
                                    <div className="text-left space-y-6">
                                        <div className="text-center">
                                            <div className="text-6xl mb-4 animate-float">🏮</div>
                                            <h3 className="text-3xl font-serif font-bold text-red-500 mb-1">{data.name}</h3>
                                            <div className="text-white/50 text-sm font-bold uppercase tracking-widest">Kínai Horoszkóp</div>
                                        </div>
                                        <div className="bg-red-900/10 border border-red-500/20 p-4 rounded-xl text-center">
                                            <p className="text-gray-200 italic leading-relaxed">"{data.description}"</p>
                                        </div>
                                        {/* Simplified content for brevity, can expand if needed */}
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="bg-white/5 p-3 rounded-lg">
                                                <div className="text-xs text-gray-500">Szerencseszámok</div>
                                                <div>{data.luckyNumbers}</div>
                                            </div>
                                            <div className="bg-white/5 p-3 rounded-lg">
                                                 <div className="text-xs text-gray-500">Elem</div>
                                                 <div>{natalInfo?.chinese.element}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()
                        ) : (
                            (() => {
                                const data = WESTERN_HOROSCOPES.find(h => h.name === zodiacModal.sign);
                                if (!data) return <div className="text-center">Betöltés...</div>;
                                return (
                                    <div className="text-left space-y-6">
                                        <div className="text-center relative">
                                            <div className="text-6xl mb-2 animate-float">{zodiacModal.type === 'Nap' ? '☀️' : zodiacModal.type === 'Hold' ? '🌕' : '🏹'}</div>
                                            <h3 className="text-4xl font-serif font-bold text-gold-400 mb-1 uppercase tracking-widest">{data.name}</h3>
                                            <div className="text-gold-200/50 text-sm font-bold uppercase tracking-widest mb-1">{data.dates}</div>
                                        </div>
                                        <div className="bg-gold-500/10 border border-gold-500/20 p-5 rounded-xl text-center shadow-lg">
                                            <div className="text-2xl font-serif text-gold-300 mb-2">"{data.keyword}"</div>
                                            <p className="text-gray-200 italic leading-relaxed text-sm">
                                                {zodiacModal.type === 'Nap' && ZODIAC_INFO[zodiacModal.sign]?.sun}
                                                {zodiacModal.type === 'Hold' && ZODIAC_INFO[zodiacModal.sign]?.moon}
                                                {zodiacModal.type === 'Aszcendens' && ZODIAC_INFO[zodiacModal.sign]?.ascendant}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })()
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
