
import React, { useState } from 'react';
import { useTarot } from '../context/TarotContext';
import { NumerologyService } from '../services/numerologyService';
import { CardImage } from './CardImage';
import { t } from '../services/i18nService';
import { Card } from '../types';

export const NumerologyView = ({ onBack, embedded, onSelectCard }: { onBack: () => void, embedded?: boolean, onSelectCard: (c: Card) => void }) => {
    const { currentUser, deck, language } = useTarot();
    const [activeTab, setActiveTab] = useState<'profile' | 'name_analysis'>('profile');
    const [customName, setCustomName] = useState('');

    if (!currentUser) return null;

    const hasRealName = !!currentUser.realName;
    const hasBirthDate = !!currentUser.birthDate;

    // Profile Calculations
    const lifePathNum = NumerologyService.calculateLifePath(currentUser.birthDate || '');
    const destinyNum = NumerologyService.calculateDestiny(currentUser.realName || '');
    const soulUrgeNum = NumerologyService.calculateSoulUrge(currentUser.realName || '');
    const personalityNum = NumerologyService.calculatePersonality(currentUser.realName || '');

    // Custom Name Calculations
    const customDestinyNum = customName ? NumerologyService.calculateDestiny(customName) : 0;
    const customSoulNum = customName ? NumerologyService.calculateSoulUrge(customName) : 0;
    const customPersonalityNum = customName ? NumerologyService.calculatePersonality(customName) : 0;

    // Cards
    const lifePathCard = NumerologyService.getTarotCardForNumber(lifePathNum, deck);
    const destinyCard = NumerologyService.getTarotCardForNumber(destinyNum, deck);
    const soulCard = NumerologyService.getTarotCardForNumber(soulUrgeNum, deck);
    const personalityCard = NumerologyService.getTarotCardForNumber(personalityNum, deck);

    // Custom Cards
    const cDestinyCard = NumerologyService.getTarotCardForNumber(customDestinyNum, deck);
    const cSoulCard = NumerologyService.getTarotCardForNumber(customSoulNum, deck);
    const cPersonalityCard = NumerologyService.getTarotCardForNumber(customPersonalityNum, deck);

    const NumSection = ({ title, num, card, type }: { title: string, num: number, card?: any, type: 'lifepath'|'destiny'|'soul'|'personality' }) => (
        <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row gap-6 mb-6 hover:bg-white/5 transition-all">
            <div className="flex-shrink-0 flex flex-col items-center">
                <div className="w-20 h-20 rounded-full border-4 border-gold-500 flex items-center justify-center bg-black/40 mb-3 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                    <span className="text-4xl font-serif font-bold text-white">{num}</span>
                </div>
                <div className="text-xs uppercase font-bold text-gold-400 tracking-widest text-center">{title}</div>
            </div>
            
            <div className="flex-1">
                <p className="text-sm text-gray-300 italic mb-4 border-l-2 border-white/20 pl-3">
                    {NumerologyService.getDescriptionForType(type)}
                </p>
                {card ? (
                    <div className="flex gap-4 items-start cursor-pointer group" onClick={() => onSelectCard(card)}>
                        <div className="w-20 rounded-lg overflow-hidden shadow-lg border border-white/10 flex-shrink-0 group-hover:scale-105 transition-transform">
                            <CardImage cardId={card.id} className="w-full object-cover" />
                        </div>
                        <div>
                            <h4 className="font-serif font-bold text-white text-lg group-hover:text-gold-400 transition-colors">{card.name}</h4>
                            <p className="text-xs text-white/60 mb-2">{card.arcana} Árkánum • {card.astrology}</p>
                            <p className="text-sm text-gray-200 leading-relaxed line-clamp-3">{card.generalMeaning}</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-white/40 italic">Ehhez a számhoz nincs közvetlen Tarot megfeleltetés (Mester szám).</div>
                )}
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in max-w-4xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-6">
                {!embedded && (
                    <button onClick={onBack} className="flex items-center gap-2 font-bold text-white/60 hover:text-gold-400 transition-colors">
                        <span>&larr;</span> {t('btn.back', language)}
                    </button>
                )}

                <div className={`flex bg-black/30 p-1 rounded-lg border border-white/10 ${embedded ? 'mx-auto' : ''}`}>
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${activeTab === 'profile' ? 'bg-gold-500 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Saját Profil
                    </button>
                    <button
                        onClick={() => setActiveTab('name_analysis')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${activeTab === 'name_analysis' ? 'bg-gold-500 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Névelemző
                    </button>
                </div>
            </div>

            <h2 className="text-3xl font-serif font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-white to-gold-400">
                {activeTab === 'profile' ? 'Személyes Számmisztika' : 'Tarot Névelemző'}
            </h2>
            <p className="text-center text-white/50 mb-10 max-w-2xl mx-auto text-sm">
                {activeTab === 'profile'
                    ? 'A neved és a születési dátumod rezgései meghatározzák sorsodat.'
                    : 'Írj be bármilyen nevet, hogy felfedezd a benne rejlő energiákat és Tarot megfeleléseket.'}
            </p>

            {activeTab === 'profile' && (
                <>
                    {!hasRealName && (
                        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl mb-8 text-center animate-pulse">
                            <p className="text-red-200 font-bold mb-2">Hiányzó Adatok!</p>
                            <p className="text-sm text-red-200/70 mb-4">A pontos számításhoz szükség van a születési teljes nevedre.</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {hasBirthDate && <NumSection title="Sorsút" num={lifePathNum} card={lifePathCard} type="lifepath" />}
                        {hasRealName ? (
                            <>
                                <NumSection title="Sorsszám" num={destinyNum} card={destinyCard} type="destiny" />
                                <NumSection title="Szív Vágya" num={soulUrgeNum} card={soulCard} type="soul" />
                                <NumSection title="Személyiség" num={personalityNum} card={personalityCard} type="personality" />
                            </>
                        ) : (
                            <div className="text-center p-8 glass-panel rounded-2xl opacity-50">
                                <span className="text-4xl block mb-2">🔒</span>
                                A névalapú elemzésekhez add meg a teljes nevedet a profilodban.
                            </div>
                        )}
                    </div>
                </>
            )}

            {activeTab === 'name_analysis' && (
                <div className="animate-fade-in">
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-8 text-center">
                        <label className="block text-xs font-bold uppercase text-gold-400 mb-2">Írd be a nevet az elemzéshez</label>
                        <input
                            type="text"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            placeholder="Pl. Kovács János"
                            className="w-full max-w-md bg-black/40 border-b-2 border-gold-500/50 p-3 text-center text-xl font-serif text-white focus:outline-none focus:border-gold-500 transition-colors"
                        />
                    </div>
                    {customName ? (
                        <div className="space-y-4">
                            <NumSection title="Sorsszám" num={customDestinyNum} card={cDestinyCard} type="destiny" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <NumSection title="Szív Vágya" num={customSoulNum} card={cSoulCard} type="soul" />
                                <NumSection title="Személyiség" num={customPersonalityNum} card={cPersonalityCard} type="personality" />
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20 opacity-30">
                            <div className="text-6xl mb-4">✍️</div>
                            <p>Kezdj el gépelni egy nevet...</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
