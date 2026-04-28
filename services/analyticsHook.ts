
import { useMemo } from 'react';
import { Reading, DrawnCard, Card } from '../types';
import { FULL_DECK, MOODS } from '../constants';

export interface AnalyticsStats {
    totalReadings: number;
    totalCards: number;
    cardCounts: Record<string, number>;
    sortedCards: { card: Card | undefined; count: number }[];
    suits: { Major: number; Botok: number; Kelyhek: number; Kardok: number; Érmék: number };
    elements: { Tűz: number; Víz: number; Levegő: number; Föld: number };
    hours: number[];
    weekDays: number[];
    timeLabel: string;
    busiestHour: number;
    moonPhases: Record<string, number>;
    favMoon: { name: string; count: number } | null;
    currentStreak: number;
    longestStreak: number;
    dominantMood: { id: string; icon: string; label: string } | undefined;
    activityMap: Record<string, number>;
    topNumber: { num: string; count: number } | null;
    dayNight: { day: number; night: number };
}

export const useAnalytics = (readings: Reading[], userId?: string) => {
    const stats = useMemo(() => {
        const filteredReadings = userId ? readings.filter(r => r.userId === userId) : readings;

        // Sort by date ascending for streak
        const sortedReadings = [...filteredReadings].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const totalReadings = sortedReadings.length;
        const allDrawnCards = sortedReadings.flatMap(r => r.cards);
        const totalCards = allDrawnCards.length;

        // 1. CARD FREQUENCY
        const cardCounts: Record<string, number> = {};
        allDrawnCards.forEach(c => {
            cardCounts[c.cardId] = (cardCounts[c.cardId] || 0) + 1;
        });
        const sortedCards = Object.entries(cardCounts)
            .sort(([,a], [,b]) => b - a)
            .map(([id, count]) => {
                const card = FULL_DECK.find(c => c.id === id);
                return { card, count };
            });

        // 2. SUITS & ELEMENTS
        const suits = { 'Major': 0, 'Botok': 0, 'Kelyhek': 0, 'Kardok': 0, 'Érmék': 0 };
        const elements = { 'Tűz': 0, 'Víz': 0, 'Levegő': 0, 'Föld': 0 };

        allDrawnCards.forEach(dc => {
            const card = FULL_DECK.find(c => c.id === dc.cardId);
            if (card) {
                if (card.arcana === 'Major') {
                    suits.Major++;
                } else if (card.suit) {
                    suits[card.suit as keyof typeof suits]++;
                }
                if (card.element) {
                    elements[card.element as keyof typeof elements]++;
                }
            }
        });

        // 3. CHRONOTYPE
        const hours = new Array(24).fill(0);
        const weekDays = new Array(7).fill(0);
        sortedReadings.forEach(r => {
            const d = new Date(r.date);
            hours[d.getHours()]++;
            const dayIdx = d.getDay(); // 0=Sun
            const mondayBasedIdx = dayIdx === 0 ? 6 : dayIdx - 1;
            weekDays[mondayBasedIdx]++;
        });
        const busiestHour = hours.indexOf(Math.max(...hours));
        let timeLabel = "Éjszakai Bagoly 🦉";
        if (busiestHour >= 5 && busiestHour < 12) timeLabel = "Korai Madár 🐦";
        else if (busiestHour >= 12 && busiestHour < 18) timeLabel = "Nappali Vándor ☀️";
        else if (busiestHour >= 18 && busiestHour < 22) timeLabel = "Esti Gondolkodó 🌙";

        // 4. MOON PHASE
        const moonPhases: Record<string, number> = {};
        sortedReadings.forEach(r => {
            if (r.astrology?.moonPhase) {
                moonPhases[r.astrology.moonPhase] = (moonPhases[r.astrology.moonPhase] || 0) + 1;
            }
        });
        const favMoonArr = Object.entries(moonPhases).sort((a,b) => b[1] - a[1]);
        const favMoon = favMoonArr.length > 0 ? { name: favMoonArr[0][0], count: favMoonArr[0][1] } : null;

        // 5. STREAK
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        let lastDate: string | null = null;
        const uniqueDates = Array.from(new Set(sortedReadings.map(r => new Date(r.date).toDateString())));

        uniqueDates.forEach((dateStr, idx) => {
            if (idx === 0) {
                tempStreak = 1;
            } else {
                const prev = new Date(uniqueDates[idx-1]);
                const curr = new Date(dateStr);
                const diffDays = Math.ceil(Math.abs(curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) tempStreak++;
                else {
                    if (tempStreak > longestStreak) longestStreak = tempStreak;
                    tempStreak = 1;
                }
            }
            lastDate = dateStr;
        });
        if (tempStreak > longestStreak) longestStreak = tempStreak;

        const todayStr = new Date().toDateString();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();
        if (lastDate === todayStr || lastDate === yesterdayStr) currentStreak = tempStreak;

        // 6. MOOD
        const moodCounts: Record<string, number> = {};
        sortedReadings.forEach(r => {
            if (r.mood) moodCounts[r.mood] = (moodCounts[r.mood] || 0) + 1;
        });
        const domMoodId = Object.entries(moodCounts).sort((a,b) => b[1] - a[1])[0]?.[0];
        const dominantMood = MOODS.find(m => m.id === domMoodId);

        // 7. ACTIVITY MAP
        const activityMap: Record<string, number> = {};
        sortedReadings.forEach(r => {
            const dayKey = r.date.split('T')[0];
            activityMap[dayKey] = (activityMap[dayKey] || 0) + 1;
        });

        // 8. NUMEROLOGY
        const numerologyCounts: Record<number, number> = {};
        allDrawnCards.forEach(dc => {
            const card = FULL_DECK.find(c => c.id === dc.cardId);
            if (card && card.number !== undefined) {
                 numerologyCounts[card.number] = (numerologyCounts[card.number] || 0) + 1;
            }
        });
        const topNumArr = Object.entries(numerologyCounts).sort((a,b) => b[1] - a[1]);
        const topNumber = topNumArr.length > 0 ? { num: topNumArr[0][0], count: topNumArr[0][1] } : null;

        // 9. DAY vs NIGHT
        let dayCount = 0;
        let nightCount = 0;
        sortedReadings.forEach(r => {
             const h = new Date(r.date).getHours();
             if (h >= 6 && h < 18) dayCount++; else nightCount++;
        });

        return {
            totalReadings,
            totalCards,
            cardCounts,
            sortedCards,
            suits,
            elements,
            hours,
            weekDays,
            timeLabel,
            busiestHour,
            moonPhases,
            favMoon,
            currentStreak,
            longestStreak,
            dominantMood,
            activityMap,
            topNumber,
            dayNight: { day: dayCount, night: nightCount }
        };
    }, [readings, userId]);

    return stats;
};
