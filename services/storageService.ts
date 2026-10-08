
import { Reading, User, Spread, Card, QuizResult, DeckMeta, Lesson } from '../types';
import { store, Doc, Query } from './data';
import { CommunityService } from './communityService';
import { dbService } from './dbService';

const KEYS = {
    USERS: 'tarot_users',
    READINGS: 'tarot_readings',
    CUSTOM_SPREADS: 'tarot_custom_spreads',
    CUSTOM_CARDS: 'tarot_custom_cards',
    QUIZ_RESULTS: 'tarot_quiz_results',
    CUSTOM_DECKS: 'tarot_custom_local_decks',
    CUSTOM_LESSONS: 'tarot_custom_lessons' // New key
};

// Helper to safely get docs without crashing on permission errors
const safeList = async <T = any>(collection: string[], query?: Query): Promise<Doc<T>[]> => {
    try {
        return await store.list<T>(collection, query);
    } catch (e: any) {
        return [];
    }
};

export const StorageService = {
    // --- Local Storage Methods (Legacy/Backup use only) ---
    // User requested "absolutely nothing" saved locally.
    // We clear localStorage on each load to be safe.
    clearLocalCache: () => {
        const keysToKeep = ['tarot_guest_active', 'tarot_guest_start']; // Keep session-critical or explicitly requested keys
        Object.keys(localStorage).forEach(key => {
            if (!keysToKeep.includes(key)) {
                localStorage.removeItem(key);
            }
        });
    },

    saveUsers: (users: User[]) => {},
    getUsers: (): User[] => [],
    
    saveReadings: (readings: Reading[]) => {},
    getReadings: (): Reading[] => [],
    
    saveCustomSpreads: (spreads: Spread[]) => {},
    getCustomSpreads: (): Spread[] => [],

    saveCustomCards: (cards: Record<string, Partial<Card>>) => {},
    getCustomCards: (): Record<string, Partial<Card>> => ({}),

    saveQuizResults: (results: QuizResult[]) => {},
    getQuizResults: (): QuizResult[] => [],

    saveCustomLessons: (lessons: Lesson[]) => {},
    getCustomLessons: (): Lesson[] => [],

    exportData: async (userId?: string) => {
        if (!userId || !store.available) return;
        try {
            const profile = await StorageService.loadFullUserProfile(userId);
            const data = {
                ...profile,
                exportedAt: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `arkanam_backup_${new Date().toISOString().slice(0,10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Export failed", e);
        }
    },

    importData: async (file: File, userId?: string): Promise<boolean> => {
        if (!userId || !store.available) return false;
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            // 1. User Profile
            if (data.user) {
                await StorageService.saveUserProfileToCloud({ ...data.user, id: userId });
            }

            // 2. Collections (Batching for performance)
            const writes: Array<{ path: string[]; value: any }> = [];
            const add = (collectionName: string, id: string, value: any) =>
                writes.push({ path: ['users', userId, collectionName, id], value });

            (data.readings || []).forEach((r: any) => add('readings', r.id, r));
            (data.customSpreads || []).forEach((s: any) => add('customSpreads', s.id, s));
            Object.entries(data.customCards || {}).forEach(([id, c]) => add('customCards', id, c));
            (data.quizResults || []).forEach((q: any) => add('quizResults', q.id, q));
            (data.customLessons || []).forEach((l: any) => add('customLessons', l.id, l));

            // Kötegekben írunk (a batch-nek mérethatára van)
            for (let i = 0; i < writes.length; i += 450) {
                const batch = store.batch();
                writes.slice(i, i + 450).forEach(w => batch.set(w.path, w.value));
                await batch.commit();
            }
            return true;
        } catch (e) {
            console.error("Import failed", e);
            return false;
        }
    },

    // --- Firestore Sync Implementation (Primary & Private) ---

    checkApiStatus: async (): Promise<boolean> => {
        return store.available;
    },

    // Save User Profile
    saveUserProfileToCloud: async (user: User) => {
        if (!store.available || !user.id || user.isAnonymous) return;
        try {
            await store.set(['users', user.id], {
                ...user,
                lastActive: new Date().toISOString()
            }, { merge: true });
        } catch (e) {
            // console.error("Firestore Error (Save Profile):", e);
        }
    },

    // Save a specific reading (Private under user)
    saveReadingToCloud: async (userId: string, reading: Reading) => {
        if (!store.available || !userId) return;
        try {
            await store.set(['users', userId, 'readings', reading.id], reading);
        } catch (e) {
            // console.error("Firestore Error (Save Reading):", e);
        }
    },

    deleteReadingFromCloud: async (userId: string, readingId: string) => {
        if (!store.available || !userId) return;
        try {
            await store.remove(['users', userId, 'readings', readingId]);
        } catch (e) {
            // console.error("Firestore Error (Delete Reading):", e);
        }
    },

    // Save custom card override (Private under user)
    saveCustomCardToCloud: async (userId: string, cardId: string, cardData: Partial<Card>) => {
        if (!store.available || !userId) return;
        try {
            await store.set(['users', userId, 'customCards', cardId], cardData, { merge: true });
        } catch (e) {
            // console.error("Firestore Error (Save Card):", e);
        }
    },

    // Reset card to default (Delete private override)
    deleteCustomCardFromCloud: async (userId: string, cardId: string) => {
        if (!store.available || !userId) return;
        try {
            await store.remove(['users', userId, 'customCards', cardId]);
        } catch (e) {
            // console.error("Firestore Error (Reset Card):", e);
        }
    },

    saveQuizResultToCloud: async (userId: string, result: QuizResult) => {
        if (!store.available || !userId) return;
        try {
            await store.set(['users', userId, 'quizResults', result.id], result);
        } catch (e) {
            // console.error("Firestore Error (Save Quiz):", e);
        }
    },

    saveCustomSpreadToCloud: async (userId: string, spread: Spread) => {
        if (!store.available || !userId) return;
        try {
            await store.set(['users', userId, 'customSpreads', spread.id], spread);
        } catch (e) {
            // console.error("Firestore Error (Save Spread):", e);
        }
    },

    deleteCustomSpreadFromCloud: async (userId: string, spreadId: string) => {
        if (!store.available || !userId) return;
        try {
            await store.remove(['users', userId, 'customSpreads', spreadId]);
        } catch (e) {
            // console.error("Firestore Error (Delete Spread):", e);
        }
    },

    // --- Private Custom Lessons Cloud Sync (New) ---
    
    saveCustomLessonToCloud: async (userId: string, lesson: Lesson) => {
        if (!store.available || !userId) return;
        try {
            await store.set(['users', userId, 'customLessons', lesson.id], lesson);
        } catch (e) {
            console.error("Firestore Error (Save Lesson):", e);
        }
    },

    deleteCustomLessonFromCloud: async (userId: string, lessonId: string) => {
        if (!store.available || !userId) return;
        try {
            await store.remove(['users', userId, 'customLessons', lessonId]);
        } catch (e) {
            console.error("Firestore Error (Delete Lesson):", e);
        }
    },

    // --- Private Custom Decks Cloud Sync ---
    
    saveUserDeckToCloud: async (userId: string, deck: DeckMeta, images: Record<string, string>) => {
        if (!store.available || !userId) return;
        try {
            // 1. Save Metadata
            await store.set(['users', userId, 'private_decks', deck.id], deck);

            // 2. Save Images (Batching to avoid quota issues with single docs if possible)
            let batch = store.batch();
            let count = 0;
            const MAX_BATCH = 450;

            for (const [cardId, base64] of Object.entries(images)) {
                batch.set(['users', userId, 'private_decks', deck.id, 'card_images', cardId], { content: base64 });
                count++;

                if (count >= MAX_BATCH) {
                    await batch.commit();
                    batch = store.batch(); // a lezárt köteget nem lehet újra használni
                    count = 0;
                }
            }
            if (count > 0) await batch.commit();

        } catch (e) {
            console.error("Firestore Error (Save Private Deck):", e);
            throw e; 
        }
    },

    deleteUserDeckFromCloud: async (userId: string, deckId: string) => {
        if (!store.available || !userId) return;
        try {
            // 1. Delete Meta
            await store.remove(['users', userId, 'private_decks', deckId]);
            // Note: Subcollections are not automatically deleted in Firestore client SDK.
        } catch (e) {
            console.error("Firestore Error (Delete Private Deck):", e);
        }
    },

    // --- CLEANUP FOR GUESTS / DELETE ACCOUNT ---
    deleteFullUserProfile: async (userId: string) => {
        if (!store.available || !userId) return;
        
        const deleteCollection = async (collectionName: string) => {
            try {
                const docs = await safeList(['users', userId, collectionName]);
                if (docs.length === 0) return;

                const batch = store.batch();
                docs.forEach(d => batch.remove(d.path));
                await batch.commit();
            } catch (e: any) {
                // Ignore permission/network errors
            }
        };

        const deletePublicDecks = async () => {
            try {
                const docs = await safeList(['public_decks'], { where: [['userId', '==', userId]] });
                if (docs.length === 0) return;
                const batch = store.batch();
                docs.forEach(d => batch.remove(d.path));
                await batch.commit();
            } catch (e) {
                console.error("Error wiping user decks:", e);
            }
        };

        try {
            // 1. Delete Public Contributions
            await CommunityService.deletePublicReadingsByUser(userId);
            await CommunityService.deleteSpreadsByUser(userId);
            await CommunityService.deleteLessonsByUser(userId); // Delete public lessons
            await deletePublicDecks(); // Inlined deck deletion

            // 2. Delete Private Subcollections
            await Promise.all([
                deleteCollection('readings'),
                deleteCollection('customSpreads'),
                deleteCollection('customCards'),
                deleteCollection('quizResults'),
                deleteCollection('private_decks'),
                deleteCollection('customLessons')
            ]);
            
            // 3. Delete the user doc
            try {
                await store.remove(['users', userId]);
            } catch(e) {}
            
        } catch (e) {
            // Global catch for safety
        }
    },

    // Load FULL Profile with robust error handling
    loadFullUserProfile: async (userId: string): Promise<{
        user: User | null,
        readings: Reading[],
        customSpreads: Spread[],
        customCards: Record<string, Partial<Card>>,
        quizResults: QuizResult[],
        privateDecks: DeckMeta[],
        customLessons: Lesson[]
    }> => {
        const emptyResult = { user: null, readings: [], customSpreads: [], customCards: {}, quizResults: [], privateDecks: [], customLessons: [] };
        if (!store.available || !userId) return emptyResult;

        try {
            let user = null;
            try {
                user = await store.get<User>(['users', userId]);
            } catch (e) {
                return emptyResult;
            }

            const readings = (await safeList<Reading>(['users', userId, 'readings'])).map(d => d.data);
            const customSpreads = (await safeList<Spread>(['users', userId, 'customSpreads'])).map(d => d.data);

            const customCards: Record<string, Partial<Card>> = {};
            (await safeList<Partial<Card>>(['users', userId, 'customCards'])).forEach(d => {
                customCards[d.id] = d.data;
            });

            const quizResults = (await safeList<QuizResult>(['users', userId, 'quizResults'])).map(d => d.data);
            const customLessons = (await safeList<Lesson>(['users', userId, 'customLessons'])).map(d => d.data);

            // Load Private Decks Metadata
            const privateDecks: DeckMeta[] = [];

            for (const d of await safeList<DeckMeta>(['users', userId, 'private_decks'])) {
                const meta = d.data;
                privateDecks.push(meta);

                // Background Sync
                try {
                    const testCard = await dbService.getImage(`deck_${meta.id}_major-0`);
                    if (!testCard) {
                        const imgs = await store.list<{ content: string }>(['users', userId, 'private_decks', meta.id, 'card_images']);
                        imgs.forEach(img => {
                            dbService.saveImage(`deck_${meta.id}_${img.id}`, img.data.content);
                        });
                    }
                } catch(e) { console.warn("Deck image sync warn", e); }
            }

            return { user, readings, customSpreads, customCards, quizResults, privateDecks, customLessons };

        } catch (e) {
            return emptyResult;
        }
    }
};
