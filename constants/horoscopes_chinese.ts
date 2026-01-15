import { ChineseHoroscope } from '../types';

export const CHINESE_HOROSCOPES: ChineseHoroscope[] = [
    {
        id: "rat",
        name: "Patkány",
        luckyNumbers: "2, 3",
        unluckyNumbers: "5, 9",
        luckyFlowers: "Liliom, Afrikai ibolya",
        luckyColors: "Kék, Arany, Zöld",
        unluckyColors: "Sárga, Barna",
        luckyDirections: "Nyugat, Északnyugat, Délnyugat",
        unluckyDirections: "Dél, Délkelet",
        loveCompatibility: {
            best: "Bivaly, Nyúl, Sárkány",
            worst: "Ló, Kakas"
        },
        career: "Adminisztrátor, igazgató, menedzser, vállalkozó, műsorszolgáltató, író, zenész, stand-up komikus, politikus, ügyvéd, kutató, autóversenyző.",
        description: "A Patkányok gyors észjárásúak, találékonyak és okosak, de hiányzik belőlük a bátorság. Gazdag képzelőerővel és éles megfigyelőképességgel rendelkeznek, így jól ki tudják használni a különböző lehetőségeket. Az 1. helyet foglalják el a 12 kínai csillagjegy között.",
        famousPeople: "Károly herceg (Föld Patkány), Diego Maradona (Fém Patkány), Jude Law (Víz Patkány), Avril Lavigne (Fa Patkány), Tom Holland (Tűz Patkány)"
    },
    {
        id: "ox",
        name: "Bivaly",
        luckyNumbers: "1, 4",
        unluckyNumbers: "5, 6",
        luckyFlowers: "Tulipán, Barackvirág",
        luckyColors: "Fehér, Sárga, Zöld",
        unluckyColors: "Kék",
        luckyDirections: "Észak, Dél",
        unluckyDirections: "Délnyugat",
        loveCompatibility: { best: "Patkány, Kígyó, Kakas", worst: "Tigris, Ló, Kecske" },
        career: "Mezőgazdaság, gyártás, gyógyszerészet, mechanika, mérnöki tudományok, művészet, politika, ingatlanközvetítés, belsőépítészet, festészet, ácsmunka.",
        description: "A Bivalyok szorgalmasak és megbízhatóak.",
        famousPeople: ""
    },
    {
        id: "tiger",
        name: "Tigris",
        luckyNumbers: "1, 3, 4",
        unluckyNumbers: "6, 7, 8",
        luckyFlowers: "Liliom, Cinerária",
        luckyColors: "Kék, Szürke, Narancs",
        unluckyColors: "Barna",
        luckyDirections: "Kelet, Észak, Dél",
        unluckyDirections: "Délnyugat",
        loveCompatibility: { best: "Sárkány, Ló, Disznó", worst: "Bivaly, Tigris, Kígyó, Majom" },
        career: "Reklámügynök, irodai menedzser, utazási ügynök, színész, író, művész, pilóta, légiutas-kísérő, zenész, komikus, sofőr.",
        description: "A Tigrisek bátrak és magabiztosak.",
        famousPeople: ""
    },
    {
        id: "rabbit",
        name: "Nyúl",
        luckyNumbers: "3, 4, 6",
        unluckyNumbers: "1, 7, 8",
        luckyFlowers: "Árvácska, Liliom",
        luckyColors: "Piros, Rózsaszín, Lila, Kék",
        unluckyColors: "Sötétbarna, Sötétsárga, Fehér",
        luckyDirections: "Kelet, Dél, Északnyugat",
        unluckyDirections: "Észak, Nyugat, Délnyugat",
        loveCompatibility: { best: "Patkány, Kecske, Majom, Kutya, Disznó", worst: "Kígyó, Kakas" },
        career: "Oktatás, vallás, egészségügy, gyógyászat, kultúra, rendőrség, igazságszolgáltatás, politika.",
        description: "A Nyulak csendesek, elegánsak és kedvesek.",
        famousPeople: ""
    },
    {
        id: "dragon",
        name: "Sárkány",
        luckyNumbers: "1, 6, 7",
        unluckyNumbers: "3, 8",
        luckyFlowers: "Sárkányvirág",
        luckyColors: "Arany, Ezüst, Szürkésfehér",
        unluckyColors: "Kék, Zöld",
        luckyDirections: "Kelet, Észak, Dél",
        unluckyDirections: "Északnyugat",
        loveCompatibility: { best: "Patkány, Tigris, Kígyó", worst: "Bivaly, Kecske, Kutya" },
        career: "Újságíró, tanár, feltaláló, menedzser, számítógépes elemző, jogász, mérnök, építész, bróker, értékesítő.",
        description: "A Sárkányok erősek és függetlenek.",
        famousPeople: ""
    },
    {
        id: "snake",
        name: "Kígyó",
        luckyNumbers: "2, 8, 9",
        unluckyNumbers: "1, 6, 7",
        luckyFlowers: "Orchidea, Kaktusz",
        luckyColors: "Fekete, Piros, Sárga",
        unluckyColors: "Barna, Arany, Fehér",
        luckyDirections: "Délnyugat, Dél",
        unluckyDirections: "Északkelet, Északnyugat",
        loveCompatibility: { best: "Sárkány, Kakas", worst: "Tigris, Nyúl, Kígyó, Kecske, Disznó" },
        career: "Tudós, elemző, nyomozó, festő, fazekas, ékszerész, asztrológus, bűvész, dietetikus.",
        description: "A Kígyók bölcsek és titokzatosak.",
        famousPeople: ""
    },
    {
        id: "horse",
        name: "Ló",
        luckyNumbers: "2, 3, 7",
        unluckyNumbers: "1, 5, 6",
        luckyFlowers: "Kála, Jázmin",
        luckyColors: "Sárga, Zöld",
        unluckyColors: "Kék, Fehér",
        luckyDirections: "Kelet, Nyugat, Dél",
        unluckyDirections: "Észak",
        loveCompatibility: { best: "Tigris, Kecske, Kutya", worst: "Patkány, Bivaly, Kakas" },
        career: "Publicista, értékesítési képviselő, újságíró, nyelvoktató, fordító, csapos, előadóművész, utazásszervező, könyvtáros, pilóta.",
        description: "A Lovak energikusak és szabadlelkűek.",
        famousPeople: ""
    },
    {
        id: "goat",
        name: "Kecske",
        luckyNumbers: "2, 7",
        unluckyNumbers: "4, 9",
        luckyFlowers: "Szegfű, Kankalin",
        luckyColors: "Zöld, Piros, Lila",
        unluckyColors: "Arany, Kávé",
        luckyDirections: "Észak, Dél",
        unluckyDirections: "Délnyugat",
        loveCompatibility: { best: "Nyúl, Ló, Disznó", worst: "Bivaly, Kutya" },
        career: "Színész, festő, zenész, tájépítész, sminkes, táncos, író, szerkesztő, általános iskolai tanár, gyermekorvos.",
        description: "A Kecskék szelídek és együttérzők.",
        famousPeople: ""
    },
    {
        id: "monkey",
        name: "Majom",
        luckyNumbers: "4, 9",
        unluckyNumbers: "2, 7",
        luckyFlowers: "Krizantém",
        luckyColors: "Fehér, Kék, Arany",
        unluckyColors: "Piros, Rózsaszín",
        luckyDirections: "Észak, Északnyugat, Nyugat",
        unluckyDirections: "Dél, Délkelet",
        loveCompatibility: { best: "Patkány, Sárkány", worst: "Tigris, Kígyó, Disznó" },
        career: "Bankár, tudós, nyelvész, tanár, feltaláló, könyvelő, mérnök, tőzsdeügynök, rendező, ékszerész.",
        description: "A Majmok szellemesek és intelligensek.",
        famousPeople: ""
    },
    {
        id: "rooster",
        name: "Kakas",
        luckyNumbers: "5, 7, 8",
        unluckyNumbers: "1, 3, 9",
        luckyFlowers: "Kardvirág, Kakastaréj",
        luckyColors: "Arany, Barna, Sárga",
        unluckyColors: "Fehér, Zöld",
        luckyDirections: "Dél, Délkelet",
        unluckyDirections: "Kelet",
        loveCompatibility: { best: "Bivaly, Kígyó", worst: "Nyúl, Kakas, Kutya" },
        career: "Értékesítő, étterem-tulajdonos, fodrász, PR-szakember, gazdálkodó, sportoló, tanár, pincér, újságíró, utazási író.",
        description: "A Kakasok megfigyelők és szorgalmasak.",
        famousPeople: ""
    },
    {
        id: "dog",
        name: "Kutya",
        luckyNumbers: "3, 4, 9",
        unluckyNumbers: "1, 6, 7",
        luckyFlowers: "Rózsa, Orchidea",
        luckyColors: "Piros, Zöld, Lila",
        unluckyColors: "Kék, Fehér, Arany",
        luckyDirections: "Kelet, Dél, Északkelet",
        unluckyDirections: "Délkelet",
        loveCompatibility: { best: "Nyúl", worst: "Sárkány, Kecske, Kakas" },
        career: "Rendőrtiszt, tudós, tanácsadó, belsőépítész, professzor, politikus, pap, nővér, hivatalnok, bíró.",
        description: "A Kutyák hűségesek és őszinték.",
        famousPeople: ""
    },
    {
        id: "pig",
        name: "Disznó",
        luckyNumbers: "2, 5, 8",
        unluckyNumbers: "1, 7",
        luckyFlowers: "Hortenzia, Kancsóka",
        luckyColors: "Sárga, Szürke, Barna, Arany",
        unluckyColors: "Piros, Kék, Zöld",
        luckyDirections: "Kelet, Délnyugat",
        unluckyDirections: "Délkelet",
        loveCompatibility: { best: "Tigris, Nyúl, Kecske", worst: "Kígyó, Majom" },
        career: "Szórakoztatóipar, vendéglátás, orvostudomány, állatorvoslás, divatvilág.",
        description: "A Disznók szorgalmasak, együttérzők és nagyvonalúak.",
        famousPeople: ""
    }
];

