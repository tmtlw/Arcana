
import React from 'react';
import { Card } from '../types';
import { CardDetailView } from './CardDetailView';
import { THEMES } from '../constants';
import { useTarot } from '../context/TarotContext';

interface CardModalProps {
    card: Card;
    onClose: () => void;
}

export const CardModal = ({ card, onClose }: CardModalProps) => {
    const { activeThemeKey } = useTarot();
    const theme = THEMES[activeThemeKey] || THEMES['mystic'];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-md animate-fade-in" onClick={onClose}>
            <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-white/20" onClick={e => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-[110] w-12 h-12 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-gold-500 hover:text-black transition-all text-2xl border border-white/20"
                >
                    ✕
                </button>
                <div className="p-2 md:p-4 bg-[#13131a]">
                    <CardDetailView card={card} theme={theme} onBack={onClose} />
                </div>
            </div>
        </div>
    );
};
