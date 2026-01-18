
import { Quest, User, UserQuestProgress, Reading } from '../types';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { FULL_DECK } from '../constants';

export const DAILY_QUESTS: Quest[] = [
    {
        id: 'daily_reading',
        title: 'Napi Húzás',
        description: 'Végezz el egy napi kártyahúzást.',
        rewardXP: 50,
        type: 'daily',
        target: 1,
        conditionType: 'reading_count',
        conditionDetail: 'any',
        icon: '🎴'
    },
    {
        id: 'daily_morning_reading',
        title: 'Reggeli Rituálé',
        description: 'Húzz egy kártyát reggel 6 és 9 óra között.',
        rewardXP: 100,
        type: 'daily',
        target: 1,
        conditionType: 'reading_count',
        conditionDetail: 'morning',
        icon: '🌅'
    },
    {
        id: 'daily_lesson',
        title: 'Napi Tanulás',
        description: 'Olvass el egy leckét vagy a kártyák jelentését.',
        rewardXP: 30,
        type: 'daily',
        target: 1,
        conditionType: 'lesson_read',
        icon: '📚'
    }
];

export const WEEKLY_QUESTS: Quest[] = [
    {
        id: 'weekly_3_readings',
        title: 'Heti Rendszeresség',
        description: 'Végezz el legalább 3 húzást ezen a héten.',
        rewardXP: 150,
        type: 'weekly',
        target: 3,
        conditionType: 'reading_count',
        conditionDetail: 'any',
        icon: '🗓️'
    },
    {
        id: 'weekly_major_arcana',
        title: 'Sors Követő',
        description: 'Húzz legalább 5 Nagy Árkánum kártyát a héten.',
        rewardXP: 200,
        type: 'weekly',
        target: 5,
        conditionType: 'card_draw',
        conditionDetail: 'Major',
        filterCardType: 'major', // Added for consistency with new logic
        icon: '⚡'
    }
];

const checkQuestCondition = (quest: Quest, reading: Reading): number => {
    // 1. Time Filters
    if (quest.timeUnit) {
        const date = new Date(reading.date);

        if (quest.timeUnit === 'hour' && quest.timeRangeStart) {
            const hour = date.getHours();
            // Basic parsing "14:00" or just "14"
            const targetHour = parseInt(quest.timeRangeStart.split(':')[0]);
            if (!isNaN(targetHour) && hour !== targetHour) return 0;
        }

        if (quest.timeUnit === 'day' && quest.timeRangeStart) {
            const days = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];
            if (days[date.getDay()] !== quest.timeRangeStart) return 0;
        }

        if (quest.timeUnit === 'month' && quest.timeRangeStart) {
             const months = ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"];
             if (months[date.getMonth()] !== quest.timeRangeStart) return 0;
        }

        if (quest.timeUnit === 'moonphase' && quest.timeRangeStart) {
            if (reading.astrology?.moonPhase !== quest.timeRangeStart) return 0;
        }

        // Sabbat check omitted for simplicity, would require date range logic
    }

    // 2. Zodiac Filter
    if (quest.filterZodiac) {
        if (reading.astrology?.sunSign !== quest.filterZodiac) return 0;
    }

    // 3. Spread Filter
    if (quest.targetSpreadId || quest.conditionType === 'specific_spread') {
        if (quest.targetSpreadId && reading.spreadId !== quest.targetSpreadId) return 0;
        // If type is specific_spread and ID matches (or is not set?), return 1.
        // If ID is set, we checked it. If not set, maybe any spread matches? Assume ID is required.
        if (quest.conditionType === 'specific_spread') return 1;
    }

    // 4. Card Draw Logic
    if (quest.conditionType === 'card_draw') {
        let count = 0;
        reading.cards.forEach(drawn => {
            const card = FULL_DECK.find(c => c.id === drawn.cardId);
            if (!card) return;

            let match = true;
            // Legacy support for conditionDetail
            if (quest.conditionDetail === 'Major' && card.arcana !== 'Major') match = false;

            // New Filters
            if (quest.filterCardType === 'major' && card.arcana !== 'Major') match = false;
            if (quest.filterCardType === 'minor' && card.arcana !== 'Minor') match = false;
            if (quest.filterCardType === 'suit' && card.suit !== quest.filterSuit) match = false;

            if (quest.filterCardType === 'specific' && quest.filterCardIds && quest.filterCardIds.length > 0) {
                if (!quest.filterCardIds.includes(card.id)) match = false;
            }

            if (match) count++;
        });
        return count;
    }

    // Legacy Reading Count Logic
    if (quest.conditionType === 'reading_count') {
        if (quest.conditionDetail === 'morning') {
            const hour = new Date(reading.date).getHours();
            if (hour < 6 || hour > 9) return 0;
        }
        return 1;
    }

    // Default match for other types
    return 1;
};

