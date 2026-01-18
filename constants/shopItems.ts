
export interface ShopItem {
    id: string;
    name: string;
    description: string;
    type: 'deck' | 'background' | 'cover';
    cost: number;
    previewUrl?: string; // URL for image or CSS value (e.g. "linear-gradient...")
    value?: string; // The actual value to apply (e.g. css class or image path)
    category?: string;
    isPremium?: boolean;
}

export const SHOP_ITEMS: ShopItem[] = [
    // --- DECKS ---
    {
        id: 'deck_rider',
        name: 'Rider-Waite (Klasszikus)',
        description: 'A legismertebb tarot pakli, ideális kezdőknek.',
        type: 'deck',
        cost: 0,
        value: 'rider',
        previewUrl: 'assets/decks/rider_preview.jpg'
    },
    {
        id: 'deck_marseille',
        name: 'Tarot de Marseille',
        description: 'Történelmi pakli a 17. századból, autentikus élmény.',
        type: 'deck',
        cost: 500,
        value: 'marseille',
        previewUrl: 'assets/decks/marseille_preview.jpg',
        isPremium: true
    },
    {
        id: 'deck_thoth',
        name: 'Thoth Tarot',
        description: 'Aleister Crowley misztikus paklija, mély szimbolikával.',
        type: 'deck',
        cost: 800,
        value: 'thoth',
        previewUrl: 'assets/decks/thoth_preview.jpg',
        isPremium: true
    },

    // --- BACKGROUNDS ---
    {
        id: 'bg_mystic',
        name: 'Misztikus Köd (Alap)',
        description: 'A rendszer alapértelmezett sötétlila témája.',
        type: 'background',
        cost: 0,
        value: 'bg-[#13131a]',
        previewUrl: 'linear-gradient(to bottom right, #13131a, #1e1e2e)'
    },
    {
        id: 'bg_galaxy',
        name: 'Galaktikus Utazás',
        description: 'Csillagközi tér a meditációhoz.',
        type: 'background',
        cost: 300,
        value: 'bg-galaxy-pattern', // Assumes css class exists or handled by logic
        previewUrl: 'url(assets/bg/galaxy_thumb.jpg)'
    },
    {
        id: 'bg_forest',
        name: 'Elvarázsolt Erdő',
        description: 'Zöldes, természetközeli nyugalom.',
        type: 'background',
        cost: 300,
        value: 'bg-forest-pattern',
        previewUrl: 'linear-gradient(to bottom, #0f2027, #203a43, #2c5364)'
    },
    {
        id: 'bg_royal',
        name: 'Királyi Bársony',
        description: 'Vörös és arany luxus érzés.',
        type: 'background',
        cost: 500,
        value: 'bg-royal-pattern',
        previewUrl: 'linear-gradient(to right, #870000, #190a05)'
    },

    // --- COVERS (Card Backs) ---
    {
        id: 'cover_classic',
        name: 'Klasszikus Kockás',
        description: 'Hagyományos hátlap minta.',
        type: 'cover',
        cost: 0,
        value: 'classic'
    },
    {
        id: 'cover_stars',
        name: 'Csillagos Ég',
        description: 'Arany csillagok mélykék alapon.',
        type: 'cover',
        cost: 200,
        value: 'stars'
    },
    {
        id: 'cover_geo',
        name: 'Szakrális Geometria',
        description: 'Bonyolult geometriai mintázat.',
        type: 'cover',
        cost: 400,
        value: 'geo'
    },
    {
        id: 'cover_eye',
        name: 'Mindent Látó Szem',
        description: 'Védelmező szimbólum.',
        type: 'cover',
        cost: 600,
        value: 'eye',
        isPremium: true
    }
];
