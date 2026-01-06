
import React, { useState, useEffect } from 'react';
import { useTarot } from '../context/TarotContext';
import { DeckService } from '../services/deckService';
import { CARD_BACKS } from '../constants';

interface CardImageProps {
    cardId: string;
    className?: string;
    style?: React.CSSProperties;
    alt?: string;
    deckOverride?: any; // Optional specific deck
    isBack?: boolean; // New prop to force showing the back
}

export const CardImage = ({ cardId, className, style, alt, deckOverride, isBack }: CardImageProps) => {
    const { activeDeck, currentUser } = useTarot();
    const [src, setSrc] = useState<string>('');
    const [loading, setLoading] = useState(true);

    const targetDeck = deckOverride || activeDeck;
    const backStyleKey = currentUser?.cardBackPreference || 'classic';
    // @ts-ignore
    const backClasses = CARD_BACKS[backStyleKey] || CARD_BACKS['classic'];

    useEffect(() => {
        if (isBack) {
            setLoading(false);
            return;
        }

        let isMounted = true;
        setLoading(true);
        
        DeckService.getCardImageAsync(cardId, targetDeck).then(url => {
            if(isMounted) {
                setSrc(url);
                setLoading(false);
            }
        }).catch(() => {
            if(isMounted) setLoading(false);
        });

        return () => { isMounted = false; };
    }, [cardId, targetDeck, isBack]);

    if (isBack) {
        return (
            <div className={`${className} ${backClasses} flex flex-col items-center justify-center shadow-inner relative overflow-hidden`} style={style}>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                <span className="text-4xl filter drop-shadow-lg z-10">🔮</span>
                {backStyleKey === 'geo' && <div className="absolute inset-0 border-4 border-emerald-500/20 m-2"></div>}
            </div>
        );
    }

    if (loading || !src) {
        return (
            <div className={`${className} bg-gray-800 animate-pulse flex items-center justify-center overflow-hidden`} style={style}>
                <span className="text-white/10 text-xs">⌛</span>
            </div>
        );
    }

    return <img src={src} className={className} style={style} alt={alt || cardId} loading="lazy" />;
};