import { ThemeColors } from '../types';

// --- Moods ---
export const MOODS = [
    { id: 'calm', icon: '😌', label: 'Nyugodt' },
    { id: 'happy', icon: '😊', label: 'Vidám' },
    { id: 'sad', icon: '😔', label: 'Szomorú' },
    { id: 'anxious', icon: '😰', label: 'Szorongó' },
    { id: 'energetic', icon: '⚡', label: 'Energikus' },
    { id: 'mystical', icon: '🔮', label: 'Misztikus' },
    { id: 'tired', icon: '😴', label: 'Fáradt' },
    { id: 'grateful', icon: '🙏', label: 'Hálás' }
];

// --- Lesson Customization Options ---
export const LESSON_ICONS = [
    '📜', '🔮', '✨', '🧠', '⚖️', '🎨', '🔢', '🗝️', '👑', '🪐',
    '🤡', '🧙‍♂️', '🌙', '☀️', '⭐', '🔥', '💧', '🌪️', '🌱', '⚡',
    '👁️', '📚', '🕯️', '🧿', '🧬', '🦉', '🦋', '🐍', '🐺', '🦁',
    '🏆', '⚔️', '🛡️', '🧪', '🕰️', '🧭', '🚪', '🌈', '🌀', '♾️'
];

export const LESSON_COLORS = [
    { id: 'blue', class: 'from-blue-600 to-indigo-600', label: 'Kék (Bölcsesség)' },
    { id: 'purple', class: 'from-purple-600 to-pink-600', label: 'Lila (Misztikum)' },
    { id: 'green', class: 'from-emerald-600 to-teal-600', label: 'Zöld (Föld)' },
    { id: 'gold', class: 'from-yellow-500 to-orange-500', label: 'Arany (Szellem)' },
    { id: 'red', class: 'from-red-500 to-rose-600', label: 'Vörös (Szenvedély)' },
    { id: 'dark', class: 'from-gray-700 to-gray-900', label: 'Sötét (Titok)' },
    { id: 'galaxy', class: 'from-indigo-900 via-purple-900 to-pink-900', label: 'Galaxis' },
    { id: 'fire', class: 'from-orange-600 via-red-600 to-yellow-500', label: 'Tűz' }
];

