
import React, { useEffect, useState } from 'react';
import { useTarot } from '../context/TarotContext';
import { Badge } from '../types';
import { BADGES } from '../constants';

export const AchievementPopup = () => {
    const { latestBadge, setLatestBadge } = useTarot();
    const [visible, setVisible] = useState(false);
    const [badge, setBadge] = useState<Badge | null>(null);

    useEffect(() => {
        if (latestBadge) {
            const b = BADGES.find(x => x.id === latestBadge);
            if (b) {
                setBadge(b);
                setVisible(true);
                // Hide after 5 seconds
                const t = setTimeout(() => {
                    setVisible(false);
                    setLatestBadge(null);
                }, 5000);
                return () => clearTimeout(t);
            }
        }
    }, [latestBadge]);

    if (!visible || !badge) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none">
            <div className="relative bg-black/80 backdrop-blur-xl border-2 border-gold-500 rounded-2xl p-8 flex flex-col items-center gap-4 shadow-[0_0_50px_rgba(234,179,8,0.5)] animate-bounce-in pointer-events-auto max-w-sm text-center">
                <div className="absolute -top-10 animate-float text-6xl">
                    {badge.icon}
                </div>
                <h3 className="text-gold-400 font-bold tracking-widest uppercase text-sm mt-4">Új Jelvény Megszerezve!</h3>
                <h2 className="text-2xl font-serif font-bold text-white">{badge.name}</h2>
                <p className="text-gray-300 text-sm">{badge.description}</p>
                <button
                    onClick={() => { setVisible(false); setLatestBadge(null); }}
                    className="mt-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full text-xs font-bold transition-colors"
                >
                    Bezárás
                </button>
            </div>
        </div>
    );
};
