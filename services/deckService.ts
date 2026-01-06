
import { DeckMeta } from '../types';
import { dbService } from './dbService';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, doc, getDoc, updateDoc, increment, setDoc, deleteDoc, where, writeBatch } from 'firebase/firestore';
import { StorageService } from './storageService'; // Added import

const RIDER_WAITE: DeckMeta = { 
    id: 'rider-waite', 
    name: 'Rider-Waite (Klasszikus)', 
    description: 'A tradícionális Tarot pakli (Wiki/Sacred Texts).',
    author: 'A.E. Waite & P.C. Smith',
    basePath: 'https://www.sacred-texts.com/tarot/pkt/img/', 
    extension: 'jpg'
};

const KEYS = {
    CUSTOM_DECKS: 'tarot_custom_local_decks',
};

const getRiderWaiteFilename = (cardId: string): string => {
    const parts = cardId.split('-');
    const suit = parts[0];
    const rank = parts[1];
    if (suit === 'major') return `ar${rank.padStart(2, '0')}`;
    const suitMap: Record<string, string> = { 'wands': 'wa', 'cups': 'cu', 'swords': 'sw', 'pentacles': 'pe' };
    const prefix = suitMap[suit];
    let suffix = '';
    if (rank === '1') suffix = 'ac';
    else if (['page', 'knight', 'queen', 'king'].includes(rank)) suffix = rank.substring(0, 2);
    else suffix = rank.padStart(2, '0');
    return `${prefix}${suffix}`;
};

