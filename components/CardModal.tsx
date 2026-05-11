
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
        <div className="fixed inset-0 z-[100] bg-black animate-fade-in flex flex-col overflow-hidden" onClick={onClose}>
            <div className="flex-1 overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
                <div className="p-4 md:p-12 min-h-screen">
                    <CardDetailView card={card} theme={theme} onBack={onClose} />
                </div>
            </div>

            <button
                onClick={onClose}
                className="fixed top-6 right-6 z-[110] w-12 h-12 bg-white/10 hover:bg-gold-500 text-white hover:text-black rounded-full flex items-center justify-center transition-all text-xl backdrop-blur-md border border-white/20"
                title="Bezárás"
            >
                ✕
            </button>
        </div>
    );
};
