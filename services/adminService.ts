
import { db } from './firebase';
import { collection, getDocs, deleteDoc, doc, query, limit, orderBy, collectionGroup, getDoc, setDoc, where, writeBatch } from 'firebase/firestore';
import { User, Reading, Spread, DeckMeta, Lesson } from '../types';
import { StorageService } from './storageService';

export const AdminService = {
    
    // --- LISTING FUNCTIONS (GLOBAL SCOPE) ---

    // Get all users
    getAllUsers: async (): Promise<User[]> => {
        if (!db) return [];
        try {
            const q = query(collection(db, 'users'), limit(100));
            const snap = await getDocs(q);
            const users: User[] = [];
            snap.forEach(d => users.push(d.data() as User));
            return users;
        } catch (e) {
            console.error("Admin: Error fetching users", e);
            return [];
        }
    },

    // Fetch ALL readings from EVERY user's private collection (God Mode)
    getGlobalReadings: async (): Promise<Reading[]> => {
        if (!db) return [];
        try {
            // 'readings' subcollection query across all users
            const q = query(collectionGroup(db, 'readings'), limit(100));
            const snap = await getDocs(q);
            const items: Reading[] = [];
            snap.forEach(d => items.push(d.data() as Reading));
            
            // Sort manually by date desc
            return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        } catch (e) {
            console.error("Admin: Error fetching global readings", e);
            return [];
        }
    },

    // Fetch ALL custom spreads (God Mode)
    getGlobalSpreads: async (): Promise<Spread[]> => {
        if (!db) return [];
        try {
            const q = query(collectionGroup(db, 'customSpreads'), limit(100));
            const snap = await getDocs(q);
            const items: Spread[] = [];
            snap.forEach(d => items.push(d.data() as Spread));
            return items;
        } catch (e) {
            console.error("Admin: Error fetching global spreads", e);
            return [];
        }
    },

    // Fetch ALL custom decks (God Mode)
    getGlobalDecks: async (): Promise<DeckMeta[]> => {
        if (!db) return [];
        try {
            const q = query(collectionGroup(db, 'private_decks'), limit(50));
            const snap = await getDocs(q);
            const items: DeckMeta[] = [];
            snap.forEach(d => {
                const data = d.data();
                const { images, ...meta } = data; // Exclude images to save bandwidth
                items.push(meta as DeckMeta);
            });
            return items;
        } catch (e) {
            console.error("Admin: Error fetching global decks", e);
            return [];
        }
    },

    // Fetch ALL public/system lessons
    getGlobalLessons: async (): Promise<Lesson[]> => {
        if (!db) return [];
        try {
            // Fetch from public_lessons which acts as the override source
            const q = query(collection(db, 'public_lessons'), limit(100));
            const snap = await getDocs(q);
            const items: Lesson[] = [];
            snap.forEach(d => items.push(d.data() as Lesson));
            return items;
        } catch (e) {
            console.error("Admin: Error fetching global lessons", e);
            return [];
        }
    },

    // --- MANIPULATION FUNCTIONS ---

    // Helper: Cascade Delete derived copies based on sourceId
    cascadeDeleteCopies: async (collectionName: string, sourceId: string) => {
        if (!db) return;
        console.log(`Cascade deleting copies of ${sourceId} from ${collectionName}...`);
        try {
            // Find all docs in subcollections (e.g. users/{uid}/customLessons) that match the sourceId
            const q = query(collectionGroup(db, collectionName), where('sourceId', '==', sourceId));
            const snap = await getDocs(q);
            
            if (snap.empty) return;

            const batch = writeBatch(db);
            snap.forEach(d => {
                console.log(`Deleting copy: ${d.ref.path}`);
                batch.delete(d.ref);
            });
            await batch.commit();
        } catch (e) {
            console.error("Cascade delete error:", e);
        }
    },

    // Save or Override a System Lesson
    saveSystemLesson: async (lesson: Lesson) => {
        if (!db) return;
        try {
            // Saving to public_lessons with the SAME ID as the original lesson overrides it
            await setDoc(doc(db, 'public_lessons', lesson.id), {
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
        if (!db) return;
        try {
            await deleteDoc(doc(db, 'public_lessons', lessonId));
            // Cascade: delete from users' private collections where sourceId matches
            await AdminService.cascadeDeleteCopies('customLessons', lessonId);
        } catch (e) {
            console.error("Admin: Error deleting public lesson", e);
            throw e;
        }
    },

    // Delete public deck AND all downloaded copies
    deletePublicDeck: async (deckId: string) => {
        if (!db) return;
        try {
            await deleteDoc(doc(db, 'public_decks', deckId));
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
        if (!db) return;
        try {
            await StorageService.deleteFullUserProfile(userId);
        } catch (e) {
            console.error("Admin: Error banning user", e);
            throw e;
        }
    }
};
