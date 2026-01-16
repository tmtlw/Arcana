
import { Quest, User, UserQuestProgress, Reading } from '../types';

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
        icon: '⚡'
    }
];

export const QuestService = {

    // Initialize or Refresh User Quests
    checkAndRefreshQuests: (user: User): User => {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        let currentQuests = [...(user.activeQuests || [])];
        let hasChanges = false;

        // 1. Check Dailies
        const activeDaily = currentQuests.find(q => q.questId.startsWith('daily') && q.expiresAt?.startsWith(todayStr));
        if (!activeDaily) {
            // Pick a random daily quest if none active for today
            const randomDaily = DAILY_QUESTS[Math.floor(Math.random() * DAILY_QUESTS.length)];
            const newProgress: UserQuestProgress = {
                questId: randomDaily.id,
                progress: 0,
                isCompleted: false,
                claimed: false,
                expiresAt: todayStr
            };
            // Remove old dailies
            currentQuests = currentQuests.filter(q => !q.questId.startsWith('daily'));
            currentQuests.push(newProgress);
            hasChanges = true;
        }

        // 2. Check Weeklies (Refresh on Mondays)
        // Simple logic: if no active weekly or expired, pick one
        // Ideally we check ISO week number, but checking expiry date is easier
        const activeWeekly = currentQuests.find(q => q.questId.startsWith('weekly'));
        if (!activeWeekly || (activeWeekly.expiresAt && new Date(activeWeekly.expiresAt) < now)) {
            const nextWeek = new Date();
            nextWeek.setDate(now.getDate() + (7 - now.getDay() + 1)); // Next Monday
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

    // Process Action and Update Progress
    processAction: (user: User, actionType: 'reading' | 'lesson', data?: any): { updatedUser: User, completedQuests: string[] } | null => {
        if (!user.activeQuests) return null;

        let userQuests = [...user.activeQuests];
        let changed = false;
        let completedIds: string[] = [];

        userQuests = userQuests.map(uq => {
            if (uq.isCompleted) return uq; // Already done

            const questDef = [...DAILY_QUESTS, ...WEEKLY_QUESTS].find(q => q.id === uq.questId);
            if (!questDef) return uq;

            let newProgress = uq.progress;

            // Logic for Reading Count
            if (actionType === 'reading' && questDef.conditionType === 'reading_count') {
                if (questDef.conditionDetail === 'any') {
                    newProgress++;
                } else if (questDef.conditionDetail === 'morning') {
                    const hour = new Date().getHours();
                    if (hour >= 6 && hour <= 9) newProgress++;
                }
            }

            // Logic for Card Draw (Major Arcana count)
            if (actionType === 'reading' && questDef.conditionType === 'card_draw' && data?.cards) {
                // data is Reading object
                const cards = data.cards; // drawn cards
                // We need to resolve card IDs to check Arcana. Assume deck is passed or looked up?
                // For simplicity, we assume caller passes metadata or we just count generic draws if detail matches
                // Refinement: data should have 'majorCount' pre-calculated or we pass deck context.
                // Let's assume data has { majorCount: number } for now.
                if (data.majorCount && questDef.conditionDetail === 'Major') {
                    newProgress += data.majorCount;
                }
            }

            if (newProgress !== uq.progress) {
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
