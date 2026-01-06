
import { Reading, User, Spread, Card, QuizResult, DeckMeta, Lesson } from '../types';
import { db } from './firebase';
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc, writeBatch, query, where } from 'firebase/firestore';
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
const safeGetDocs = async (collectionRef: any) => {
    try {
        const snap = await getDocs(collectionRef);
        return snap;
    } catch (e: any) {
        return { empty: true, docs: [], forEach: () => {} };
    }
};

export const StorageService = {
    // --- Local Storage Methods (Legacy/Backup use only) ---
    saveUsers: (users: User[]) => localStorage.setItem(KEYS.USERS, JSON.stringify(users)),
    getUsers: (): User[] => JSON.parse(localStorage.getItem(KEYS.USERS) || '[]'),
    
    // Kept for exportData functionality
    saveReadings: (readings: Reading[]) => localStorage.setItem(KEYS.READINGS, JSON.stringify(readings)),
    getReadings: (): Reading[] => JSON.parse(localStorage.getItem(KEYS.READINGS) || '[]'),
    
    saveCustomSpreads: (spreads: Spread[]) => localStorage.setItem(KEYS.CUSTOM_SPREADS, JSON.stringify(spreads)),
    getCustomSpreads: (): Spread[] => JSON.parse(localStorage.getItem(KEYS.CUSTOM_SPREADS) || '[]'),

    saveCustomCards: (cards: Record<string, Partial<Card>>) => localStorage.setItem(KEYS.CUSTOM_CARDS, JSON.stringify(cards)),
    getCustomCards: (): Record<string, Partial<Card>> => JSON.parse(localStorage.getItem(KEYS.CUSTOM_CARDS) || '{}'),

    saveQuizResults: (results: QuizResult[]) => localStorage.setItem(KEYS.QUIZ_RESULTS, JSON.stringify(results)),
    getQuizResults: (): QuizResult[] => JSON.parse(localStorage.getItem(KEYS.QUIZ_RESULTS) || '[]'),

    saveCustomLessons: (lessons: Lesson[]) => localStorage.setItem(KEYS.CUSTOM_LESSONS, JSON.stringify(lessons)), // New
    getCustomLessons: (): Lesson[] => JSON.parse(localStorage.getItem(KEYS.CUSTOM_LESSONS) || '[]'), // New

    exportData: () => {
        const data = {
            users: JSON.parse(localStorage.getItem(KEYS.USERS) || '[]'),
            readings: JSON.parse(localStorage.getItem(KEYS.READINGS) || '[]'),
            spreads: JSON.parse(localStorage.getItem(KEYS.CUSTOM_SPREADS) || '[]'),
            customCards: JSON.parse(localStorage.getItem(KEYS.CUSTOM_CARDS) || '{}'),
            quizResults: JSON.parse(localStorage.getItem(KEYS.QUIZ_RESULTS) || '[]'),
            customDecks: JSON.parse(localStorage.getItem(KEYS.CUSTOM_DECKS) || '[]'),
            customLessons: JSON.parse(localStorage.getItem(KEYS.CUSTOM_LESSONS) || '[]'), // Export lessons
            exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tarot_backup_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    },

    importData: async (file: File): Promise<boolean> => {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            if(data.users) localStorage.setItem(KEYS.USERS, JSON.stringify(data.users));
            if(data.readings) localStorage.setItem(KEYS.READINGS, JSON.stringify(data.readings));
            if(data.spreads) localStorage.setItem(KEYS.CUSTOM_SPREADS, JSON.stringify(data.spreads));
            if(data.customCards) localStorage.setItem(KEYS.CUSTOM_CARDS, JSON.stringify(data.customCards));
            if(data.quizResults) localStorage.setItem(KEYS.QUIZ_RESULTS, JSON.stringify(data.quizResults));
            if(data.customDecks) localStorage.setItem(KEYS.CUSTOM_DECKS, JSON.stringify(data.customDecks));
            if(data.customLessons) localStorage.setItem(KEYS.CUSTOM_LESSONS, JSON.stringify(data.customLessons)); // Import lessons
            return true;
        } catch (e) {
            console.error("Import failed", e);
            return false;
        }
    },

    // --- Firestore Sync Implementation (Primary & Private) ---

    checkApiStatus: async (): Promise<boolean> => {
        return !!db; 
    },

    // Save User Profile
    saveUserProfileToCloud: async (user: User) => {
        if (!db || !user.id || user.isAnonymous) return;
        try {
            await setDoc(doc(db, 'users', user.id), {
                ...user,
                lastActive: new Date().toISOString()
            }, { merge: true });
        } catch (e) {
            // console.error("Firestore Error (Save Profile):", e);
        }
    },

    // Save a specific reading (Private under user)
    saveReadingToCloud: async (userId: string, reading: Reading) => {
        if (!db || !userId) return;
        try {
            await setDoc(doc(db, 'users', userId, 'readings', reading.id), reading);
        } catch (e) {
            // console.error("Firestore Error (Save Reading):", e);
        }
    },

    deleteReadingFromCloud: async (userId: string, readingId: string) => {
        if (!db || !userId) return;
        try {
            await deleteDoc(doc(db, 'users', userId, 'readings', readingId));
        } catch (e) {
            // console.error("Firestore Error (Delete Reading):", e);
        }
    },

    // Save custom card override (Private under user)
    saveCustomCardToCloud: async (userId: string, cardId: string, cardData: Partial<Card>) => {
        if (!db || !userId) return;
        try {
            await setDoc(doc(db, 'users', userId, 'customCards', cardId), cardData, { merge: true });
        } catch (e) {
            // console.error("Firestore Error (Save Card):", e);
        }
    },

    // Reset card to default (Delete private override)
    deleteCustomCardFromCloud: async (userId: string, cardId: string) => {
        if (!db || !userId) return;
        try {
            await deleteDoc(doc(db, 'users', userId, 'customCards', cardId));
        } catch (e) {
            // console.error("Firestore Error (Reset Card):", e);
        }
    },

    saveQuizResultToCloud: async (userId: string, result: QuizResult) => {
        if (!db || !userId) return;
        try {
            await setDoc(doc(db, 'users', userId, 'quizResults', result.id), result);
        } catch (e) {
            // console.error("Firestore Error (Save Quiz):", e);
        }
    },

    saveCustomSpreadToCloud: async (userId: string, spread: Spread) => {
        if (!db || !userId) return;
        try {
            await setDoc(doc(db, 'users', userId, 'customSpreads', spread.id), spread);
        } catch (e) {
            // console.error("Firestore Error (Save Spread):", e);
        }
    },

    deleteCustomSpreadFromCloud: async (userId: string, spreadId: string) => {
        if (!db || !userId) return;
        try {
            await deleteDoc(doc(db, 'users', userId, 'customSpreads', spreadId));
        } catch (e) {
            // console.error("Firestore Error (Delete Spread):", e);
        }
    },

    // --- Private Custom Lessons Cloud Sync (New) ---
    
    saveCustomLessonToCloud: async (userId: string, lesson: Lesson) => {
        if (!db || !userId) return;
        try {
            await setDoc(doc(db, 'users', userId, 'customLessons', lesson.id), lesson);
        } catch (e) {
            console.error("Firestore Error (Save Lesson):", e);
        }
    },

    deleteCustomLessonFromCloud: async (userId: string, lessonId: string) => {
        if (!db || !userId) return;
        try {
            await deleteDoc(doc(db, 'users', userId, 'customLessons', lessonId));
        } catch (e) {
            console.error("Firestore Error (Delete Lesson):", e);
        }
    },

    // --- Private Custom Decks Cloud Sync ---
    
    saveUserDeckToCloud: async (userId: string, deck: DeckMeta, images: Record<string, string>) => {
        if (!db || !userId) return;
        try {
            // 1. Save Metadata
            await setDoc(doc(db, 'users', userId, 'private_decks', deck.id), deck);
            
            // 2. Save Images (Batching to avoid quota issues with single docs if possible)
            const batch = writeBatch(db);
            let count = 0;
            const MAX_BATCH = 450; 

            for (const [cardId, base64] of Object.entries(images)) {
                const imgRef = doc(db, 'users', userId, 'private_decks', deck.id, 'card_images', cardId);
                batch.set(imgRef, { content: base64 });
                count++;
                
                if (count >= MAX_BATCH) {
                    await batch.commit();
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
        if (!db || !userId) return;
        try {
            // 1. Delete Meta
            await deleteDoc(doc(db, 'users', userId, 'private_decks', deckId));
            // Note: Subcollections are not automatically deleted in Firestore client SDK.
        } catch (e) {
            console.error("Firestore Error (Delete Private Deck):", e);
        }
    },

    // --- CLEANUP FOR GUESTS / DELETE ACCOUNT ---
    deleteFullUserProfile: async (userId: string) => {
        if (!db || !userId) return;
        
        const deleteCollection = async (collectionName: string) => {
            try {
                const q = collection(db, 'users', userId, collectionName);
                const snapshot = await safeGetDocs(q); 
                if (snapshot.empty) return;

                const batch = writeBatch(db);
                snapshot.forEach((doc: any) => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
            } catch (e: any) {
                // Ignore permission/network errors
            }
        };

        const deletePublicDecks = async () => {
            try {
                const q = query(collection(db, 'public_decks'), where('userId', '==', userId));
                const snap = await safeGetDocs(q);
                if (snap.empty) return;
                const batch = writeBatch(db);
                snap.forEach((d: any) => batch.delete(d.ref));
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
                await deleteDoc(doc(db, 'users', userId));
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
        if (!db || !userId) return emptyResult;

        try {
            let user = null;
            try {
                const userSnap = await getDoc(doc(db, 'users', userId));
                user = userSnap.exists() ? (userSnap.data() as User) : null;
            } catch (e) {
                return emptyResult;
            }

            const readingsSnap = await safeGetDocs(collection(db, 'users', userId, 'readings'));
            const readings: Reading[] = [];
            readingsSnap.forEach((d: any) => readings.push(d.data() as Reading));

            const spreadsSnap = await safeGetDocs(collection(db, 'users', userId, 'customSpreads'));
            const customSpreads: Spread[] = [];
            spreadsSnap.forEach((d: any) => customSpreads.push(d.data() as Spread));

            const cardsSnap = await safeGetDocs(collection(db, 'users', userId, 'customCards'));
            const customCards: Record<string, Partial<Card>> = {};
            cardsSnap.forEach((d: any) => {
                customCards[d.id] = d.data() as Partial<Card>;
            });

            const quizSnap = await safeGetDocs(collection(db, 'users', userId, 'quizResults'));
            const quizResults: QuizResult[] = [];
            quizSnap.forEach((d: any) => quizResults.push(d.data() as QuizResult));

            // Load Custom Lessons
            const lessonsSnap = await safeGetDocs(collection(db, 'users', userId, 'customLessons'));
            const customLessons: Lesson[] = [];
            lessonsSnap.forEach((d: any) => customLessons.push(d.data() as Lesson));

            // Load Private Decks Metadata
            const decksSnap = await safeGetDocs(collection(db, 'users', userId, 'private_decks'));
            const privateDecks: DeckMeta[] = [];
            
            for (const d of decksSnap.docs) {
                const meta = d.data() as DeckMeta;
                privateDecks.push(meta);
                
                // Background Sync
                try {
                    const testCard = await dbService.getImage(`deck_${meta.id}_major-0`);
                    if (!testCard) {
                        const imgsSnap = await getDocs(collection(db, 'users', userId, 'private_decks', meta.id, 'card_images'));
                        imgsSnap.forEach((imgDoc: any) => {
                            const content = imgDoc.data().content;
                            dbService.saveImage(`deck_${meta.id}_${imgDoc.id}`, content);
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
