
import { Spread } from '../types';

export const DEFAULT_SPREADS: Spread[] = [
    { 
        id: 'single', 
        name: 'Napi Húzás', 
        category: 'general',
        description: 'Egyetlen kártya a nap üzenetével.', 
        positions: [{ id: 1, name: 'A Kártya', description: 'A mai nap energiája.', x: 1, y: 1, defaultContext: 'daily' }] 
    },
    { 
        id: 'full-moon-release', 
        name: 'Telihold Elengedés', 
        category: 'calendar',
        description: 'Segít felismerni, mit kell elengedned, hogy tovább léphess.', 
        positions: [
            { id: 1, name: 'Telihold Fénye', description: 'Mi vált most világossá számodra?', x: 2, y: 1, defaultContext: 'general' },
            { id: 2, name: 'Árnyék', description: 'Mi az, ami visszahúz?', x: 1, y: 2, defaultContext: 'advice' },
            { id: 3, name: 'Elengedés', description: 'Mit kell elengedned?', x: 3, y: 2, defaultContext: 'advice' },
            { id: 4, name: 'Új Út', description: 'Mi vár rád a teher letétele után?', x: 2, y: 3, defaultContext: 'general' }
        ] 
    },
    { 
        id: 'new-moon-manifest', 
        name: 'Újhold Teremtés', 
        category: 'calendar',
        description: 'Új célok és szándékok megfogalmazása.', 
        positions: [
            { id: 1, name: 'Mag', description: 'Mi az új célod magja?', x: 2, y: 2, defaultContext: 'general' },
            { id: 2, name: 'Tápanyag', description: 'Mi támogatja a növekedést?', x: 1, y: 3, defaultContext: 'advice' },
            { id: 3, name: 'Akadály', description: 'Mire kell figyelned?', x: 3, y: 3, defaultContext: 'advice' },
            { id: 4, name: 'Virágzás', description: 'A lehetséges eredmény.', x: 2, y: 1, defaultContext: 'general' }
        ] 
    },
    // --- WICCAN SABBATS ---
    {
        id: 'samhain-ancestor',
        name: 'Samhain (Ősök)',
        category: 'calendar',
        description: 'Kapcsolatfelvétel az ősökkel és az elengedés ideje (Október 31).',
        positions: [
            { id: 1, name: 'Az Ősök Üzenete', description: 'Mit üzennek neked az eltávozottak?', x: 2, y: 1 },
            { id: 2, name: 'Elengedés', description: 'Mi az, aminek meg kell halnia az életedben?', x: 1, y: 2 },
            { id: 3, name: 'Megőrzés', description: 'Mit kell magaddal vinned az új évbe?', x: 3, y: 2 },
            { id: 4, name: 'Újjászületés', description: 'Mi születik meg a sötétségből?', x: 2, y: 3 }
        ]
    },
    {
        id: 'yule-light',
        name: 'Yule (Belső Fény)',
        category: 'calendar',
        description: 'A téli napforduló és a fény visszatérése (December 21).',
        positions: [
            { id: 1, name: 'Sötétség', description: 'Mi rejtőzik a mélyben?', x: 2, y: 2 },
            { id: 2, name: 'Szikra', description: 'Mi gyújtja meg a belső lángodat?', x: 2, y: 1 },
            { id: 3, name: 'Ajándék', description: 'Milyen tehetséget hoz a fény?', x: 1, y: 3 },
            { id: 4, name: 'Remény', description: 'Mi vezet a tavasz felé?', x: 3, y: 3 }
        ]
    },
    {
        id: 'imbolc-purification',
        name: 'Imbolc (Tisztulás)',
        category: 'calendar',
        description: 'A megtisztulás és az új tervek ideje (Február 1).',
        positions: [
            { id: 1, name: 'Fagyott Föld', description: 'Mi tart még vissza a múltból?', x: 1, y: 2 },
            { id: 2, name: 'Olvadás', description: 'Hogyan tisztíthatod meg az életed?', x: 2, y: 2 },
            { id: 3, name: 'Csíra', description: 'Milyen új ötlet kezd kibújni?', x: 3, y: 2 },
            { id: 4, name: 'Brigid Áldása', description: 'Mi ad inspirációt?', x: 2, y: 1 }
        ]
    },
    {
        id: 'ostara-balance',
        name: 'Ostara (Egyensúly)',
        category: 'calendar',
        description: 'Tavaszi napéjegyenlőség, az egyensúly és növekedés (Március 20).',
        positions: [
            { id: 1, name: 'Fény', description: 'Mely életterület kap most energiát?', x: 1, y: 1 },
            { id: 2, name: 'Árnyék', description: 'Mivel kell még dolgoznod?', x: 3, y: 1 },
            { id: 3, name: 'Egyensúly', description: 'Hogyan hozhatod harmóniába a kettőt?', x: 2, y: 2 },
            { id: 4, name: 'Növekedés', description: 'Mi indul now virágzásnak?', x: 2, y: 3 }
        ]
    },
    {
        id: 'beltane-passion',
        name: 'Beltane (Szenvedély)',
        category: 'calendar',
        description: 'A termékenység, a tűz és a szerelem ünnepe (Május 1).',
        positions: [
            { id: 1, name: 'Vágy', description: 'Mi az, amire a szíved igazán vágyik?', x: 2, y: 1 },
            { id: 2, name: 'Akadály', description: 'Mi gátolja a szenvedélyedet?', x: 1, y: 2 },
            { id: 3, name: 'Tűz', description: 'Mi ad erőt a cselekvéshez?', x: 3, y: 2 },
            { id: 4, name: 'Egyesülés', description: 'Hogyan teljesedhetsz ki?', x: 2, y: 3 }
        ]
    },
    {
        id: 'litha-power',
        name: 'Litha (Erő)',
        category: 'calendar',
        description: 'Nyári napforduló, a Nap erejének csúcspontja (Június 21).',
        positions: [
            { id: 1, name: 'A Nap', description: 'Miben vagy most a legerősebb?', x: 2, y: 1 },
            { id: 2, name: 'Cselekvés', description: 'Mit kell most megvalósítanod?', x: 1, y: 2 },
            { id: 3, name: 'Bőség', description: 'Miért lehetsz hálás?', x: 3, y: 2 },
            { id: 4, name: 'Fordulópont', description: 'Hogyan őrizd meg ezt az energiát?', x: 2, y: 3 }
        ]
    },
    {
        id: 'lammas-harvest',
        name: 'Lammas (Aratás)',
        category: 'calendar',
        description: 'Az első aratás, a hála és a számbavétel (Augusztus 1).',
        positions: [
            { id: 1, name: 'Termés', description: 'Mit értél el eddig idén?', x: 2, y: 1 },
            { id: 2, name: 'Munka', description: 'Mi igényel még erőfeszítést?', x: 1, y: 2 },
            { id: 3, name: 'Hála', description: 'Kinek vagy minek tartozol köszönettel?', x: 3, y: 2 },
            { id: 4, name: 'Kenyér', description: 'Mi táplálja a jövődet?', x: 2, y: 3 }
        ]
    },
    {
        id: 'mabon-reflection',
        name: 'Mabon (Reflexió)',
        category: 'calendar',
        description: 'Őszi napéjegyenlőség, a felkészülés a sötétségre (Szeptember 21).',
        positions: [
            { id: 1, name: 'Múlt', description: 'Mit hagysz magad mögött?', x: 1, y: 2 },
            { id: 2, name: 'Jelen', description: 'Hol tartasz most az egyensúlyban?', x: 2, y: 2 },
            { id: 3, name: 'Jövő', description: 'Mire kell felkészülnöd?', x: 3, y: 2 },
            { id: 4, name: 'Bölcsesség', description: 'Mit tanultál ebben a ciklusban?', x: 2, y: 1 }
        ]
    },
    // --- ZODIAC SEASONS ---
    {
        id: 'season-aries',
        name: 'Kos Szezon (Tűz)',
        category: 'calendar',
        description: 'Az újrakezdés és az önérvényesítés energiái.',
        positions: [
            { id: 1, name: 'A Szikra', description: 'Milyen új dolog akar elindulni?', x: 2, y: 1 },
            { id: 2, name: 'A Bátor Lépés', description: 'Mit kell most megtenned?', x: 1, y: 2 },
            { id: 3, name: 'Félelem Legyőzése', description: 'Mi áll az utadban?', x: 3, y: 2 }
        ]
    },
    {
        id: 'season-taurus',
        name: 'Bika Szezon (Föld)',
        category: 'calendar',
        description: 'A stabilitás és az anyagi értékek ideje.',
        positions: [
            { id: 1, name: 'Érték', description: 'Mit kell most megvédened?', x: 2, y: 1 },
            { id: 2, name: 'Stabilitás', description: 'Mi ad biztonságot?', x: 1, y: 2 },
            { id: 3, name: 'Érzékiség', description: 'Hogyan élvezheted az életet?', x: 3, y: 2 }
        ]
    },
    {
        id: 'season-gemini',
        name: 'Ikrek Szezon (Levegő)',
        category: 'calendar',
        description: 'A kommunikáció és a kíváncsiság ideje.',
        positions: [
            { id: 1, name: 'Az Üzenet', description: 'Mit kell most kimondanod?', x: 1, y: 1 },
            { id: 2, name: 'Kettősség', description: 'Milyen ellentéteket kell kibékítened?', x: 3, y: 1 },
            { id: 3, name: 'Kapcsolat', description: 'Kihez kell közelebb kerülnöd?', x: 2, y: 2 }
        ]
    },
    {
        id: 'season-cancer',
        name: 'Rák Szezon (Víz)',
        category: 'calendar',
        description: 'Az érzelmek és az otthon biztonsága.',
        positions: [
            { id: 1, name: 'A Fészek', description: 'Mi történik a magánéletedben?', x: 2, y: 1 },
            { id: 2, name: 'Érzékenység', description: 'Mire kell érzelmileg figyelned?', x: 1, y: 2 },
            { id: 3, name: 'Gondoskodás', description: 'Kit vagy mit kell táplálnod?', x: 3, y: 2 }
        ]
    },
    {
        id: 'season-leo',
        name: 'Oroszlán Szezon (Tűz)',
        category: 'calendar',
        description: 'Az önkifejezés és a kreatív erő csúcsa.',
        positions: [
            { id: 1, name: 'A Színpad', description: 'Hogyan mutasd meg magad?', x: 2, y: 1 },
            { id: 2, name: 'Szív Ereje', description: 'Mi tesz igazán boldoggá?', x: 1, y: 2 },
            { id: 3, name: 'Nemeslelkűség', description: 'Hogyan segíthetsz másokat?', x: 3, y: 2 }
        ]
    },
    {
        id: 'season-virgo',
        name: 'Szűz Szezon (Föld)',
        category: 'calendar',
        description: 'A rendszerezés és az egészség ideje.',
        positions: [
            { id: 1, name: 'Tisztítás', description: 'Mit kell kiszelektálnod?', x: 2, y: 1 },
            { id: 2, name: 'Részletek', description: 'Mire kell jobban fókuszálnod?', x: 1, y: 2 },
            { id: 3, name: 'Szolgálat', description: 'Hogyan lehetsz hasznos?', x: 3, y: 2 }
        ]
    },
    {
        id: 'season-libra',
        name: 'Mérleg Szezon (Levegő)',
        category: 'calendar',
        description: 'A harmónia és a kapcsolatok egyensúlya.',
        positions: [
            { id: 1, name: 'Mérleg', description: 'Mi van egyensúlyban?', x: 2, y: 1 },
            { id: 2, name: 'A Másik', description: 'Mit tükröznek neked a kapcsolataid?', x: 1, y: 2 },
            { id: 3, name: 'Szépség', description: 'Hogyan teremthetsz harmóniát?', x: 3, y: 2 }
        ]
    },
    {
        id: 'season-scorpio',
        name: 'Skorpió Szezon (Víz)',
        category: 'calendar',
        description: 'A mélység és az átalakulás ideje.',
        positions: [
            { id: 1, name: 'A Titok', description: 'Mi rejtőzik a felszín alatt?', x: 2, y: 1 },
            { id: 2, name: 'Főnix', description: 'Mit kell elengedned, hogy megújulj?', x: 1, y: 2 },
            { id: 3, name: 'Intenzitás', description: 'Hová irányítsd az energiád?', x: 3, y: 2 }
        ]
    },
    {
        id: 'season-sagittarius',
        name: 'Nyilas Szezon (Tűz)',
        category: 'calendar',
        description: 'A kaland és a bölcsesség keresése.',
        positions: [
            { id: 1, name: 'A Nyíl', description: 'Mi a távoli célod?', x: 2, y: 1 },
            { id: 2, name: 'Horizont', description: 'Milyen új tudás vár rád?', x: 1, y: 2 },
            { id: 3, name: 'Optimismus', description: 'Mi ad hitet a jövőhöz?', x: 3, y: 2 }
        ]
    },
    {
        id: 'season-capricorn',
        name: 'Bak Szezon (Föld)',
        category: 'calendar',
        description: 'A kitartás és a társadalmi felelősség ideje.',
        positions: [
            { id: 1, name: 'A Hegy', description: 'Milyen csúcsra törsz most?', x: 2, y: 1 },
            { id: 2, name: 'Fegyelem', description: 'Milyen rutint kell bevezetned?', x: 1, y: 2 },
            { id: 3, name: 'Örökség', description: 'Mit építesz hosszú távon?', x: 3, y: 2 }
        ]
    },
    {
        id: 'season-aquarius',
        name: 'Vízöntő Szezon (Levegő)',
        category: 'calendar',
        description: 'Az újítás és a közösségi fejlődés ideje.',
        positions: [
            { id: 1, name: 'Látomás', description: 'Milyen formabontó ötleted van?', x: 2, y: 1 },
            { id: 2, name: 'Szabadság', description: 'Milyen láncot kell elvágnod?', x: 1, y: 2 },
            { id: 3, name: 'Hálózat', description: 'Hogyan kapcsolódhatsz a csoporthoz?', x: 3, y: 2 }
        ]
    },
    {
        id: 'season-pisces',
        name: 'Halak Szezon (Víz)',
        category: 'calendar',
        description: 'Az álomvilág és az isteni egység ideje.',
        positions: [
            { id: 1, name: 'Az Óceán', description: 'Mit súgnak az álmaid?', x: 2, y: 1 },
            { id: 2, name: 'Feloldódás', description: 'Mit kell átadnod az Univerzumnak?', x: 1, y: 2 },
            { id: 3, name: 'Empátia', description: 'Hogyan gyógyíthatod a szívedet?', x: 3, y: 2 }
        ]
    },
    { 
        id: 'three-card', 
        name: 'Múlt, Jelen, Jövő', 
        category: 'general',
        description: 'Klasszikus hármas idővonal.', 
        positions: [
            { id: 1, name: 'Múlt', description: 'Ami a jelenlegi helyzethez vezetett.', x: 1, y: 1 }, 
            { id: 2, name: 'Jelen', description: 'A jelenlegi helyzet.', x: 2, y: 1 }, 
            { id: 3, name: 'Jövő', description: 'A várható kimenetel.', x: 3, y: 1 }
        ] 
    },
    { 
        id: 'celtic-cross', 
        name: 'Kelta Kereszt', 
        category: 'general',
        description: 'Részletes helyzetelemzés tíz kártyával.', 
        positions: [
            { id: 1, name: 'Jelen', description: 'A kérdező jelenlegi állapota.', x: 2, y: 3 }, 
            { id: 2, name: 'Kihívás', description: 'Ami akadályoz vagy segít (keresztbe tesz).', x: 2, y: 3, rotation: 90 },
            { id: 3, name: 'Tudatos', description: 'Amire a kérdező fókuszál (korona).', x: 2, y: 1 }, 
            { id: 4, name: 'Tudattalan', description: 'Ami a felszín alatt van (gyökér).', x: 2, y: 5 }, 
            { id: 5, name: 'Múlt', description: 'A közelmúlt eseményei.', x: 1, y: 3 }, 
            { id: 6, name: 'Jövő', description: 'A közeli jövő.', x: 3, y: 3 }, 
            { id: 7, name: 'Én', description: 'A kérdező hozzáállása.', x: 5, y: 5 }, 
            { id: 8, name: 'Környezet', description: 'Külső hatások.', x: 5, y: 4 }, 
            { id: 9, name: 'Remények', description: 'Belső vágyak és aggodalmak.', x: 5, y: 3 }, 
            { id: 10, name: 'Kimenetel', description: 'A végső eredmény.', x: 5, y: 1 }
        ] 
    },
    {
        id: 'the-cross', 
        name: 'A Kereszt',
        category: 'advice',
        description: 'Tömör útmutatás: hogyan állj egy adott dologhoz.',
        positions: [
            { id: 1, name: 'A Téma', description: 'Erről van szó.', x: 1, y: 2, defaultContext: 'general' },
            { id: 2, name: 'Kerüld el', description: 'Amit most nem szabad tenned.', x: 3, y: 2, defaultContext: 'advice' },
            { id: 3, name: 'Tedd ezt', description: 'A helyes cselekvés útja.', x: 2, y: 1, defaultContext: 'advice' },
            { id: 4, name: 'Eredmény', description: 'Ahová ez a hozzáállás vezet.', x: 2, y: 3, defaultContext: 'general' }
        ]
    },
    {
        id: 'blind-spot',
        name: 'A Vakfolt',
        category: 'self',
        description: 'Önismereti tükör: mit látok én, és mit látnak mások?',
        positions: [
            { id: 1, name: 'Nyílt Én', description: 'Ismert mindenki számára.', x: 2, y: 2 },
            { id: 2, name: 'Vakfolt', description: 'Mások látják, te nem.', x: 3, y: 2 },
            { id: 3, name: 'Rejtett Én', description: 'Te tudod, mások nem.', x: 2, y: 3 },
            { id: 4, name: 'Ismeretlen', description: 'Tudattalan erők.', x: 3, y: 3 }
        ]
    },
    {
        id: 'the-partner',
        name: 'A Partner',
        category: 'love',
        description: 'Párkapcsolati elemzés: mit gondolunk és érzünk.',
        positions: [
            { id: 1, name: 'A Helyzet', description: 'A kapcsolat jelenlegi fő témája.', x: 3, y: 3 },
            { id: 7, name: 'Te (Tudat)', description: 'Ahogy te látod a társad/kapcsolatot.', x: 1, y: 1, defaultContext: 'love' },
            { id: 6, name: 'Te (Szív)', description: 'Amit a szíved mélyén érzel.', x: 1, y: 3, defaultContext: 'love' },
            { id: 5, name: 'Te (Külvilág)', description: 'Ahogy viselkedsz.', x: 1, y: 5, defaultContext: 'love' },
            { id: 2, name: 'Ő (Tudat)', description: 'Ahogy ő lát téged/kapcsolatot.', x: 5, y: 1, defaultContext: 'love' },
            { id: 3, name: 'Ő (Szív)', description: 'Amit ő érez.', x: 5, y: 3, defaultContext: 'love' },
            { id: 4, name: 'Ő (Külvilág)', description: 'Ahogy ő viselkedik.', x: 5, y: 5, defaultContext: 'love' }
        ]
    },
    {
        id: 'the-decision',
        name: 'A Döntés',
        category: 'decision',
        description: 'Két út összehasonlítása.',
        positions: [
            { id: 7, name: 'Háttér', description: 'A döntés háttere, miért merült fel?', x: 1, y: 2 },
            { id: 3, name: 'A: Kezdet', description: 'Ha ezt választod: Hogy indul?', x: 2, y: 1 },
            { id: 1, name: 'A: Folyamat', description: 'Mi történik közben?', x: 3, y: 1 },
            { id: 5, name: 'A: Eredmény', description: 'Hová vezet ez az út?', x: 4, y: 1 },
            { id: 4, name: 'B: Kezdet', description: 'Ha azt választod: Hogy indul?', x: 2, y: 3 },
            { id: 2, name: 'B: Folyamat', description: 'Mi történik közben?', x: 3, y: 3 },
            { id: 6, name: 'B: Eredmény', description: 'Hová vezet az az út?', x: 4, y: 3 }
        ]
    },
    {
        id: 'the-way',
        name: 'Az Út',
        category: 'career',
        description: 'Hogyan jutok el a célomhoz? Helyzetkép és tanács.',
        positions: [
            { id: 1, name: 'A Cél', description: 'Erről van szó.', x: 1, y: 3 },
            { id: 2, name: 'Tudatos', description: 'Racionális hozzáállásod.', x: 2, y: 2 },
            { id: 3, name: 'Tudattalan', description: 'Érzelmi hozzáállásod.', x: 2, y: 4 },
            { id: 4, name: 'Külső', description: 'Ahogy mások látják.', x: 3, y: 2 },
            { id: 5, name: 'Javaslat', description: 'Mit tegyél?', x: 3, y: 4, defaultContext: 'advice' },
            { id: 6, name: 'Új álláspont', description: 'Ahogy majd látni fogod.', x: 4, y: 3 },
            { id: 7, name: 'Végkifejlet', description: 'Hová vezet ez az út?', x: 5, y: 3 }
        ]
    },
    {
        id: 'next-step',
        name: 'A Következő Lépés',
        category: 'advice',
        description: 'Egyszerű útmutatás a jelenlegi helyzetre.',
        positions: [
            { id: 1, name: 'Kiindulás', description: 'Hol állsz most?', x: 1, y: 2 },
            { id: 2, name: 'Most nem', description: 'Mi az, ami most nem segít?', x: 2, y: 1, defaultContext: 'advice' },
            { id: 3, name: 'Most igen', description: 'Mi az, ami most fontos?', x: 2, y: 3, defaultContext: 'advice' },
            { id: 4, name: 'Cél', description: 'Hová vezet a következő lépés?', x: 3, y: 2 }
        ]
    }
];