export const CHINESE_ZODIAC_ORDER = [
    "Patkány", "Bivaly", "Tigris", "Nyúl", "Sárkány", "Kígyó",
    "Ló", "Kecske", "Majom", "Kakas", "Kutya", "Disznó"
];

export const CHINESE_ELEMENTS = [
    { name: "Fém", years: [0, 1], traits: "Bátor, ambiciózus, független, elszánt, magas erkölcsi mérce. Gyengeségek: Rugalmatlan, túl kritikus, irányító." },
    { name: "Víz", years: [2, 3], traits: "Intuitív, alkalmazkodó, empatikus, diplomata, megfigyelő. Gyengeségek: Túl passzív, függő, határozatlan." },
    { name: "Fa", years: [4, 5], traits: "Türelmes, megértő, melegszívű, rugalmas, stabil. Gyengeségek: Határok rossz kezelése, túlhajszoltság." },
    { name: "Tűz", years: [6, 7], traits: "Szenvedélyes, lelkes, kreatív, karizmatikus, kalandvágyó. Gyengeségek: Türelmetlen, agresszív, impulzív." },
    { name: "Föld", years: [8, 9], traits: "Logikus, felelősségteljes, őszinte, hűséges, erős. Gyengeségek: Túlzottan védelmező, makacs, kockázatkerülő." }
];

export function getChineseZodiac(year: number): { sign: string, element: string } {
    const baseYear = 1900; // Rat
    const offset = (year - baseYear) % 12;
    const signIndex = offset >= 0 ? offset : 12 + offset;
    const sign = CHINESE_ZODIAC_ORDER[signIndex];

    const lastDigit = year % 10;
    const element = CHINESE_ELEMENTS.find(e => e.years.includes(lastDigit))?.name || "Ismeretlen";

    return { sign, element };
}
