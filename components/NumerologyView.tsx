
import React from 'react';
import { useTarot } from '../context/TarotContext';
import { NumerologyService } from '../services/numerologyService';
import { CardImage } from './CardImage';
import { t } from '../services/i18nService';

export const NumerologyView = ({ onBack }: { onBack: () => void }) => {
    const { currentUser, deck, language } = useTarot();

    if (!currentUser) return null;

    const hasRealName = !!currentUser.realName;
    const hasBirthDate = !!currentUser.birthDate;

    // Calculations
    const lifePathNum = NumerologyService.calculateLifePath(currentUser.birthDate || '');
    const destinyNum = NumerologyService.calculateDestiny(currentUser.realName || '');
    const soulUrgeNum = NumerologyService.calculateSoulUrge(currentUser.realName || '');
    const personalityNum = NumerologyService.calculatePersonality(currentUser.realName || '');

    // Cards
    const lifePathCard = NumerologyService.getTarotCardForNumber(lifePathNum, deck);
    const destinyCard = NumerologyService.getTarotCardForNumber(destinyNum, deck);
    const soulCard = NumerologyService.getTarotCardForNumber(soulUrgeNum, deck);
    const personalityCard = NumerologyService.getTarotCardForNumber(personalityNum, deck);

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
                    <div className="flex gap-4 items-start">
                        <div className="w-20 rounded-lg overflow-hidden shadow-lg border border-white/10 flex-shrink-0">
                            <CardImage cardId={card.id} className="w-full object-cover" />
                        </div>
                        <div>
                            <h4 className="font-serif font-bold text-white text-lg">{card.name}</h4>
                            <p className="text-xs text-white/60 mb-2">{card.arcana} Árkánum • {card.astrology}</p>
                            <p className="text-sm text-gray-200 leading-relaxed">{card.generalMeaning}</p>
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
            <button onClick={onBack} className="mb-6 flex items-center gap-2 font-bold text-white/60 hover:text-gold-400 transition-colors">
                <span>&larr;</span> {t('btn.back', language)}
            </button>

            <h2 className="text-3xl font-serif font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-white to-gold-400">
                Pitagoraszi Számmisztika
            </h2>
            <p className="text-center text-white/50 mb-10 max-w-2xl mx-auto">
                A neved és a születési dátumod rezgései meghatározzák sorsodat. Ismerd meg a számaid mögött rejlő Tarot archetípusokat.
            </p>

            {!hasRealName && (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl mb-8 text-center animate-pulse">
                    <p className="text-red-200 font-bold mb-2">Hiányzó Adatok!</p>
                    <p className="text-sm text-red-200/70 mb-4">A pontos számításhoz szükség van a születési teljes nevedre.</p>
                    <button onClick={() => alert("Kérlek menj a Profil -> Beállítások menübe és add meg a 'Valódi Neved'.")} className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-sm font-bold transition-colors">
                        Beállítások megnyitása
                    </button>
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
                        A névalapú elemzésekhez (Sorsszám, Szív Vágya, Személyiség) add meg a teljes nevedet a profilodban.
                    </div>
                )}
            </div>
        </div>
    );
};
