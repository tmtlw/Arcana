
import { Card } from '../types';

// Pythagorean Table
const LETTER_VALUES: Record<string, number> = {
    'a': 1, 'j': 1, 's': 1, 'á': 1,
    'b': 2, 'k': 2, 't': 2,
    'c': 3, 'l': 3, 'u': 3, 'ú': 3, 'ü': 3, 'ű': 3,
    'd': 4, 'm': 4, 'v': 4,
    'e': 5, 'n': 5, 'w': 5, 'é': 5,
    'f': 6, 'o': 6, 'x': 6, 'ó': 6, 'ö': 6, 'ő': 6,
    'g': 7, 'p': 7, 'y': 7,
    'h': 8, 'q': 8, 'z': 8,
    'i': 9, 'r': 9, 'í': 9
};

const VOWELS = ['a', 'e', 'i', 'o', 'u', 'á', 'é', 'í', 'ó', 'ö', 'ő', 'ú', 'ü', 'ű'];

export const NumerologyService = {
    
    reduceNumber: (num: number): number => {
        // Keep Master Numbers 11, 22, 33 (though in Tarot we usually map up to 21/22)
        if (num === 11 || num === 22 || num === 33) return num;
        
        let sum = num;
        while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
            sum = sum.toString().split('').reduce((a, b) => a + parseInt(b), 0);
        }
        return sum;
    },

    // 1. Life Path (Sorsút) - From Birth Date
    calculateLifePath: (birthDate: string): number => {
        if (!birthDate) return 0;
        const clean = birthDate.replace(/-/g, '');
        // Sum each digit
        let sum = clean.split('').reduce((a, b) => a + parseInt(b), 0);
        return NumerologyService.reduceNumber(sum);
    },

    // Calculate sum of a string based on mapping
    calculateStringSum: (str: string): number => {
        const clean = str.toLowerCase().replace(/[^a-zgwáéíóöőúüű]/g, '');
        let sum = 0;
        for (const char of clean) {
            sum += LETTER_VALUES[char] || 0;
        }
        return sum;
    },

    // 2. Expression / Destiny (Teljes Név)
    calculateDestiny: (fullName: string): number => {
        const sum = NumerologyService.calculateStringSum(fullName);
        return NumerologyService.reduceNumber(sum);
    },

    // 3. Soul Urge (Szív Vágya) - Vowels
    calculateSoulUrge: (fullName: string): number => {
        const clean = fullName.toLowerCase().replace(/[^a-zgwáéíóöőúüű]/g, '');
        let sum = 0;
        for (const char of clean) {
            if (VOWELS.includes(char)) {
                sum += LETTER_VALUES[char] || 0;
            }
        }
        return NumerologyService.reduceNumber(sum);
    },

    // 4. Personality (Személyiség) - Consonants
    calculatePersonality: (fullName: string): number => {
        const clean = fullName.toLowerCase().replace(/[^a-zgwáéíóöőúüű]/g, '');
        let sum = 0;
        for (const char of clean) {
            if (!VOWELS.includes(char)) {
                sum += LETTER_VALUES[char] || 0;
            }
        }
        return NumerologyService.reduceNumber(sum);
    },

    // Helper: Map number to Major Arcana
    // Note: 22 usually mapped to The Fool (0) or kept as World (21) depending on system. 
    // Here we map 1-21 directly. 22 -> 0 (Fool). 
    // Master numbers 11, 22, 33 often have special meanings, but we map them to Tarot archetypes.
    getTarotCardForNumber: (num: number, deck: Card[]): Card | undefined => {
        let targetNum = num;
        if (num === 22) targetNum = 0; // Fool
        if (num > 21 && num !== 22) {
            // Reduce further for Tarot mapping if it's like 33 -> 6
            targetNum = NumerologyService.reduceNumber(num); 
            if (targetNum > 21) targetNum = targetNum.toString().split('').reduce((a, b) => a + parseInt(b), 0);
        }
        
        return deck.find(c => c.arcana === 'Major' && c.number === targetNum);
    },

    getDescriptionForType: (type: 'lifepath' | 'destiny' | 'soul' | 'personality'): string => {
        switch(type) {
            case 'lifepath': return 'A Sorsút Szám a születési dátumodból ered. Ez mutatja meg az életed fő leckéit, a kihívásokat és az utat, amit be kell járnod.';
            case 'destiny': return 'A Sorsszám (Kifejezés) a teljes születési nevedből számítódik. Azt mutatja meg, milyen tehetségekkel és képességekkel érkeztél a világra, és mit kell megvalósítanod.';
            case 'soul': return 'A Szív Vágya (Lélek) szám a neved magánhangzóiból ered. Ez a legbelső motivációidat, titkos vágyaidat és érzelmi szükségleteidet tárja fel.';
            case 'personality': return 'A Személyiség szám a neved mássalhangzóiból ered. Azt mutatja, milyennek látnak mások, és milyen "álarcot" viselsz a külvilág felé.';
            default: return '';
        }
    }
};