// --- Quick Actions Pool ---
export const QUICK_ACTION_OPTIONS = [
    { id: 'history', icon: '📜', label: 'Napló', color: 'text-amber-400' },
    { id: 'library', icon: '📖', label: 'Tudástár', color: 'text-emerald-400' },
    { id: 'community', icon: '🌍', label: 'Faliújság', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
    { id: 'customSpread', icon: '✨', label: 'Tervező', color: 'text-purple-400' },
    { id: 'astro', icon: '🌙', label: 'Holdnaptár', color: 'text-indigo-400' },
    { id: 'numerology', icon: '🔢', label: 'Számmisztika', color: 'text-pink-400' },
    { id: 'stats', icon: '📊', label: 'Elemzés', color: 'text-orange-400' },
    { id: 'deckBuilder', icon: '🖌️', label: 'Pakli Műhely', color: 'text-green-400' },
    { id: 'communityDecks', icon: '🎨', label: 'Pakli Piac', color: 'text-red-300' },
    { id: 'communitySpreads', icon: '💠', label: 'Kirakás Piac', color: 'text-teal-300' },
    { id: 'quiz', icon: '🎓', label: 'Tudás Próba', color: 'text-yellow-400' },
    { id: 'live', icon: '📡', label: 'Távjóslás', color: 'text-red-500 font-bold' },
    { id: 'education', icon: '📚', label: 'Tanulás', color: 'text-cyan-300' },
    { id: 'install', icon: '💾', label: 'Mentés', color: 'text-white' },
    { id: 'profile', icon: '👤', label: 'Profil', color: 'text-slate-400' }
];

// --- Themes ---
export const THEMES: Record<string, ThemeColors> = {
  mystic: {
    bg: '', // Default radial gradient
    text: 'text-gray-100',
    accent: 'bg-indigo-500',
    cardBg: 'glass-panel rounded-2xl',
    header: 'glass-panel-dark backdrop-blur-md border-b border-white/10 text-white',
  },
  nature: {
    bg: 'bg-gradient-to-br from-green-900 to-slate-900',
    text: 'text-green-50',
    accent: 'bg-green-600',
    cardBg: 'glass-panel bg-green-900/20 rounded-2xl',
    header: 'glass-panel-dark text-green-100',
  },
  minimal: {
    bg: 'bg-gray-100',
    text: 'text-gray-900',
    accent: 'bg-black',
    cardBg: 'bg-white shadow-lg rounded-2xl border border-gray-100',
    header: 'bg-white/80 backdrop-blur text-black border-b',
  },
  dark: {
    bg: 'bg-black',
    text: 'text-gray-300',
    accent: 'bg-red-900',
    cardBg: 'bg-gray-900 border border-gray-800 rounded-2xl',
    header: 'bg-black border-b border-gray-800',
  },
  retro: {
    bg: 'bg-[#2b213a] bg-[url("https://www.transparenttextures.com/patterns/cubes.png")]',
    text: 'text-yellow-100',
    accent: 'bg-orange-500',
    cardBg: 'bg-[#4a3b5c] border-2 border-orange-400 rounded-xl shadow-[4px_4px_0px_0px_rgba(249,115,22,1)]',
    header: 'bg-[#2b213a] border-b-2 border-orange-400 text-orange-200',
  },
  galaxy: {
    bg: 'bg-gradient-to-r from-purple-900 via-blue-900 to-black',
    text: 'text-blue-100',
    accent: 'bg-pink-500',
    cardBg: 'glass-panel bg-blue-900/30 rounded-2xl border-pink-500/30',
    header: 'glass-panel-dark border-b border-pink-500/30 text-pink-200',
  },
  ocean: {
    bg: 'bg-gradient-to-b from-cyan-900 to-blue-950',
    text: 'text-cyan-50',
    accent: 'bg-cyan-500',
    cardBg: 'glass-panel bg-cyan-900/20 rounded-2xl border-cyan-500/20',
    header: 'glass-panel-dark border-b border-cyan-500/20 text-cyan-200',
  },
  royal: {
    bg: 'bg-gradient-to-br from-indigo-950 to-purple-950',
    text: 'text-amber-100',
    accent: 'bg-amber-500',
    cardBg: 'glass-panel bg-purple-900/40 rounded-2xl border-amber-500/40',
    header: 'glass-panel-dark border-b border-amber-500/40 text-amber-300',
  },
  rose: {
    bg: 'bg-gradient-to-tr from-rose-900 to-slate-900',
    text: 'text-rose-100',
    accent: 'bg-rose-500',
    cardBg: 'glass-panel bg-rose-900/20 rounded-2xl border-rose-500/20',
    header: 'glass-panel-dark border-b border-rose-500/20 text-rose-200',
  }
};

export const CARD_BACKS = {
    classic: 'bg-indigo-900 border-2 border-gold-500/30 flex items-center justify-center',
    stars: 'bg-black border border-white/20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900 via-black to-black', 
    geo: 'bg-slate-800 border-2 border-emerald-500/30',
    velvet: 'bg-red-900 border-4 border-gold-600'
};

export const AVATAR_GALLERY = [
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Willow&backgroundColor=b6e3f4',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Luna&backgroundColor=c0aede',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Raven&backgroundColor=ffdfbf',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Zoe&backgroundColor=ffd5dc',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Molly&backgroundColor=d1d4f9',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Felix&backgroundColor=c0aede',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Jasper&backgroundColor=ffdfbf',
    'https://api.dicebear.com/7.x/lorelei/svg?seed=Oliver&backgroundColor=b6e3f4',
    'https://api.dicebear.com/7.x/notionists/svg?seed=Tarot1',
    'https://api.dicebear.com/7.x/notionists/svg?seed=Tarot2',
    'https://api.dicebear.com/7.x/notionists/svg?seed=Tarot3',
    'https://api.dicebear.com/7.x/notionists/svg?seed=Tarot4',
    'https://api.dicebear.com/7.x/notionists/svg?seed=Tarot5',
    'https://api.dicebear.com/7.x/notionists/svg?seed=Tarot6',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Spirit1',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Spirit2',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Spirit3',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Spirit4',
    'https://api.dicebear.com/7.x/thumbs/svg?seed=Mystic',
    'https://api.dicebear.com/7.x/thumbs/svg?seed=Guide'
];