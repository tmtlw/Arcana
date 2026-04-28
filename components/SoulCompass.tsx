import React, { useState, useMemo } from 'react';
import { useTarot } from '../context/TarotContext';
import { FULL_DECK, ZODIAC_INFO } from '../constants';
import { WESTERN_HOROSCOPES } from '../constants/horoscopes_western';
import { CHINESE_HOROSCOPES, getChineseZodiac } from '../constants/horoscopes_chinese';
import { CardImage } from './CardImage';
import { AstroService } from '../services/astroService';
import { AnalyticsStats } from '../services/analyticsHook';
import { Card } from '../types';

export const SoulCompass = ({ stats, onSelectCard }: { stats: AnalyticsStats, onSelectCard: (c: Card) => void }) => {
    const { currentUser, userLocation } = useTarot();
    const [zodiacModal, setZodiacModal] = useState<{ type: 'Nap'|'Hold'|'Aszcendens'|'Kínai', sign: string, detail?: any } | null>(null);

    const natalInfo = useMemo(() => {
        if (!currentUser?.birthDate) return null;
        const dateTimeString = `${currentUser.birthDate}T${currentUser.birthTime || "12:00"}:00`;
        const date = new Date(dateTimeString);
        const western = AstroService.getAstroData(date, userLocation || undefined);
        const chinese = getChineseZodiac(date.getFullYear());
        return { ...western, chinese };
    }, [currentUser, userLocation]);

    const openZodiacModal = (type: 'Nap'|'Hold'|'Aszcendens'|'Kínai', sign: string) => {
        let detail = null;
        if (type === 'Kínai') {
            detail = CHINESE_HOROSCOPES.find(c => c.name === sign);
        } else {
            detail = WESTERN_HOROSCOPES.find(h => h.name === sign);
        }
        setZodiacModal({ type, sign, detail });
    };

    if (!currentUser) return null;

    const topCard = stats.sortedCards[0]?.card;

    return (
        <div className="animate-fade-in max-w-4xl mx-auto space-y-8">
            <h2 className="text-3xl font-serif font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-white to-gold-400 mb-6">
                Lelki Iránytű
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="glass-panel p-6 rounded-2xl border border-white/5">
                        <h3 className="font-bold text-white/60 text-xs uppercase tracking-widest mb-4">Elemi Egyensúly</h3>

                        {topCard && (
                            <div className="flex items-center gap-4 mb-6 bg-black/20 p-3 rounded-xl border border-white/5 cursor-pointer hover:border-gold-500/30 transition-colors" onClick={() => onSelectCard(topCard)}>
                                <div className="w-12 h-16 rounded overflow-hidden flex-shrink-0">
                                    <CardImage cardId={topCard.id} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <div className="text-[10px] text-gold-500 uppercase font-bold">Leggyakoribb Lap</div>
                                    <div className="font-serif font-bold text-white leading-tight">{topCard.name}</div>
                                    <div className="text-xs opacity-50">{stats.sortedCards[0].count}x húzva</div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            {Object.entries(stats.elements).map(([el, val]) => (
                                <div key={el} className="flex items-center gap-2 text-xs">
                                    <div className="w-16 opacity-70">{el}</div>
                                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div className={`h-full ${el === 'Tűz' ? 'bg-red-500' : el === 'Víz' ? 'bg-blue-500' : el === 'Levegő' ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.round((val / (stats.totalCards || 1)) * 100)}%` }}></div>
                                    </div>
                                    <div className="w-8 text-right opacity-50">{Math.round((val / (stats.totalCards || 1)) * 100)}%</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-bold text-gold-400 text-xs uppercase tracking-widest pl-2">Kozmikus Identitás</h3>
                    {natalInfo ? (
                        <>
                            <div onClick={() => openZodiacModal('Nap', natalInfo.sunSign)} className="glass-panel p-4 rounded-xl border border-gold-500/20 bg-gradient-to-r from-gold-900/20 to-transparent cursor-pointer hover:border-gold-500/50 transition-all group">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="text-gold-400 font-bold text-sm">Napjegy</div>
                                    <div className="text-2xl group-hover:scale-110 transition-transform">☀️</div>
                                </div>
                                <div className="text-2xl font-serif font-bold text-white mb-1">{natalInfo.sunSign}</div>
                                <div className="text-xs text-white/50">Esszencia, Tudatosság, Cél</div>
                            </div>
                            <div onClick={() => openZodiacModal('Hold', natalInfo.moonSign)} className="glass-panel p-4 rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-900/20 to-transparent cursor-pointer hover:border-blue-500/50 transition-all group">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="text-blue-300 font-bold text-sm">Holdjegy</div>
                                    <div className="text-2xl group-hover:scale-110 transition-transform">{natalInfo.icon}</div>
                                </div>
                                <div className="text-2xl font-serif font-bold text-white mb-1">{natalInfo.moonSign}</div>
                                <div className="text-xs text-white/50">Érzelmek, Ösztön, Lélek</div>
                            </div>
                            <div onClick={() => openZodiacModal('Aszcendens', natalInfo.ascendant)} className="glass-panel p-4 rounded-xl border border-purple-500/20 bg-gradient-to-r from-purple-900/20 to-transparent cursor-pointer hover:border-purple-500/50 transition-all group">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="text-purple-400 font-bold text-sm">Aszcendens</div>
                                    <div className="text-2xl group-hover:scale-110 transition-transform">🏹</div>
                                </div>
                                <div className="text-2xl font-serif font-bold text-white mb-1">{natalInfo.ascendant}</div>
                                <div className="text-xs text-white/50">Megjelenés, Álarc, Út</div>
                            </div>
                            <div onClick={() => openZodiacModal('Kínai', natalInfo.chinese.sign)} className="glass-panel p-4 rounded-xl border border-red-500/20 bg-gradient-to-r from-red-900/20 to-transparent cursor-pointer hover:border-red-500/50 transition-all group">
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
                            <p className="text-sm">Add meg a születési adataidat a profilban!</p>
                        </div>
                    )}
                </div>
            </div>

            {zodiacModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setZodiacModal(null)}>
                    <div className="glass-panel-dark w-full max-w-2xl rounded-2xl p-6 border border-white/20 relative shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setZodiacModal(null)} className="absolute top-4 right-4 text-white/50 hover:text-white text-xl">✕</button>

                        <div className="text-center mb-6">
                            <h3 className="text-4xl font-serif font-bold text-gold-400 mb-1">{zodiacModal.sign}</h3>
                            <div className="text-xs font-bold uppercase tracking-widest text-white/40">{zodiacModal.type} Jellemzői</div>
                        </div>

                        {zodiacModal.detail ? (
                            <div className="space-y-6">
                                <p className="text-gray-200 leading-relaxed italic border-l-2 border-gold-500/50 pl-4 bg-white/5 p-4 rounded-r-xl">
                                    "{zodiacModal.detail.description}"
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-gold-500 mb-2">Jellemzők</h4>
                                        <div className="text-sm text-gray-300">
                                            {zodiacModal.detail.keyword && <div className="mb-1"><span className="text-white/40">Kulcsszó:</span> {zodiacModal.detail.keyword}</div>}
                                            {zodiacModal.detail.element && <div className="mb-1"><span className="text-white/40">Elem:</span> {zodiacModal.detail.element}</div>}
                                            {zodiacModal.detail.rulingPlanet && <div><span className="text-white/40">Uralkodó bolygó:</span> {zodiacModal.detail.rulingPlanet}</div>}
                                        </div>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-gold-500 mb-2">Szerencse</h4>
                                        <div className="text-sm text-gray-300">
                                            {zodiacModal.detail.numbers && <div className="mb-1"><span className="text-white/40">Számok:</span> {zodiacModal.detail.numbers}</div>}
                                            {zodiacModal.detail.color && <div><span className="text-white/40">Szín:</span> {zodiacModal.detail.color}</div>}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gold-500/5 border border-gold-500/20 p-5 rounded-xl text-sm italic text-gray-200 leading-relaxed">
                                    {zodiacModal.type === 'Nap' && ZODIAC_INFO[zodiacModal.sign]?.sun}
                                    {zodiacModal.type === 'Hold' && ZODIAC_INFO[zodiacModal.sign]?.moon}
                                    {zodiacModal.type === 'Aszcendens' && ZODIAC_INFO[zodiacModal.sign]?.ascendant}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10 opacity-30 italic">Részletes leírás betöltése...</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
