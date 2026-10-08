
import { store } from './data';
import { User, Reading, Spread, DeckMeta, Lesson } from '../types';
import { StorageService } from './storageService';

export const AdminService = {
    
    // --- LISTING FUNCTIONS (GLOBAL SCOPE) ---

    // Get all users
    getAllUsers: async (): Promise<User[]> => {
        if (!store.available) return [];
        try {
            const docs = await store.list<User>(['users'], { limit: 100 });
            return docs.map(d => d.data);
        } catch (e) {
            console.error("Admin: Error fetching users", e);
            return [];
        }
    },

    // Fetch ALL readings from EVERY user's private collection (God Mode)
    getGlobalReadings: async (): Promise<Reading[]> => {
        if (!store.available) return [];
        try {
            // 'readings' subcollection query across all users
            const docs = await store.listGroup<Reading>('readings', { limit: 100 });
            const items: Reading[] = docs.map(d => d.data);
            
            // Sort manually by date desc
            return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        } catch (e) {
            console.error("Admin: Error fetching global readings", e);
            return [];
        }
    },

    // Fetch ALL custom spreads (God Mode)
    getGlobalSpreads: async (): Promise<Spread[]> => {
        if (!store.available) return [];
        try {
            const docs = await store.listGroup<Spread>('customSpreads', { limit: 100 });
            return docs.map(d => d.data);
        } catch (e) {
            console.error("Admin: Error fetching global spreads", e);
            return [];
        }
    },

    // Fetch ALL custom decks (God Mode)
    getGlobalDecks: async (): Promise<DeckMeta[]> => {
        if (!store.available) return [];
        try {
            const docs = await store.listGroup<any>('private_decks', { limit: 50 });
            return docs.map(d => {
                const { images, ...meta } = d.data; // Exclude images to save bandwidth
                return meta as DeckMeta;
            });
        } catch (e) {
            console.error("Admin: Error fetching global decks", e);
            return [];
        }
    },

    // Fetch ALL public/system lessons
    getGlobalLessons: async (): Promise<Lesson[]> => {
        if (!store.available) return [];
        try {
            // Fetch from public_lessons which acts as the override source
            const docs = await store.list<Lesson>(['public_lessons'], { limit: 100 });
            return docs.map(d => d.data);
        } catch (e) {
            console.error("Admin: Error fetching global lessons", e);
            return [];
        }
    },

    // --- MANIPULATION FUNCTIONS ---

    // Helper: Cascade Delete derived copies based on sourceId
    cascadeDeleteCopies: async (collectionName: string, sourceId: string) => {
        if (!store.available) return;
        console.log(`Cascade deleting copies of ${sourceId} from ${collectionName}...`);
        try {
            // Find all docs in subcollections (e.g. users/{uid}/customLessons) that match the sourceId
            const docs = await store.listGroup(collectionName, { where: [['sourceId', '==', sourceId]] });

            if (docs.length === 0) return;

            const batch = store.batch();
            docs.forEach(d => {
                console.log(`Deleting copy: ${d.path.join('/')}`);
                batch.remove(d.path);
            });
            await batch.commit();
        } catch (e) {
            console.error("Cascade delete error:", e);
        }
    },

    // Save or Override a System Lesson
    saveSystemLesson: async (lesson: Lesson) => {
        if (!store.available) return;
        try {
            // Saving to public_lessons with the SAME ID as the original lesson overrides it
            await store.set(['public_lessons', lesson.id], {
                ...lesson,
                isPublic: true // Ensure it's treated as public/system
            });
        } catch (e) {
            console.error("Admin: Error saving system lesson", e);
            throw e;
        }
    },

    deleteReading: async (userId: string, readingId: string) => {
        await StorageService.deleteReadingFromCloud(userId, readingId);
    },

    deleteSpread: async (userId: string, spreadId: string) => {
        await StorageService.deleteCustomSpreadFromCloud(userId, spreadId);
    },

    deleteLesson: async (userId: string, lessonId: string) => {
        await StorageService.deleteCustomLessonFromCloud(userId, lessonId);
    },

    // Delete from public_lessons AND all downloaded copies
    deletePublicLesson: async (lessonId: string) => {
        if (!store.available) return;
        try {
            await store.remove(['public_lessons', lessonId]);
            // Cascade: delete from users' private collections where sourceId matches
            await AdminService.cascadeDeleteCopies('customLessons', lessonId);
        } catch (e) {
            console.error("Admin: Error deleting public lesson", e);
            throw e;
        }
    },

    // Delete public deck AND all downloaded copies
    deletePublicDeck: async (deckId: string) => {
        if (!store.available) return;
        try {
            await store.remove(['public_decks', deckId]);
            // Cascade: delete from users' private collections where sourceId matches
            await AdminService.cascadeDeleteCopies('private_decks', deckId);
        } catch (e) {
            console.error("Admin: Error deleting public deck", e);
            throw e;
        }
    },

    deleteDeck: async (userId: string, deckId: string) => {
        await StorageService.deleteUserDeckFromCloud(userId, deckId);
    },

    // Ban User: Wipes entire profile and subcollections
    banUser: async (userId: string) => {
        if (!store.available) return;
        try {
            await StorageService.deleteFullUserProfile(userId);
        } catch (e) {
            console.error("Admin: Error banning user", e);
            throw e;
        }
    }
};
