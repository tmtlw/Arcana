
import { WesternHoroscope, ChineseHoroscope } from '../../types';

export const WESTERN_HOROSCOPES: WesternHoroscope[] = [
    {
        id: "libra",
        name: "Waage",
        dates: "23. September - 22. Oktober",
        symbol: "Die Waage",
        rulingPlanet: "Venus",
        houseRuled: "Siebtes",
        element: "Luft",
        mode: "Kardinal",
        keyword: "Ich wäge ab",
        description: "Waage ist das Zeichen der Harmonie und Beziehungen...",
        strengths: ["Kooperativ", "Diplomatisch", "Gnädig"],
        weaknesses: ["Unentschlossen", "Konfrontationsscheu", "Nachtragend"],
        likes: ["Harmonie", "Sanftheit", "Teilen"],
        dislikes: ["Gewalt", "Ungerechtigkeit", "Lautstärke"],
        color: "Blau",
        luckyGem: "Saphir",
        flower: "Rose",
        day: "Freitag",
        numbers: "4, 6, 13, 15, 24",
        mostCompatible: "Löwe, Zwillinge",
        leastCompatible: "Fische, Krebs"
    },
    // ... Placeholders
];

export const CHINESE_HOROSCOPES: ChineseHoroscope[] = [
    // ... Placeholders
];

export const CHINESE_ZODIAC_ORDER = [
    "Ratte", "Büffel", "Tiger", "Hase", "Drache", "Schlange",
    "Pferd", "Ziege", "Affe", "Hahn", "Hund", "Schwein"
];

export const CHINESE_ELEMENTS = [
    { name: "Metall", years: [0, 1], traits: "Mutig, ehrgeizig..." },
    // ...
];
