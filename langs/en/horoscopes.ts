
import { WesternHoroscope, ChineseHoroscope } from '../../types';

export const WESTERN_HOROSCOPES: WesternHoroscope[] = [
    {
        id: "libra",
        name: "Libra",
        dates: "September 23 - October 22",
        symbol: "The Scales",
        rulingPlanet: "Venus",
        houseRuled: "Seventh",
        element: "Air",
        mode: "Cardinal",
        keyword: "I balance",
        description: "Libra is the sign of harmony and relationships...",
        strengths: ["Cooperative", "Diplomatic", "Gracious", "Fair-minded", "Social"],
        weaknesses: ["Indecisive", "Avoids confrontation", "Will carry a grudge", "Self-pity", "Rash"],
        likes: ["Harmony", "Gentleness", "Sharing with others", "The outdoors"],
        dislikes: ["Violence", "Injustice", "Loudmouths", "Conformity"],
        color: "Blue",
        luckyGem: "Sapphire",
        flower: "Rose",
        day: "Friday",
        numbers: "4, 6, 13, 15, 24",
        mostCompatible: "Leo, Gemini, Sagittarius",
        leastCompatible: "Pisces, Cancer, Taurus"
    },
    // ... (Placeholder for other signs)
];

export const CHINESE_HOROSCOPES: ChineseHoroscope[] = [
    {
        id: "rat",
        name: "Rat",
        luckyNumbers: "2, 3",
        unluckyNumbers: "5, 9",
        luckyFlowers: "Lily, African Violet",
        luckyColors: "Blue, Gold, Green",
        unluckyColors: "Yellow, Brown",
        luckyDirections: "West, Northwest, Southwest",
        unluckyDirections: "South, Southeast",
        loveCompatibility: {
            best: "Ox, Rabbit, Dragon",
            worst: "Horse, Rooster"
        },
        career: "Administrator, director, manager, entrepreneur...",
        description: "Rats are quick-witted, resourceful, and smart but lack courage.",
        famousPeople: "Prince Charles (Earth Rat), Diego Maradona (Metal Rat)..."
    },
    // ... Placeholders
];

export const CHINESE_ZODIAC_ORDER = [
    "Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake",
    "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"
];

export const CHINESE_ELEMENTS = [
    { name: "Metal", years: [0, 1], traits: "Brave, ambitious, independent..." },
    { name: "Water", years: [2, 3], traits: "Intuitive, adaptable, empathetic..." },
    { name: "Wood", years: [4, 5], traits: "Patient, understanding, warm-hearted..." },
    { name: "Fire", years: [6, 7], traits: "Passionate, enthusiastic, creative..." },
    { name: "Earth", years: [8, 9], traits: "Logical, responsible, honest..." }
];
