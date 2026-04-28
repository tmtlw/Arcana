
import { useMemo } from 'react';
import { Reading, DrawnCard, Card } from '../types';
import { FULL_DECK } from '../constants/deckConstants';
import { MOODS } from '../constants/ui';

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

    // --- NEW METRICS ---
    reversedRatio: number; // 0-100
    majorProgress: number; // 0-22
    cardPairs: { ids: string[]; count: number }[];
    keywords: { text: string; value: number }[];
    elementTrends: { month: string; Tűz: number; Víz: number; Levegő: number; Föld: number }[];
    moodCorrelations: { moodId: string; cardId: string; count: number }[];
    weeklyInsights: { day: string; theme: string }[];
    personalYear: number;
    spiritualChallenge: string;
    planetHourStats: Record<string, number>;
}

export const useAnalytics = (readings: Reading[], userId?: string, birthDate?: string) => {
    const stats = useMemo(() => {
        const filteredReadings = userId ? readings.filter(r => r.userId === userId) : readings;
        const sortedReadings = [...filteredReadings].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const totalReadings = sortedReadings.length;
        const allDrawnCards = sortedReadings.flatMap(r => r.cards);
        const totalCards = allDrawnCards.length;

        // 1. CARD FREQUENCY & DISCOVERY
        const cardCounts: Record<string, number> = {};
        let reversedCount = 0;
        const discoveredMajor = new Set<string>();
        const keywordMap: Record<string, number> = {};

        allDrawnCards.forEach(dc => {
            cardCounts[dc.cardId] = (cardCounts[dc.cardId] || 0) + 1;
            if (dc.isReversed) reversedCount++;
            const card = FULL_DECK.find(c => c.id === dc.cardId);
            if (card) {
                if (card.arcana === 'Major') discoveredMajor.add(card.id);
                card.keywords.forEach(kw => { keywordMap[kw] = (keywordMap[kw] || 0) + 1; });
            }
        });

        const sortedCards = Object.entries(cardCounts)
            .sort(([,a], [,b]) => b - a)
            .map(([id, count]) => ({ card: FULL_DECK.find(c => c.id === id), count }));

        // 2. SUITS & ELEMENTS
        const suits = { 'Major': 0, 'Botok': 0, 'Kelyhek': 0, 'Kardok': 0, 'Érmék': 0 };
        const elements = { 'Tűz': 0, 'Víz': 0, 'Levegő': 0, 'Föld': 0 };

        allDrawnCards.forEach(dc => {
            const card = FULL_DECK.find(c => c.id === dc.cardId);
            if (card) {
                if (card.arcana === 'Major') suits.Major++;
                else if (card.suit) suits[card.suit as keyof typeof suits]++;
                if (card.element) elements[card.element as keyof typeof elements]++;
            }
        });

        // 3. CHRONOTYPE & WEEKLY
        const hours = new Array(24).fill(0);
        const weekDays = new Array(7).fill(0);
        sortedReadings.forEach(r => {
            const d = new Date(r.date);
            hours[d.getHours()]++;
            const dayIdx = d.getDay();
            weekDays[dayIdx === 0 ? 6 : dayIdx - 1]++;
        });
        const busiestHour = hours.indexOf(Math.max(...hours));
        let timeLabel = "Éjszakai Bagoly 🦉";
        if (busiestHour >= 5 && busiestHour < 12) timeLabel = "Korai Madár 🐦";
        else if (busiestHour >= 12 && busiestHour < 18) timeLabel = "Nappali Vándor ☀️";
        else if (busiestHour >= 18 && busiestHour < 22) timeLabel = "Esti Gondolkodó 🌙";

        const dayNames = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];
        const weeklyInsights = weekDays.map((val, i) => {
            let theme = "Csendes nap";
            if (val > 0) {
                // Heuristic: what elements are common on this weekday?
                const dayReadings = sortedReadings.filter(r => {
                    const d = new Date(r.date).getDay();
                    return (d === 0 ? 6 : d - 1) === i;
                });
                const dayElements: Record<string, number> = { 'Tűz': 0, 'Víz': 0, 'Levegő': 0, 'Föld': 0 };
                dayReadings.forEach(dr => dr.cards.forEach(c => {
                    const card = FULL_DECK.find(x => x.id === c.cardId);
                    if (card?.element) dayElements[card.element]++;
                }));
                const topEl = Object.entries(dayElements).sort((a,b) => b[1] - a[1])[0];
                if (topEl && topEl[1] > 0) {
                    theme = topEl[0] === 'Víz' ? "Érzelmi mélység" : topEl[0] === 'Tűz' ? "Aktivitás és tűz" : topEl[0] === 'Levegő' ? "Szellemi munka" : "Stabilitás napja";
                }
            }
            return { day: dayNames[i], theme };
        });

        // 4. MOON
        const moonPhases: Record<string, number> = {};
        sortedReadings.forEach(r => { if (r.astrology?.moonPhase) moonPhases[r.astrology.moonPhase] = (moonPhases[r.astrology.moonPhase] || 0) + 1; });
        const favMoonArr = Object.entries(moonPhases).sort((a,b) => b[1] - a[1]);
        const favMoon = favMoonArr.length > 0 ? { name: favMoonArr[0][0], count: favMoonArr[0][1] } : null;

        // 5. STREAK
        let currentStreak = 0, longestStreak = 0, tempStreak = 0, lastDate: string | null = null;
        const uniqueDates = Array.from(new Set(sortedReadings.map(r => new Date(r.date).toDateString())));
        uniqueDates.forEach((dateStr, idx) => {
            if (idx === 0) tempStreak = 1;
            else {
                const diffDays = Math.ceil(Math.abs(new Date(dateStr).getTime() - new Date(uniqueDates[idx-1]).getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) tempStreak++;
                else { if (tempStreak > longestStreak) longestStreak = tempStreak; tempStreak = 1; }
            }
            lastDate = dateStr;
        });
        if (tempStreak > longestStreak) longestStreak = tempStreak;
        if (lastDate === new Date().toDateString() || lastDate === new Date(Date.now() - 86400000).toDateString()) currentStreak = tempStreak;

        // 6. PAIRS
        const pairCounts: Record<string, number> = {};
        sortedReadings.forEach(r => {
            if (r.cards.length < 2) return;
            const ids = r.cards.map(c => c.cardId).sort();
            for (let i = 0; i < ids.length; i++) {
                for (let j = i + 1; j < ids.length; j++) {
                    const key = `${ids[i]}|${ids[j]}`;
                    pairCounts[key] = (pairCounts[key] || 0) + 1;
                }
            }
        });
        const cardPairs = Object.entries(pairCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([key, count]) => ({ ids: key.split('|'), count }));

        // 7. MOOD CORRELATION
        const moodCardMap: Record<string, Record<string, number>> = {};
        sortedReadings.forEach(r => {
            if (!r.mood) return;
            if (!moodCardMap[r.mood]) moodCardMap[r.mood] = {};
            r.cards.forEach(c => {
                moodCardMap[r.mood][c.cardId] = (moodCardMap[r.mood][c.cardId] || 0) + 1;
            });
        });
        const moodCorrelations = Object.entries(moodCardMap).flatMap(([mId, counts]) => {
            const topCard = Object.entries(counts).sort((a,b) => b[1] - a[1])[0];
            return topCard ? [{ moodId: mId, cardId: topCard[0], count: topCard[1] }] : [];
        });

        // 8. TRENDS
        const trendMap: Record<string, typeof elements> = {};
        sortedReadings.forEach(r => {
            const mKey = r.date.substring(0, 7);
            if (!trendMap[mKey]) trendMap[mKey] = { 'Tűz': 0, 'Víz': 0, 'Levegő': 0, 'Föld': 0 };
            r.cards.forEach(dc => {
                const card = FULL_DECK.find(c => c.id === dc.cardId);
                if (card?.element) trendMap[mKey][card.element as keyof typeof elements]++;
            });
        });
        const elementTrends = Object.entries(trendMap).map(([month, data]) => ({ month, ...data }));

        // 9. PERSONAL YEAR
        let personalYear = 0;
        if (birthDate) {
            const parts = birthDate.split('-');
            const m = parseInt(parts[1]);
            const d = parseInt(parts[2]);
            const currentYear = new Date().getFullYear();
            let sum = m + d + currentYear;
            while (sum > 9 && sum !== 11 && sum !== 22) sum = sum.toString().split('').reduce((a, b) => a + parseInt(b), 0);
            personalYear = sum;
        }

        // 10. SPIRITUAL CHALLENGE
        const minElement = Object.entries(elements).sort((a,b) => a[1] - b[1])[0];
        const spiritualChallenge = minElement[0] === 'Tűz' ? "A belső tűz és lelkesedés felélesztése." :
                             minElement[0] === 'Víz' ? "Az érzelmek szabad áramlásának engedése." :
                             minElement[0] === 'Levegő' ? "A tiszta gondolatok és kommunikáció fejlesztése." :
                             "A fizikai biztonság és stabilitás megteremtése.";

        // 11. PLANET HOUR STATS
        const planetHourStats: Record<string, number> = {};
        sortedReadings.forEach(r => {
            if (r.astrology?.planetHour) {
                planetHourStats[r.astrology.planetHour] = (planetHourStats[r.astrology.planetHour] || 0) + 1;
            }
        });

        return {
            totalReadings, totalCards, cardCounts, sortedCards, suits, elements, hours, weekDays, timeLabel, busiestHour, moonPhases, favMoon, currentStreak, longestStreak,
            activityMap: sortedReadings.reduce((acc, r) => { const k = r.date.split('T')[0]; acc[k] = (acc[k] || 0) + 1; return acc; }, {} as Record<string, number>),
            topNumber: null,
            dayNight: { day: sortedReadings.filter(r => { const h = new Date(r.date).getHours(); return h >= 6 && h < 18; }).length, night: sortedReadings.length - sortedReadings.filter(r => { const h = new Date(r.date).getHours(); return h >= 6 && h < 18; }).length },
            reversedRatio: totalCards ? Math.round((reversedCount / totalCards) * 100) : 0,
            majorProgress: discoveredMajor.size,
            cardPairs,
            keywords: Object.entries(keywordMap).map(([text, value]) => ({ text, value })).sort((a,b) => b.value - a.value).slice(0, 30),
            elementTrends,
            moodCorrelations,
            weeklyInsights,
            personalYear,
            spiritualChallenge,
            planetHourStats,
            dominantMood: MOODS.find(m => m.id === Object.entries(sortedReadings.reduce((acc, r) => { if (r.mood) acc[r.mood] = (acc[r.mood] || 0) + 1; return acc; }, {} as Record<string, number>)).sort((a,b) => b[1] - a[1])[0]?.[0])
        };
    }, [readings, userId, birthDate]);

    return stats;
};
