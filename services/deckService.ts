
import { DeckMeta } from '../types';
import { dbService } from './dbService';
import { store, Ops } from './data';
import { StorageService } from './storageService';

const RIDER_WAITE: DeckMeta = { 
    id: 'rider-waite', 
    name: 'Rider-Waite (Klasszikus)', 
    description: 'A tradícionális Tarot pakli (Wiki/Sacred Texts).',
    author: 'A.E. Waite & P.C. Smith',
    basePath: 'https://www.sacred-texts.com/tarot/pkt/img/', 
    extension: 'jpg'
};

const MARSEILLE: DeckMeta = {
    id: 'deck_marseille',
    name: 'Tarot de Marseille (Jean Dodal)',
    description: 'Klasszikus francia Tarot pakli az 1700-as évekből. (Placeholder képekkel)',
    author: 'Jean Dodal',
    basePath: 'https://upload.wikimedia.org/wikipedia/commons/',
    extension: 'jpg',
    isSystem: true
};

const THOTH: DeckMeta = {
    id: 'deck_thoth',
    name: 'Thoth Tarot',
    description: 'Aleister Crowley és Lady Frieda Harris misztikus paklija. (Placeholder képekkel)',
    author: 'Aleister Crowley',
    basePath: 'https://upload.wikimedia.org/wikipedia/en/',
    extension: 'jpg',
    isSystem: true
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
            const response = await fetch('/decks.json');
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

        // Return System Decks + Local Folder Decks + User Custom Decks
        return [RIDER_WAITE, MARSEILLE, THOTH, ...folderDecks, ...userCustomDecks];
    },

    getCardImageUrl: (cardId: string, deck: DeckMeta): string => {
        if (!deck) return DeckService.getCardImageUrl(cardId, RIDER_WAITE);

        // Handle Marseille Specifics
        if (deck.id === 'deck_marseille') {
             // NOTE: Using RWS placeholder due to lack of verified public URLs for Marseille.
             // This ensures stability.
             const filename = getRiderWaiteFilename(cardId);
             return `${RIDER_WAITE.basePath}${filename}.${RIDER_WAITE.extension}`;
        }

        // Handle Thoth Specifics
        if (deck.id === 'deck_thoth') {
             // NOTE: Using RWS placeholder due to lack of verified public URLs.
             const filename = getRiderWaiteFilename(cardId);
             return `${RIDER_WAITE.basePath}${filename}.${RIDER_WAITE.extension}`;
        }

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

    saveCustomDeck: async (meta: DeckMeta, images: Record<string, string>, userId?: string) => {
        if (!userId) {
            const localDecksJson = localStorage.getItem(KEYS.CUSTOM_DECKS);
            const localDecks: DeckMeta[] = localDecksJson ? JSON.parse(localDecksJson) : [];
            const updatedDecks = localDecks.filter(d => d.id !== meta.id);
            updatedDecks.push(meta);
            localStorage.setItem(KEYS.CUSTOM_DECKS, JSON.stringify(updatedDecks));
        }

        for (const [cardId, base64] of Object.entries(images)) {
            await dbService.saveImage(`deck_${meta.id}_${cardId}`, base64);
        }

        if (userId) {
            await StorageService.saveUserDeckToCloud(userId, meta, images);
        }
    },

    deleteCustomDeck: async (deckId: string, userId?: string) => {
        const localDecksJson = localStorage.getItem(KEYS.CUSTOM_DECKS);
        if(localDecksJson) {
            const localDecks: DeckMeta[] = JSON.parse(localDecksJson);
            const updated = localDecks.filter(d => d.id !== deckId);
            localStorage.setItem(KEYS.CUSTOM_DECKS, JSON.stringify(updated));
        }
        
        if (store.available) {
            try {
                await store.remove(['public_decks', deckId]);
            } catch(e) {}
        }

        if (userId) {
            await StorageService.deleteUserDeckFromCloud(userId, deckId);
        }
    },

    // --- Community Deck Features ---

    publishDeck: async (deck: DeckMeta, userId: string, price: number = 0) => {
        if (!store.available) throw new Error("Nincs kapcsolat az adatbázissal.");
        
        const allImages: Record<string, string> = {};
        // Use dynamic import or pass dependencies if possible, here assuming full deck logic
        // For custom local decks, we need to load images.
        if (deck.isCustomLocal) {
             const { FULL_DECK } = await import('../constants/deckConstants');
             for (const card of FULL_DECK) {
                const img = await dbService.getImage(`deck_${deck.id}_${card.id}`);
                if (img) allImages[card.id] = img;
            }
        }

        try {
            await store.set(['public_decks', deck.id], {
                ...deck,
                userId: userId,
                isPublic: true,
                price: price, // Added Price
                downloads: 0,
                images: allImages
            });
        } catch (e) {
            console.error(e);
            throw new Error("Hiba a pakli közzétételekor (méretkorlát?).");
        }
    },

    getPublicDecks: async (): Promise<DeckMeta[]> => {
        if (!store.available) return [];
        const docs = await store.list<any>(['public_decks'], { limit: 20 });
        return docs.map(d => {
            const { images, ...meta } = d.data;
            return meta as DeckMeta;
        });
    },

    deletePublicDeck: async (deckId: string) => {
        if (!store.available) return;
        try {
            await store.remove(['public_decks', deckId]);
        } catch (e) {
            console.error(e);
            throw e;
        }
    },
    
    deleteDecksByUser: async (userId: string) => {
        if (!store.available) return;
        try {
            const docs = await store.list(['public_decks'], { where: [['userId', '==', userId]] });
            if (docs.length === 0) return;
            const batch = store.batch();
            docs.forEach(d => batch.remove(d.path));
            await batch.commit();
        } catch (e) {
            console.error(e);
        }
    },

    downloadDeck: async (deckId: string): Promise<boolean> => {
        if (!store.available) return false;
        const data = await store.get<any>(['public_decks', deckId]);
        if (!data) return false;

        const images = data.images;
        const meta = { 
            ...data, 
            isCustomLocal: true, 
            id: `${data.id}_dl_${Date.now()}`, // Unique ID for download
            sourceId: deckId
        } as DeckMeta;
        
        delete (meta as any).images;

        await DeckService.saveCustomDeck(meta, images || {});
        await store.update(['public_decks', deckId], { downloads: Ops.increment(1) });
        return true;
    }
};
