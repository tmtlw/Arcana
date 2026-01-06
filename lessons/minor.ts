import { Lesson } from '../types';

export const MINOR_LESSONS: Lesson[] = [
    {
        id: 'lesson-minor-1',
        title: 'A Tűz és a Víz: Botok és Kelyhek',
        description: 'A kreatív akarat és az érzelmi mélység felfedezése a kártyák tükrében.',
        category: 'minor',
        difficulty: 'beginner',
        xpReward: 50,
        icon: '🔥',
        relatedCards: ['wands-1', 'wands-10', 'cups-1', 'cups-10'],
        quizQuestions: [
            { statement: "A Botok (Wands) a Tűz elemet és a cselekvést képviselik.", isTrue: true },
            { statement: "A Kelyhek (Cups) a racionális gondolkodás kártyái.", isTrue: false },
            { statement: "A Kelyhek Tízes a családi boldogság és beteljesülés lapja.", isTrue: true },
            { statement: "A Botok Ötös a belső békét és nyugalmat jelképezi.", isTrue: false },
            { statement: "A Kelyhek Ásza egy új érzelmi lehetőség magvát jelenti.", isTrue: true }
        ],
        content: `A Kis Árkánum ezen két színe az aktív-férfias (Botok) és a befogadó-női (Kelyhek) energiákat mutatja be.

# 🪵 Botok (Wands) – A Tűz Útja
A Botok a növekedésről, az ambícióról és a bennünk lévő életerőről szólnak.
* **Ász-3:** Az inspiráció megérkezése és az első tervek (Botok 3 - Biztos kilátások).
* **4-7:** A közösségi élet és a kihívások (Botok 4 - Ünneplés, Botok 5 - Versengés).
* **8-10:** A folyamatok felgyorsulása és a felelősség súlya (Botok 8 - Sebesség, Botok 10 - Túlterheltség).
* **Megerősítés:** "Cselekszem az álmaimért, és tüzet viszek a világba."

# 🍷 Kelyhek (Cups) – A Víz Útja
A Kelyhek a szív ügyeiről, az intuícióról és a kapcsolatokról mesélnek.
* **Ász-3:** A szerelem ébredése és az öröm megosztása (Kelyhek 2 - Kapcsolódás, Kelyhek 3 - Ünneplés).
* **4-7:** Belső válságok és illúziók (Kelyhek 4 - Csömör, Kelyhek 5 - Veszteség, Kelyhek 7 - Vágyálmok).
* **8-10:** Elengedés és a végső boldogság megtalálása (Kelyhek 8 - Továbblépés, Kelyhek 10 - Beteljesülés).
* **Megerősítés:** "Hagyom, hogy érzelmeim szabadon áramoljanak, és nyitott vagyok a szeretetre."`
    },
    {
        id: 'lesson-minor-2',
        title: 'A Levegő és a Föld: Kardok és Érmék',
        description: 'A mentális kihívások és az anyagi stabilitás megértése.',
        category: 'minor',
        difficulty: 'beginner',
        xpReward: 50,
        icon: '🌬️',
        relatedCards: ['swords-1', 'swords-10', 'pentacles-1', 'pentacles-10'],
        quizQuestions: [
            { statement: "A Kardok (Swords) gyakran nehéz mentális folyamatokat jeleznek.", isTrue: true },
            { statement: "Az Érmék (Pentacles) a Levegő elemhez tartoznak.", isTrue: false },
            { statement: "A Kardok Hármas a szívfájdalom és a fájdalmas felismerés lapja.", isTrue: true },
            { statement: "Az Érmék Nyolcas a szorgalmas tanulásról és munkáról szól.", isTrue: true },
            { statement: "Az Érmék Ötös a hirtelen jött gazdagságot jelenti.", isTrue: false }
        ],
        content: `A Kardok az elménk vívódásait, az Érmék pedig a fizikai világunk biztonságát térképezik fel.

# ⚔️ Kardok (Swords) – A Levegő Útja
A Kardok a logikáról, az igazságról, de a szorongásról és a konfliktusokról is szólnak.
* **Ász-3:** Mentális áttörés és a fájdalmas igazság (Kardok 1 - Tisztánlátás, Kardok 3 - Megtört szív).
* **4-7:** Pihenés és stratégia (Kardok 4 - Meditáció, Kardok 6 - Továbblépés, Kardok 7 - Ravaszság).
* **8-10:** A mentális börtön és a mélypont (Kardok 8 - Tehetetlenség, Kardok 9 - Szorongás, Kardok 10 - Befejezés).
* **Megerősítés:** "Gondolataim tiszták, és az igazság felszabadít engem."

# 🪙 Érmék (Pentacles) – A Föld Útja
Az Érmék a testünkről, a pénzünkről, a munkánkról és a biztonságunkról beszélnek.
* **Ász-3:** Új anyagi esélyek és szakértelem (Érmék 1 - Lehetőség, Érmék 3 - Mestervizsga).
* **4-7:** Birtoklás, szűkség és türelem (Érmék 4 - Ragaszkodás, Érmék 5 - Nélkülözés, Érmék 7 - Várakozás).
* **8-10:** Szorgalom, bőség és örökség (Érmék 8 - Tanulás, Érmék 9 - Függetlenség, Érmék 10 - Gazdagság).
* **Megerősítés:** "Békében vagyok az anyagi világgal, és értéket teremtek a munkámmal."`
    },
    {
        id: 'lesson-minor-court',
        title: 'Az Udvari Kártyák (Személyiségtípusok)',
        description: 'Apród, Lovag, Királynő, Király - A belső és külső szereplők dinamikája.',
        category: 'minor',
        difficulty: 'advanced',
        xpReward: 45,
        icon: '👑',
        relatedCards: ['wands-page', 'swords-knight', 'cups-queen', 'pentacles-king'],
        quizQuestions: [
            { statement: "Az Apródok (Page) minden elemben a gyermeki, tanuló aspektust képviselik.", isTrue: true },
            { statement: "A Lovagok a stabilitást és a nyugalmat jelentik.", isTrue: false },
            { statement: "A Királynők az elem belső, érzelmi 'lelkét' mutatják be.", isTrue: true },
            { statement: "A Királyok a struktúra és az irányítás mesterei.", isTrue: true },
            { statement: "A Kardok Lovagja a víz elem levegő aspektusa.", isTrue: false }
        ],
        content: `Az udvari kártyák jelenthetnek konkrét személyeket, a te személyiséged részeit vagy egy helyzet érettségét.

**🌱 Apród (Page) – A Hírnök és a Tanuló**
Az új kezdetek és a kíváncsiság szimbóluma. Ő hozza a híreket és a tanulás vágyát.
* *Jelleg:* Tanuló, hírvivő, kezdő. Nyitott, kíváncsi, de tapasztalatlan.
* *Üzenet:* Új lehetőség, üzenet, tanulás, kezdeti fázis. Még nincs cselekvés, csak az impulzus.
* *Példa:* Botok Apródja = A Tűz Földje (A szikra a fában).
* *Üzenet:* "Légy nyitott az új információkra!"

**🐎 Lovag (Knight) – A Harcos és a Cselekvő**
Az energia, a mozgás és a szélsőségek kártyája. Ő viszi véghez a változást, néha túl gyorsan is.
* *Jelleg:* Cselekvő, mozgékony, szélsőséges. Vagy nagyon gyors ("gáz"), vagy nagyon makacs. Hiányzik még belőle az egyensúly.
* *Gondolat:* Változás, utazás, harc, hirtelen események. A dolgok mozgásba lendülnek.
* *Példa:* Kardok Lovagja = A Levegő Levegője (Vihar).
* *Üzenet:* "Itt az idő a tettekre, de figyelj az irányra!"

**🍷 Királynő (Queen) – Az Anya és az Érzelmi Mester**
A belső erő és a befogadás megtestesítője. Ő uralja az elemet érzelmi szinten.
* *Jelleg:* Befogadó, megtartó, belső erő. Ő az elem "lelke". Nem kifelé hat, hanem befelé sugároz. Érzelmi érettség és gondoskodás.
* *Gondolat:* Megértés, türelem, növekedés, inkubáció.
* *Példa:* Kelyhek Királynője = A Víz Vize (Az óceán mélye).
* *Üzenet:* "Bízz az intuíciódban és gondoskodj önmagadról!"

**👑 Király (King) – Az Apa és a Stratéga**
A tekintély, a stabilitás és a külső hatalom képviselője. Ő irányítja a világát.
* *Jelleg:* Kiáradó, irányító, strukturáló. Ő az elem "mestere". Kifelé hat, rendet teremt és vezet. Felelősségvállalás.
* *Gondolat:* Stabilitás, döntés, hatalom, szakértelem.
* *Példa:* Érmék Királya = A Föld Tüze (A termékeny láva, az üzleti siker).
* *Üzenet:* "Vállald a felelősséget és uralkodj a káoszon!"`
    }
];