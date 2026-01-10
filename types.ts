
export interface Card {
  id: string;
  name: string;
  nameEn?: string; 
  arcana: 'Major' | 'Minor';
  suit?: 'Kelyhek' | 'Érmék' | 'Kardok' | 'Botok';
  number?: number;
  keywords: string[];
  meaningUpright: string; 
  meaningReversed: string; 
  questions: string[]; 
  affirmation?: string; 
  element?: string; 
  astrology?: string;
  numerology?: string;
  history?: string; 
  symbolism?: string; 
  imageUrl: string; 

  generalMeaning?: string;
  loveMeaning?: string;
  careerMeaning?: string;
  advice?: string;
  dailyMeaning?: string;
  yearlyMeaning?: string;
  
  primaryContexts?: MeaningContext[]; 

  // Új mezők a kért funkciókhoz
  shortDesc?: string;
  comparison?: {
    title: string;
    text: string;
    relatedCardId: string;
  };
}

export type MeaningContext = 'general' | 'love' | 'career' | 'advice' | 'daily' | 'yearly';

export type SpreadCategory = 'general' | 'love' | 'career' | 'self' | 'calendar' | 'decision' | 'advice';

export interface SpreadPosition {
  id: number;
  name: string;
  description: string;
  x: number;
  y: number;
  rotation?: number; 
  defaultContext?: MeaningContext; 
}

export interface Spread {
  id: string;
  name: string;
  description: string;
  category: SpreadCategory; 
  positions: SpreadPosition[];
  backgroundImage?: string; 
  isCustom?: boolean;
  author?: string;
  userId?: string; 
  isPublic?: boolean;
  downloads?: number;
  sourceId?: string; 
}

export interface DrawnCard {
  positionId: number;
  cardId: string;
  isReversed: boolean;
}

export interface AstrologyData {
    moonPhase: string; 
    sunSign: string;
    moonSign: string; 
    ascendant: string; 
    planetHour?: string; 
    illumination: number; 
    retrograde?: string[]; 
    icon?: string; 
    dayNumerology?: number; 
}

export interface Comment {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    text: string;
    date: string;
    isEdited?: boolean;
}

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  date: string; // ISO format
  type: 'ritual' | 'meditation' | 'circle' | 'learning';
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  participants: string[]; // User IDs
  participantDetails?: { uid: string, name: string, avatar?: string }[];
  spreadId?: string; // Optional recommended spread
  createdAt: string;
}

export interface Reading {
  id: string;
  userId: string;
  date: string;
  spreadId: string;
  cards: DrawnCard[];
  notes: string;
  question?: string;
  isFavorite?: boolean; 
  astrology?: AstrologyData; 
  mood?: string; 
  
  isPublic?: boolean;
  authorName?: string;
  authorAvatar?: string;
  likes?: number; 
  likedBy?: string[]; 
  comments?: Comment[]; 
  tags?: string[]; 
}

export interface QuizResult {
    id: string;
    date: string;
    topic: string; 
    score: number; 
    totalQuestions: number;
    details: {
        cardId: string;
        isCorrect: boolean;
        userAnswer?: string;
        correctAnswer?: string;
    }[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold'; 
  condition: (user: User, readings: Reading[]) => boolean;
}

export interface CommunityBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  userId: string;
  authorName: string;
  createdAt: string;
  likes: number;
  likedBy: string[];
  requirements?: string; // Új: A megszerzés feltétele szövegesen
  isManual?: boolean;    // Új: A készítő hagyja-e jóvá manuálisan
  limit?: number;        // Új: Maximális kiadható darabszám
  issuedCount?: number;  // Új: Hány darab került eddig kiadásra
}

export interface BadgeRequest {
  id: string;
  badgeId: string;
  badgeName: string;
  badgeIcon: string;
  requesterId: string;
  requesterName: string;
  requesterAvatar?: string;
  creatorId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  message?: string;
}

export interface TarotNotification {
  id: string;
  userId: string;
  type: 'badge_approved' | 'badge_rejected' | 'new_comment' | 'system' | 'mention';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export type ThemeType = 'mystic' | 'nature' | 'minimal' | 'dark' | 'retro' | 'galaxy' | 'ocean' | 'royal' | 'rose';
export type CardBackType = 'classic' | 'stars' | 'geo' | 'velvet';

export interface DeckMeta {
    id: string;
    name: string;
    description: string;
    author?: string;
    userId?: string; 
    basePath: string; 
    extension: string; 
    isCustomLocal?: boolean; 
    downloads?: number; 
    isPublic?: boolean; 
    sourceId?: string; 
}

export type LessonCategory = 'basics' | 'major' | 'minor' | 'reading' | 'symbolism';
export type LessonDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface LessonQuizQuestion {
    statement: string;
    isTrue: boolean;
}

export interface Lesson {
    id: string;
    title: string;
    description: string;
    content: string; 
    category: LessonCategory;
    difficulty: LessonDifficulty;
    xpReward: number;
    relatedCards?: string[]; 
    icon?: string; 
    color?: string; 
    quizQuestions?: LessonQuizQuestion[]; // Új mező a teszthez

    isCustom?: boolean;
    author?: string;
    userId?: string;
    isPublic?: boolean;
    downloads?: number;
    sourceId?: string; 
}

export interface User {
  id: string;
  name: string;
  realName?: string; 
  birthDate?: string; 
  birthTime?: string; 
  
  autoThemeEnabled?: boolean; 
  themePreference: ThemeType; 
  dayTheme?: ThemeType; 
  nightTheme?: ThemeType; 
  
  deckPreference: string; 
  cardBackPreference?: CardBackType; 
  
  quickActions?: string[]; 

  avatarId: string; 
  language: 'hu' | 'en';
  badges: string[];
  favoriteCards?: string[]; 
  favoriteSpreads?: string[]; // Új: Kedvenc kirakások felhőbe
  fontSize: 'normal' | 'large';
  soundEnabled: boolean;
  xp: number; 
  level: number;
  completedLessons?: string[]; 
  isAnonymous?: boolean; 
  folders?: string[]; 
  isAdmin?: boolean; 
  bio?: string; 

  createdAt?: string;
  lastLogin?: string;

  lessonCollection?: string[];
  deckCollection?: string[];
}

export interface ThemeColors {
  bg: string;
  text: string;
  accent: string;
  cardBg: string;
  header: string;
}

export interface ToastMessage {
    id: string;
    text: string;
    type: 'success' | 'info';
}
