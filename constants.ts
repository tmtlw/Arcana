
import { DeckService } from './services/deckService';
import { DeckMeta, User } from './types';
import { AVATAR_GALLERY } from './constants/ui';

// --- ADMIN CONFIG ---
export const ADMIN_EMAILS = [
    'admin@example.com', 
    'te_email_cimed@gmail.com' 
];

// --- UTILS ---

export const getCardImage = (cardId: string, deckConfig?: DeckMeta) => {
    const effectiveDeck = deckConfig || { 
        id: 'rider-waite', 
        name: 'Rider-Waite', 
        description: '', 
        basePath: 'https://www.sacred-texts.com/tarot/pkt/img/', 
        extension: 'jpg' 
    };
    return DeckService.getCardImageUrl(cardId, effectiveDeck);
};

export const getAvatarUrl = (user: User) => {
    if (user && user.avatarId && (user.avatarId.startsWith('http') || user.avatarId.startsWith('/'))) {
        return user.avatarId;
    }
    return AVATAR_GALLERY[0];
};

// --- EXPLICIT EXPORTS (Fixing loader issues) ---
import { FULL_DECK } from './constants/deck';
import { HOLIDAY_DETAILS, ZODIAC_INFO } from './constants/astro';
import { MOODS, QUICK_ACTION_OPTIONS, THEMES, CARD_BACKS, AVATAR_GALLERY as AG, LESSON_COLORS, LESSON_ICONS } from './constants/ui';
import { BADGES, LESSONS } from './constants/gamification';
import { DEFAULT_SPREADS } from './constants/spreads';

export { FULL_DECK, HOLIDAY_DETAILS, ZODIAC_INFO, MOODS, QUICK_ACTION_OPTIONS, THEMES, CARD_BACKS, BADGES, LESSONS, DEFAULT_SPREADS, AG as AVATAR_GALLERY, LESSON_COLORS, LESSON_ICONS };
