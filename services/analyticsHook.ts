
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

    // --- BATCH 2 METRICS ---
    zodiacDominance: { name: string; count: number }[];
    diaryStats: { favorites: number; fulfilled: number; notesCount: number };
    anniversaryReadings: Reading[];
    innerPeaceIndex: number;
    totemAnimal: { name: string; icon: string; description: string };
    discoveryProgress: { total: number; discovered: number };

    // --- BATCH 3 METRICS ---
    chineseZodiac: { name: string; icon: string; description: string };
    astroTarot: { sign: string; cardId: string; cardName: string };
    milestones: { date: string; title: string; icon: string }[];
    moodTrend: 'improving' | 'stable' | 'volatile' | 'declining';
}

export const useAnalytics = (readings: Reading[], userId?: string, birthDate?: string, userSentiments?: Record<string, 'pos' | 'neg' | 'neu'>) => {
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
                const topEl = Object.entries(dayElements).sort((a,b) => b[1] - (a[1] as number))[0];
                if (topEl && (topEl[1] as number) > 0) {
                    theme = topEl[0] === 'Víz' ? "Érzelmi mélység" : topEl[0] === 'Tűz' ? "Aktivitás és tűz" : topEl[0] === 'Levegő' ? "Szellemi munka" : "Stabilitás napja";
                }
            }
            return { day: dayNames[i], theme };
        });

        // 4. MOON
        const moonPhases: Record<string, number> = {};
        sortedReadings.forEach(r => { if (r.astrology?.moonPhase) moonPhases[r.astrology.moonPhase] = (moonPhases[r.astrology.moonPhase] || 0) + 1; });
        const favMoonArr = Object.entries(moonPhases).sort((a,b) => (b[1] as number) - (a[1] as number));
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
            const topCard = Object.entries(counts).sort((a,b) => (b[1] as number) - (a[1] as number))[0];
            if (!topCard) return [];
            return [{ moodId: mId, cardId: topCard[0], count: topCard[1] as any }];
        });

        // 8. TRENDS
        const trendMap: Record<string, typeof elements> = {};
        sortedReadings.forEach(r => {
            const mKey = r.date.substring(0, 7);
            if (!trendMap[mKey]) trendMap[mKey] = { 'Tűz': 0, 'Víz': 0, 'Levegő': 0, 'Föld': 0 };
            r.cards.forEach(dc => {
                const card = FULL_DECK.find(c => c.id === dc.cardId);
                if (card?.element && (card.element in trendMap[mKey])) {
                    (trendMap[mKey] as any)[card.element]++;
                }
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

        const moodCounts = sortedReadings.reduce((acc, r) => { if (r.mood) acc[r.mood] = (acc[r.mood] || 0) + 1; return acc; }, {} as Record<string, number>);
        const topMoodEntry = Object.entries(moodCounts).sort((a,b) => b[1] - a[1])[0];

        // 11. PLANET HOUR STATS
        const planetHourStats: Record<string, number> = {};
        sortedReadings.forEach(r => {
            if (r.astrology?.planetHour) {
                planetHourStats[r.astrology.planetHour] = (planetHourStats[r.astrology.planetHour] || 0) + 1;
            }
        });

        // 12. BATCH 2: ZODIAC DOMINANCE
        const zodiacCounts: Record<string, number> = {};
        allDrawnCards.forEach(dc => {
            const card = FULL_DECK.find(c => c.id === dc.cardId);
            if (card?.astrology) {
                zodiacCounts[card.astrology] = (zodiacCounts[card.astrology] || 0) + 1;
            }
        });
        const zodiacDominance = Object.entries(zodiacCounts)
            .sort(([,a], [,b]) => (b as number) - (a as number))
            .map(([name, count]) => ({ name, count: count as number }))
            .slice(0, 5);

        // 13. BATCH 2: DIARY STATS
        const diaryStats = {
            favorites: sortedReadings.filter(r => r.isFavorite).length,
            fulfilled: sortedReadings.filter(r => r.isFulfilled).length,
            notesCount: sortedReadings.filter(r => r.notes && r.notes.trim().length > 5).length
        };

        // 14. BATCH 2: ANNIVERSARY READINGS
        const today = new Date();
        const anniversaryReadings = sortedReadings.filter(r => {
            const d = new Date(r.date);
            return d.getMonth() === today.getMonth() &&
                   d.getDate() === today.getDate() &&
                   d.getFullYear() < today.getFullYear();
        });

        // 15. BATCH 2: INNER PEACE INDEX (0-100)
        let peacePoints = 0;
        let totalWeights = 0;

        sortedReadings.slice(-10).forEach(r => {
            totalWeights += 1;
            if (r.mood === 'happy' || r.mood === 'peaceful' || r.mood === 'inspired') peacePoints += 50;
            else if (r.mood === 'neutral' || !r.mood) peacePoints += 25;

            let cardScore = 0;
            r.cards.forEach(dc => {
                const userSent = userSentiments?.[dc.cardId];
                if (userSent === 'pos') cardScore += 1;
                else if (userSent === 'neg') cardScore -= 1;
                else {
                    const card = FULL_DECK.find(c => c.id === dc.cardId);
                    if (card?.decision === 'Igen') cardScore += 1;
                    else if (card?.decision === 'Nem') cardScore -= 1;
                }
            });
            const avgCardScore = r.cards.length ? cardScore / r.cards.length : 0;
            peacePoints += (avgCardScore + 1) * 25;
        });
        const innerPeaceIndex = totalWeights ? Math.round(peacePoints / totalWeights) : 50;

        // 16. BATCH 2: TOTEM ANIMAL
        const maxElement = Object.entries(elements).sort((a,b) => (b[1] as number) - (a[1] as number))[0];
        const totemMap: Record<string, { name: string; icon: string; description: string }> = {
            'Tűz': { name: 'Főnix', icon: '🔥', description: 'Az újjászületés és a kimeríthetetlen energia jelképe.' },
            'Víz': { name: 'Delfin', icon: '🐬', description: 'Az érzelmi intelligencia és a játékos bölcsesség hordozója.' },
            'Levegő': { name: 'Sas', icon: '🦅', description: 'A tisztánlátás és a szellemi szabadság szimbóluma.' },
            'Föld': { name: 'Szarvas', icon: '🦌', description: 'A stabilitás, a nemesség és a természeti erő megtestesítője.' }
        };
        const totemAnimal = totemMap[maxElement?.[0]] || { name: 'Bagowl', icon: '🦉', description: 'A titkos tudás és a megfigyelés mestere.' };

        // 17. BATCH 3: CHINESE ZODIAC
        const getChineseZodiac = (dateStr?: string) => {
            if (!dateStr) return { name: 'Ismeretlen', icon: '❓', description: 'Nincs megadva születési dátum.' };
            const year = new Date(dateStr).getFullYear();
            const signs = [
                { name: 'Patkány', icon: '🐀', description: 'Talpraesett, sokoldalú és kedves.' },
                { name: 'Bivaly', icon: '🐂', description: 'Szorgalmas, megbízható és erős.' },
                { name: 'Tigris', icon: '🐅', description: 'Bátor, magabiztos és versengő.' },
                { name: 'Nyúl', icon: '🐇', description: 'Csendes, elegáns és felelősségteljes.' },
                { name: 'Sárkány', icon: '🐉', description: 'Magabiztos, intelligens és lelkes.' },
                { name: 'Kígyó', icon: '🐍', description: 'Intelligens, bölcs és titokzatos.' },
                { name: 'Ló', icon: '🐎', description: 'Energikus, szabad szellemű és aktív.' },
                { name: 'Kecske', icon: '🐐', description: 'Szelíd, félénk és együttérző.' },
                { name: 'Majom', icon: '🐒', description: 'Éles eszű, kíváncsi és játékos.' },
                { name: 'Kakas', icon: '🐓', description: 'Megfigyelő, szorgalmas és bátor.' },
                { name: 'Kutya', icon: '🐕', description: 'Hűséges, őszinte és óvatos.' },
                { name: 'Disznó', icon: '🐖', description: 'Együttérző, nagylelkű és szorgalmas.' }
            ];
            return signs[(year - 4) % 12];
        };

        // 18. BATCH 3: ASTRO-TAROT MAPPING
        const getAstroTarot = (dateStr?: string) => {
            if (!dateStr) return { sign: '?', cardId: '0', cardName: 'Ismeretlen' };
            const date = new Date(dateStr);
            const m = date.getMonth() + 1;
            const d = date.getDate();

            let sign = "";
            let cardId = "";
            let cardName = "";

            if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) { sign = "Kos"; cardId = "major-04"; cardName = "Az Uralkodó"; }
            else if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) { sign = "Bika"; cardId = "major-05"; cardName = "A Főpap"; }
            else if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) { sign = "Ikrek"; cardId = "major-06"; cardName = "A Szeretők"; }
            else if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) { sign = "Rák"; cardId = "major-07"; cardName = "A Diadalszekér"; }
            else if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) { sign = "Oroszlán"; cardId = "major-08"; cardName = "Az Erő"; }
            else if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) { sign = "Szűz"; cardId = "major-09"; cardName = "A Remete"; }
            else if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) { sign = "Mérleg"; cardId = "major-11"; cardName = "Az Igazságosság"; }
            else if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) { sign = "Skorpió"; cardId = "major-13"; cardName = "A Halál"; }
            else if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) { sign = "Nyilas"; cardId = "major-14"; cardName = "A Mértékletesség"; }
            else if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) { sign = "Bak"; cardId = "major-15"; cardName = "Az Ördög"; }
            else if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) { sign = "Vízöntő"; cardId = "major-17"; cardName = "A Csillag"; }
            else { sign = "Halak"; cardId = "major-18"; cardName = "A Hold"; }

            return { sign, cardId, cardName };
        };

        // 19. BATCH 3: SPIRITUAL MILESTONES
        const milestones = [];
        if (sortedReadings.length > 0) {
            milestones.push({ date: sortedReadings[0].date, title: 'Az Út Kezdete', icon: '🌱' });
            if (sortedReadings.length >= 10) milestones.push({ date: sortedReadings[9].date, title: 'Novícius Beavatás', icon: '📜' });
            if (sortedReadings.length >= 50) milestones.push({ date: sortedReadings[49].date, title: 'Fél évszázadnyi bölcsesség', icon: '🏛️' });
            if (longestStreak >= 7) milestones.push({ date: new Date().toISOString(), title: 'Heti Rutin Mestere', icon: '🔥' });

            const firstFav = sortedReadings.find(r => r.isFavorite);
            if (firstFav) milestones.push({ date: firstFav.date, title: 'Első Kedvenc Húzás', icon: '⭐' });

            const firstFulfilled = sortedReadings.find(r => r.isFulfilled);
            if (firstFulfilled) milestones.push({ date: firstFulfilled.date, title: 'Az első beteljesült jóslat', icon: '✅' });
        }

        // 20. BATCH 3: MOOD TREND
        const lastMoods = sortedReadings.slice(-5).map(r => r.mood).filter(Boolean);
        let moodTrend: 'improving' | 'stable' | 'volatile' | 'declining' = 'stable';
        if (lastMoods.length >= 3) {
            const moodValues: Record<string, number> = { 'happy': 5, 'inspired': 4, 'peaceful': 4, 'neutral': 3, 'tired': 2, 'sad': 1, 'anxious': 1 };
            const vals = lastMoods.map(m => moodValues[m!] || 3);
            const diff = vals[vals.length - 1] - vals[0];
            if (Math.abs(diff) <= 1) moodTrend = 'stable';
            else if (diff > 1) moodTrend = 'improving';
            else moodTrend = 'declining';
        }

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
            dominantMood: topMoodEntry ? MOODS.find(m => m.id === topMoodEntry[0]) : undefined,
            zodiacDominance,
            diaryStats,
            anniversaryReadings,
            innerPeaceIndex,
            totemAnimal,
            discoveryProgress: { total: 78, discovered: Object.keys(cardCounts).length },
            chineseZodiac: getChineseZodiac(birthDate),
            astroTarot: getAstroTarot(birthDate),
            milestones: milestones.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
            moodTrend
        };
    }, [readings, userId, birthDate, userSentiments]);

    return stats;
};
