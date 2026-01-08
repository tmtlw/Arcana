
import React, { useMemo } from 'react';
import { Reading, Card } from '../types';
import { FULL_DECK } from '../constants';

interface HistoryHeatmapProps {
    readings: Reading[];
    onSelectReading: (reading: Reading) => void;
}

export const HistoryHeatmap = ({ readings, onSelectReading }: HistoryHeatmapProps) => {
    // Group readings by date (YYYY-MM-DD)
    const heatmapData = useMemo(() => {
        const data: Record<string, { count: number, dominantElement: string, readings: Reading[] }> = {};

        readings.forEach(r => {
            const dateKey = r.date.split('T')[0];
            if (!data[dateKey]) {
                data[dateKey] = { count: 0, dominantElement: 'mixed', readings: [] };
            }
            data[dateKey].count++;
            data[dateKey].readings.push(r);
        });

        // Calculate dominant element for each day
        Object.keys(data).forEach(date => {
            const counts: Record<string, number> = { wands: 0, cups: 0, swords: 0, pentacles: 0, major: 0 };
            data[date].readings.forEach(r => {
                r.cards.forEach(c => {
                    const card = FULL_DECK.find(d => d.id === c.cardId);
                    if (card) {
                        if (card.arcana === 'Major') counts.major++;
                        else if (card.suit === 'Botok') counts.wands++;
                        else if (card.suit === 'Kelyhek') counts.cups++;
                        else if (card.suit === 'Kardok') counts.swords++;
                        else if (card.suit === 'Érmék') counts.pentacles++;
                    }
                });
            });

            let max = 0;
            let dom = 'mixed';
            for (const [el, cnt] of Object.entries(counts)) {
                if (cnt > max) {
                    max = cnt;
                    dom = el;
                }
            }
            data[date].dominantElement = dom;
        });

        return data;
    }, [readings]);

    // Generate Calendar Grid (Last 30 days for simplicity, or full month view)
    // Let's do a simple "last 4 weeks" grid for mobile friendliness, or a github-style contribution graph logic?
    // Let's go with a simple monthly calendar view for the current month.

    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay(); // 0=Sun, 1=Mon...

    // Adjust for Monday start (Hu standard)
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const days = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const getColor = (element: string, count: number) => {
        // Base opacity on count?
        const opacity = Math.min(1, 0.4 + (count * 0.2));
        switch(element) {
            case 'wands': return `rgba(239, 68, 68, ${opacity})`; // Red
            case 'cups': return `rgba(59, 130, 246, ${opacity})`; // Blue
            case 'swords': return `rgba(234, 179, 8, ${opacity})`; // Yellow
            case 'pentacles': return `rgba(34, 197, 94, ${opacity})`; // Green
            case 'major': return `rgba(168, 85, 247, ${opacity})`; // Purple
            default: return `rgba(255, 255, 255, ${opacity * 0.5})`; // Gray/Mixed
        }
    };

    return (
        <div className="glass-panel p-6 rounded-xl animate-fade-in mb-8">
            <h3 className="text-xl font-serif font-bold text-white mb-4 flex items-center gap-2">
                📅 Havi Áttekintő <span className="text-sm opacity-50 font-sans">({today.toLocaleDateString('hu-HU', { month: 'long' })})</span>
            </h3>

            <div className="grid grid-cols-7 gap-2 mb-2">
                {['H', 'K', 'Sz', 'Cs', 'P', 'Sz', 'V'].map(d => (
                    <div key={d} className="text-center text-xs font-bold text-gray-500">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {days.map((day, idx) => {
                    if (day === null) return <div key={idx} className="aspect-square"></div>;

                    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const data = heatmapData[dateStr];

                    return (
                        <div
                            key={idx}
                            onClick={() => data && data.readings.length > 0 && onSelectReading(data.readings[0])} // Just open the first for now or handle list?
                            className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all relative group cursor-pointer
                                ${data ? 'hover:scale-110 shadow-lg' : 'bg-white/5 text-gray-600'}
                            `}
                            style={{
                                backgroundColor: data ? getColor(data.dominantElement, data.count) : undefined,
                                color: data ? 'white' : undefined
                            }}
                            title={data ? `${data.count} húzás (${data.dominantElement})` : ''}
                        >
                            {day}
                            {data && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-black rounded-full flex items-center justify-center text-[8px] border border-white/20">
                                    {data.count}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex gap-4 mt-6 text-[10px] justify-center text-gray-400">
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-500"></div> Tűz</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-blue-500"></div> Víz</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-yellow-500"></div> Levegő</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-500"></div> Föld</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-purple-500"></div> Nagy Árk.</div>
            </div>
        </div>
    );
};