export const DeckService = {
    loadAvailableDecks: async (): Promise<DeckMeta[]> => {
        let folderDecks: DeckMeta[] = [];
        try {
            const response = await fetch('./decks.json');
            if (response.ok) {
                const folderList = await response.json();
                for (const folder of folderList) {
                    folderDecks.push({
                        id: folder,
                        name: folder,
                        description: 'Helyi pakli',
                        basePath: `./decks/${folder}/`,
                        extension: 'jpg'
                    });
                }
            }
        } catch (e) {}

        const localDecksJson = localStorage.getItem(KEYS.CUSTOM_DECKS);
        const userCustomDecks: DeckMeta[] = localDecksJson ? JSON.parse(localDecksJson) : [];

        return [RIDER_WAITE, ...folderDecks, ...userCustomDecks];
    },

    getCardImageUrl: (cardId: string, deck: DeckMeta): string => {
        if (!deck) return DeckService.getCardImageUrl(cardId, RIDER_WAITE);
        if (deck.isCustomLocal) return ''; // Handled by async fetcher
        if (deck.id === 'rider-waite') {
            const filename = getRiderWaiteFilename(cardId);
            return `${deck.basePath}${filename}.${deck.extension}`;
        }
        const path = deck.basePath.endsWith('/') ? deck.basePath : `${deck.basePath}/`;
        return `${path}${cardId}.${deck.extension}`;
    },

    getCardImageAsync: async (cardId: string, deck: DeckMeta): Promise<string> => {
        if (deck.isCustomLocal) {
            const key = `deck_${deck.id}_${cardId}`;
            const img = await dbService.getImage(key);
            return img || ''; 
        }
        return DeckService.getCardImageUrl(cardId, deck);
    },

    // Updated to support Cloud Sync
    saveCustomDeck: async (meta: DeckMeta, images: Record<string, string>, userId?: string) => {
        // 1. Save Locally (IndexedDB & LocalStorage) for speed/offline
        const localDecksJson = localStorage.getItem(KEYS.CUSTOM_DECKS);
        const localDecks: DeckMeta[] = localDecksJson ? JSON.parse(localDecksJson) : [];
        const updatedDecks = localDecks.filter(d => d.id !== meta.id);
        updatedDecks.push(meta);
        localStorage.setItem(KEYS.CUSTOM_DECKS, JSON.stringify(updatedDecks));

        for (const [cardId, base64] of Object.entries(images)) {
            await dbService.saveImage(`deck_${meta.id}_${cardId}`, base64);
        }

        // 2. Sync to Cloud if user logged in
        if (userId) {
            await StorageService.saveUserDeckToCloud(userId, meta, images);
        }
    },

    deleteCustomDeck: async (deckId: string, userId?: string) => {
        const localDecksJson = localStorage.getItem(KEYS.CUSTOM_DECKS);
        if(!localDecksJson) return;
        const localDecks: DeckMeta[] = JSON.parse(localDecksJson);
        const updated = localDecks.filter(d => d.id !== deckId);
        localStorage.setItem(KEYS.CUSTOM_DECKS, JSON.stringify(updated));
        
        // Remove from Public DB if exists
        if (db) {
            try {
                await deleteDoc(doc(db, 'public_decks', deckId));
            } catch(e) {}
        }

        // Remove from Private User Cloud DB
        if (userId) {
            await StorageService.deleteUserDeckFromCloud(userId, deckId);
        }
    },

    // --- Community Deck Features ---

    publishDeck: async (deck: DeckMeta, userId: string) => {
        if (!db) throw new Error("Nincs kapcsolat az adatbázissal.");
        
        // 1. Get all images from IDB
        const allImages: Record<string, string> = {};
        // Note: In a real app we'd iterate known IDs. Here assuming FULL_DECK IDs.
        const { FULL_DECK } = await import('../constants'); // Dynamic import to avoid circular dependency
        
        for (const card of FULL_DECK) {
            const img = await dbService.getImage(`deck_${deck.id}_${card.id}`);
            if (img) allImages[card.id] = img;
        }

        // 2. Upload to Firestore
        try {
            await setDoc(doc(db, 'public_decks', deck.id), {
                ...deck,
                userId: userId, // Track owner
                isPublic: true,
                downloads: 0,
                images: allImages // Heavy payload!
            });
        } catch (e) {
            console.error(e);
            throw new Error("Túl nagy a pakli mérete a megosztáshoz (Firestore limit). Próbálj kisebb képeket használni.");
        }
    },

    getPublicDecks: async (): Promise<DeckMeta[]> => {
        if (!db) return [];
        const q = query(collection(db, 'public_decks'), limit(20));
        const snap = await getDocs(q);
        const decks: DeckMeta[] = [];
        snap.forEach(d => {
            const data = d.data();
            // Don't pull images yet
            const { images, ...meta } = data; 
            decks.push(meta as DeckMeta);
        });
        return decks;
    },

    // Admin function
    deletePublicDeck: async (deckId: string) => {
        if (!db) return;
        try {
            await deleteDoc(doc(db, 'public_decks', deckId));
        } catch (e) {
            console.error("Admin Error deleting deck:", e);
            throw e;
        }
    },
    
    deleteDecksByUser: async (userId: string) => {
        if (!db) return;
        try {
            const q = query(collection(db, 'public_decks'), where('userId', '==', userId));
            const snap = await getDocs(q);
            if(snap.empty) return;
            const batch = writeBatch(db);
            snap.forEach(d => batch.delete(d.ref));
            await batch.commit();
        } catch (e) {
            console.error("Error wiping user decks:", e);
        }
    },

    downloadDeck: async (deckId: string): Promise<boolean> => {
        if (!db) return false;
        const snap = await getDoc(doc(db, 'public_decks', deckId));
        if (!snap.exists()) return false;
        
        const data = snap.data();
        const images = data.images;
        const meta = { 
            ...data, 
            isCustomLocal: true, 
            id: `${data.id}_dl`,
            sourceId: deckId // Important: Link to original for cascade delete
        } as DeckMeta;
        
        delete (meta as any).images;

        await DeckService.saveCustomDeck(meta, images);
        await updateDoc(doc(db, 'public_decks', deckId), { downloads: increment(1) });
        return true;
    }
};