export const QuestService = {

    createQuest: async (quest: Quest): Promise<string | null> => {
        if (!db) return null;
        try {
            const docRef = await addDoc(collection(db, 'quests'), {
                ...quest,
                createdAt: new Date().toISOString()
            });
            return docRef.id;
        } catch (e) {
            console.error("Error creating quest:", e);
            return null;
        }
    },

    getCommunityQuests: async (): Promise<Quest[]> => {
        if (!db) return [];
        try {
            const q = query(collection(db, 'quests'), where('isPublic', '==', true));
            const snap = await getDocs(q);
            const quests = snap.docs.map(d => ({ id: d.id, ...d.data() } as Quest));
            return quests.sort((a, b) => {
                const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return db - da;
            });
        } catch (e) {
            console.error("Error fetching quests:", e);
            return [];
        }
    },

    checkAndRefreshQuests: (user: User): User => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        let currentQuests = [...(user.activeQuests || [])];
        let hasChanges = false;

        // 1. Check Dailies
        const activeDaily = currentQuests.find(q => q.questId.startsWith('daily') && q.expiresAt?.startsWith(todayStr));
        if (!activeDaily) {
            const randomDaily = DAILY_QUESTS[Math.floor(Math.random() * DAILY_QUESTS.length)];
            const newProgress: UserQuestProgress = {
                questId: randomDaily.id,
                progress: 0,
                isCompleted: false,
                claimed: false,
                expiresAt: todayStr
            };
            currentQuests = currentQuests.filter(q => !q.questId.startsWith('daily'));
            currentQuests.push(newProgress);
            hasChanges = true;
        }

        // 2. Check Weeklies
        const activeWeekly = currentQuests.find(q => q.questId.startsWith('weekly'));
        if (!activeWeekly || (activeWeekly.expiresAt && new Date(activeWeekly.expiresAt) < now)) {
            const nextWeek = new Date();
            nextWeek.setDate(now.getDate() + (7 - now.getDay() + 1));
            const randomWeekly = WEEKLY_QUESTS[Math.floor(Math.random() * WEEKLY_QUESTS.length)];
            const newProgress: UserQuestProgress = {
                questId: randomWeekly.id,
                progress: 0,
                isCompleted: false,
                claimed: false,
                expiresAt: nextWeek.toISOString().split('T')[0]
            };
            currentQuests = currentQuests.filter(q => !q.questId.startsWith('weekly'));
            currentQuests.push(newProgress);
            hasChanges = true;
        }

        return hasChanges ? { ...user, activeQuests: currentQuests } : user;
    },

    processAction: (user: User, actionType: 'reading' | 'lesson', data?: any): { updatedUser: User, completedQuests: string[] } | null => {
        if (!user.activeQuests) return null;

        let userQuests = [...user.activeQuests];
        let changed = false;
        let completedIds: string[] = [];

        // Community Quests need to be fetched or stored in state?
        // Currently we only check against static + active quests.
        // If the user has a community quest active, we need its definition.
        // Assuming 'data' (Reading) contains enough info.
        // BUT: We don't have the Quest Definition for community quests here unless we fetch them or they are passed.
        // For this implementation, we assume the caller (UI) handles loading or the quest definition is cached/stored.
        // CRITICAL: We need the quest definition to check conditions.
        // Workaround: We only check static quests here OR we rely on 'user.activeQuests' having a copy of definition? No, it only has ID.
        // Real solution: Fetch quest definition from Firestore if ID starts with 'cq_'.
        // BUT processAction is synchronous-ish in current usage.
        // We will skip fetching for now and assume only Static quests work fully,
        // OR we pass the definitions if available.

        userQuests = userQuests.map(uq => {
            if (uq.isCompleted) return uq;

            // Find definition
            let questDef = [...DAILY_QUESTS, ...WEEKLY_QUESTS].find(q => q.id === uq.questId);

            // If not found (Community Quest), we can't check it without fetching.
            // In a real app, we'd have a QuestContext or cache.
            // For now, we skip community quests in this sync check to avoid breaking.
            if (!questDef) return uq;

            let increment = 0;
            if (actionType === 'reading' && data) {
                 increment = checkQuestCondition(questDef, data as Reading);
            } else if (actionType === 'lesson' && questDef.conditionType === 'lesson_read') {
                 increment = 1;
            }

            if (increment > 0) {
                const newProgress = uq.progress + increment;
                changed = true;
                if (newProgress >= questDef.target) {
                    return { ...uq, progress: newProgress, isCompleted: true };
                }
                return { ...uq, progress: newProgress };
            }
            return uq;
        });

        // Identify newly completed
        userQuests.forEach(uq => {
            const old = user.activeQuests?.find(oq => oq.questId === uq.questId);
            if (uq.isCompleted && (!old || !old.isCompleted)) {
                completedIds.push(uq.questId);
            }
        });

        if (changed) {
            return { updatedUser: { ...user, activeQuests: userQuests }, completedQuests: completedIds };
        }
        return null;
    }
};
