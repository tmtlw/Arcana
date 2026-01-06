
import { Badge, User, Reading } from '../types';

const myReadings = (u: User, r: Reading[]) => r.filter(x => x.userId === u.id);

const createTieredBadge = (
    baseId: string, 
    baseName: string, 
    baseDesc: string, 
    icon: string, 
    thresholds: [number, number, number], 
    checkFn: (user: User, readings: Reading[], threshold: number) => boolean
): Badge[] => {
    return [
        {
            id: `${baseId}_bronze`,
            name: `${baseName} (Bronz)`,
            description: `${baseDesc} (${thresholds[0]} alkalommal)`,
            icon: icon,
            tier: 'bronze',
            condition: (u, r) => checkFn(u, r, thresholds[0])
        },
        {
            id: `${baseId}_silver`,
            name: `${baseName} (Ezüst)`,
            description: `${baseDesc} (${thresholds[1]} alkalommal)`,
            icon: icon,
            tier: 'silver',
            condition: (u, r) => checkFn(u, r, thresholds[1])
        },
        {
            id: `${baseId}_gold`,
            name: `${baseName} (Arany)`,
            description: `${baseDesc} (${thresholds[2]} alkalommal)`,
            icon: icon,
            tier: 'gold',
            condition: (u, r) => checkFn(u, r, thresholds[2])
        }
    ];
};

export const BADGES: Badge[] = [
    // --- Alap Aktivitás ---
    ...createTieredBadge('novice', 'Beavatott', 'Végezz el összesen ennyi jóslást', '🔮', [1, 10, 50], (u, r, t) => myReadings(u, r).length >= t),
    ...createTieredBadge('scribe', 'Krónikás', 'Írj jegyzetet a húzásaidhoz', '✍️', [5, 20, 50], (u, r, t) => myReadings(u, r).filter(x => x.notes && x.notes.length > 10).length >= t),
    ...createTieredBadge('messenger', 'Hírvivő', 'Ossz meg jóslatokat a közösséggel', '🌍', [1, 5, 20], (u, r, t) => myReadings(u, r).filter(x => x.isPublic).length >= t),
    ...createTieredBadge('scholar', 'Tudós', 'Teljesíts leckéket', '📜', [1, 3, 10], (u, r, t) => (u.completedLessons?.length || 0) >= t),

    // --- Elemi Mesterek ---
    { id: 'master_fire', name: 'Tűz Mágusa', description: 'Húzz 10 kártyát a Botok színéből', icon: '🔥', tier: 'silver', condition: (u, r) => r.flatMap(x => x.cards).filter(c => c.cardId.startsWith('wands')).length >= 10 },
    { id: 'master_water', name: 'Víz Idézője', description: 'Húzz 10 kártyát a Kelyhek színéből', icon: '💧', tier: 'silver', condition: (u, r) => r.flatMap(x => x.cards).filter(c => c.cardId.startsWith('cups')).length >= 10 },
    { id: 'master_air', name: 'Levegő Vándora', description: 'Húzz 10 kártyát a Kardok színéből', icon: '🌬️', tier: 'silver', condition: (u, r) => r.flatMap(x => x.cards).filter(c => c.cardId.startsWith('swords')).length >= 10 },
    { id: 'master_earth', name: 'Föld Őrzője', description: 'Húzz 10 kártyát az Érmék színéből', icon: '🌱', tier: 'silver', condition: (u, r) => r.flatMap(x => x.cards).filter(c => c.cardId.startsWith('pentacles')).length >= 10 },

    // --- Kártya Specifikus ---
    { id: 'fool_path', name: 'A Bolond Útja', description: 'Húzd ki a Bolond kártyát', icon: '🤡', tier: 'gold', condition: (u, r) => r.flatMap(x => x.cards).some(c => c.cardId === 'major-0') },
    { id: 'death_rebirth', name: 'Újjászületés', description: 'Húzd ki a Halál kártyát', icon: '💀', tier: 'gold', condition: (u, r) => r.flatMap(x => x.cards).some(c => c.cardId === 'major-13') },
    { id: 'solar_success', name: 'Napfényes Siker', description: 'Húzd ki a Nap kártyát', icon: '☀️', tier: 'gold', condition: (u, r) => r.flatMap(x => x.cards).some(c => c.cardId === 'major-19') },
    { id: 'tower_moment', name: 'Villámcsapás', description: 'Húzd ki a Torony kártyát', icon: '⚡', tier: 'gold', condition: (u, r) => r.flatMap(x => x.cards).some(c => c.cardId === 'major-16') },
    { id: 'high_priestess_secret', name: 'Titkok Tudója', description: 'Húzd ki a Főpapnő kártyát', icon: '📖', tier: 'gold', condition: (u, r) => r.flatMap(x => x.cards).some(c => c.cardId === 'major-2') },

    // --- Időhöz kötött ---
    { id: 'night_owl', name: 'Éjszakai Látó', description: 'Végezz jóslást éjfél és hajnali 4 között', icon: '🦉', tier: 'bronze', condition: (u, r) => r.some(x => { const h = new Date(x.date).getHours(); return h >= 0 && h < 4; }) },
    { id: 'early_bird', name: 'Hajnali Harmat', description: 'Végezz jóslást napkeltekor', icon: '🌅', tier: 'bronze', condition: (u, r) => r.some(x => { const h = new Date(x.date).getHours(); return h >= 5 && h < 8; }) },
    { id: 'moon_child', name: 'Holdgyermek', description: 'Jósolj Teliholdkor', icon: '🌕', tier: 'gold', condition: (u, r) => myReadings(u, r).some(x => x.astrology?.moonPhase === 'Telihold') },
    { id: 'new_moon_starter', name: 'Újhold Teremtő', description: 'Jósolj Újholdkor', icon: '🌑', tier: 'gold', condition: (u, r) => myReadings(u, r).some(x => x.astrology?.moonPhase === 'Újhold') },

    // --- Szociális / Haladó ---
    { id: 'collector', name: 'Gyűjtő', description: 'Ments el legalább 10 kedvenc kártyát', icon: '⭐', tier: 'silver', condition: (u) => (u.favoriteCards?.length || 0) >= 10 },
    { id: 'multitasker', name: 'Mindentudó', description: 'Használj 5 különböző típusú kirakást', icon: '💠', tier: 'silver', condition: (u, r) => new Set(myReadings(u, r).map(x => x.spreadId)).size >= 5 },
    { id: 'legendary_streak', name: 'Legenda', description: 'Legyen egy legalább 7 napos húzási sorozatod', icon: '🏆', tier: 'gold', condition: (u, r) => {
        // Egyszerűsített ellenőrzés a leghosszabb sorozatra
        const dates = [...new Set(myReadings(u, r).map(x => new Date(x.date).toDateString()))].sort();
        let max = 0; let curr = 0;
        for(let i=0; i<dates.length; i++) {
            if(i>0) {
                const diff = (new Date(dates[i]).getTime() - new Date(dates[i-1]).getTime()) / (1000*60*60*24);
                if(diff === 1) curr++; else curr = 1;
            } else curr = 1;
            max = Math.max(max, curr);
        }
        return max >= 7;
    }},
    { id: 'deck_master', name: 'Pakli Mester', description: 'Készíts saját paklit a Műhelyben', icon: '🎨', tier: 'silver', condition: (u) => (u.deckCollection?.length || 0) > 0 },
];
