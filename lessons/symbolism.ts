import { Lesson } from '../types';

export const SYMBOLISM_LESSONS: Lesson[] = [
    {
        id: 'lesson-symb-colors',
        title: 'A Színek Beszéde',
        description: 'Hogyan használták a színeket a Rider-Waite pakliban a hangulat és a jelentés fokozására?',
        category: 'symbolism',
        difficulty: 'intermediate',
        xpReward: 40,
        icon: '🎨',
        relatedCards: ['major-1', 'major-13', 'major-18', 'major-19'],
        quizQuestions: [
            { statement: "A sárga szín a tudatosságot és az értelmet jelképezi.", isTrue: true },
            { statement: "A sötétkék a mély érzelmek és a tudatalatti színe.", isTrue: true },
            { statement: "A vörös a passzivitás és a nyugalom színe.", isTrue: false },
            { statement: "A fehér a tisztaságot és az ego-mentességet jelzi.", isTrue: true },
            { statement: "A szürke szín általában a bizonytalanságot vagy a semlegességet mutatja.", isTrue: true }
        ],
        content: `A színek nem véletlenek a Tarot kártyákon. Segítenek azonnal ráhangolódni a lap energiájára.

**☀️ Sárga (Nap/Merkúr):** Tudatosság, értelem, fény, optimizmus, isteni tudás. (Pl. A Mágus háttere).
**🌊 Kék (Víz/Hold):** Tudatalatti, spiritualitás, női energia, mélység, passzivitás. (Pl. A Főpapnő ruhája).
* *Világoskék:* Szellemi tisztaság, gondolatok (Kardok háttere).
* *Sötétkék:* Mély érzelmek, titkok, intuíció (Főpapnő).
**🔥 Vörös (Tűz/Mars):** Szenvedély, akarat, életerő, vágy, cselekvés, anyagi világ. (Pl. Az Uralkodó palástja).
* *Vörös köpeny (pl. Mágus, Igazságosság):* Aktív cselekvőkészség.
* *Vörös háttér:* Feszültség, dinamizmus.
**🌱 Zöld (Föld/Vénusz):** Termékenység, növekedés, gyógyulás, természet, élet. (Pl. Az Uralkodónő kertje).
**🕊️ Fehér:** Tisztaság, ártatlanság, új kezdet, szellemi tisztaság, ego-mentesség.
**🌑 Fekete:** Sötétség, tudatlanság, halál (mint lezárás), védelem vagy titokzatosság.
**🌫️ Szürke:** Semlegesség, bizonytalanság, várakozás, a vihar előtti csend vagy a ködös gondolkodás.`
    },
    {
        id: 'lesson-symb-numbers',
        title: 'Számok és Ciklusok',
        description: 'A numerológia szerepe a Tarot fejlődési ívében 1-től 10-ig.',
        category: 'symbolism',
        difficulty: 'intermediate',
        xpReward: 45,
        icon: '🔢',
        relatedCards: ['wands-1', 'swords-5', 'pentacles-10'],
        quizQuestions: [
            { statement: "Az Ászok (1) mindig egy új lehetőséget és potenciált jeleznek.", isTrue: true },
            { statement: "Az Ötös szám (5) a harmóniát és a pihenést szimbolizálja.", isTrue: false },
            { statement: "A Tízesek (10) egy ciklus végét és a beteljesülést jelentik.", isTrue: true },
            { statement: "A Hármas szám (3) a növekedést és a kreativitást képviseli.", isTrue: true },
            { statement: "A Négyesek a stabilitást és a struktúrát mutatják.", isTrue: true }
        ],
        content: `A kártyák száma nem véletlen. Minden szám egy stációt jelöl az energia megnyilvánulásának útján (az Életfa szefiráinak megfelelően). Ha ismered a számot és az elemet, tudod a jelentést.

**Ász (1):** A tiszta potenciál, a mag, a kezdet. Az elem esszenciája a legtisztább formában. "Lehetőség".
**Kettes (2):** Dualitás, választás, egyensúlyozás, partnerség. Még nincs valódi haladás, csak a feszültség vagy a kapcsolat megjelenése. "Találkozás".
**Hármas (3):** Az első eredmény, a szintézis, a növekedés. A kreativitás száma (1+2=3). Csoportmunka vagy terjeszkedés. "Növekedés".
**Négyes (4):** Stabilitás, struktúra, rend, biztonság. De lehet merevség és stagnálás is. A "doboz". "Biztonság".
**Ötös (5):** A stabilitás felborulása. Konfliktus, válság, veszteség, kihívás. Szükséges a fejlődéshez, mert kimozdít a 4-es kényelméből. "Válság".
**Hatos (6):** Harmónia helyreállása, egyensúly, segítség, adok-kapok. A válság utáni megnyugvás. "Harmónia".
**Hetes (7):** Értékelés, türelem, választás, belső munka. A cselekvés helyett a stratégia és a reflexió ideje. "Próbatétel".
**Nyolcas (8):** Mozgás, sebesség, erőfeszítés, részletek kidolgozása. A 4-es struktúrájának magasabb szintű ismétlődése. "Cselekvés".
**Kilences (9):** Beteljesülés, csúcspont (egyedül), anyagi vagy érzelmi gazdagság. A ciklus vége előtti utolsó lépés. "Függetlenség".
**Tizes (10):** A ciklus vége, teljesség, túlzás, átmenet egy új szintre. A maximum, ami elérhető. "Beteljesülés".`
    },
    {
        id: 'lesson-symb-nature',
        title: 'Állatok és Természeti Szimbólumok',
        description: 'Oroszlánok, angyalok és tájak - mit üzen a környezet?',
        category: 'symbolism',
        difficulty: 'advanced',
        xpReward: 50,
        icon: '🐺',
        relatedCards: ['major-8', 'major-10', 'major-18', 'major-21'],
        quizQuestions: [
            { statement: "Az Oroszlán az Erő kártyán a megszelídített állati ösztönöket jelenti.", isTrue: true },
            { statement: "A hegyek a távolban könnyű és akadálymentes utat jeleznek.", isTrue: false },
            { statement: "A Hold kártyán látható kutya és farkas a tudatos és tudatalatti vad oldalunkat képviseli.", isTrue: true },
            { statement: "A Sphinx a Szerencsekeréken a sors rejtélyeit és a bölcsességet szimbolizálja.", isTrue: true },
            { statement: "A kert vagy a termékeny táj a szellemi kiüresedést jelzi.", isTrue: false }
        ],
        content: `A Tarot kártyákon látható élőlények és tájak mélyebb pszichológiai rétegeket tárnak fel.

# 🐾 Állati Archetípusok
*   **Oroszlán (Az Erő, A Világ):** Szenvedély, büszkeség, tűz és az uralt ösztön-én.
*   **Sphinx (Szerencsekerék):** A titkok őrzője, bölcsesség, a sors mozdíthatatlan pontja.
*   **Kutya és Farkas (A Hold):** A háziasított és a vad énünk; az út, amelyen végig kell mennünk.
*   **Bika, Oroszlán, Sas, Angyal (Szerencsekerék/Világ sarkai):** A négy fix jegy (Bika, Oroszlán, Skorpió, Vízöntő) és a négy elem egyensúlya a kozmoszban.

# 🏔️ Táj és Környezet
*   **Hegyek:** Magasabb célok, spirituális törekvés, de nehézségek és akadályok is.
*   **Folyó/Víz:** Az érzelmek áramlása, a tudatalatti állapota (nyugodt vagy háborgó).
*   **Kert:** Biztonság, termékenység, az ember által megművelt lélek.
*   **Pusztaság:** Elszigeteltség, a lélek sötét éjszakája, a sallangmentes igazság keresése.

**Hegyek:**
A kihívást, a spirituális emelkedést és a távoli célt jelképezik. Ha a hegy lila, az a spiritualitásra utal. Ha havas, az a tisztaságra és a magányra (Remete). A Bolondnál a hegyek a kiindulópontot jelentik (az isteni szférát).

**Víz:**
Az érzelmek és a tudatalatti áramlása.
* *Nyugodt tenger:* Belső béke, harmónia (Kelyhek 2).
* *Hullámzó víz:* Érzelmi vihar, bizonytalanság (Kardok 6, Hold).
* *Folyó:* Az élet áramlása és az elmúlás/változás (Halál).

**Oszlopok:**
A kaput jelzik két világ között (tudatos/tudattalan, evilági/szent).
* *Főpapnő:* B (fekete) és J (fehér) oszlopai a dualitást (Jachin és Boaz) jelképezik. Ő ül középen, az egyensúlyban.
* *Főpap:* Két szürke oszlop – a társadalmi intézmény merevsége.

**Fátyol/Függöny:**
A titkok elrejtése. A Főpapnő mögötti fátyol rejti a legmélyebb tudást. Csak a beavatottak léphetnek mögé.

**Út/Ösvény:**
Az életút, a sors iránya. Gyakran kanyargós (Hold), jelezve, hogy a fejlődés nem lineáris.

**Gránátalma:**
A termékenység, a nőiesség és a rejtett tudás (Perszephoné alvilági gyümölcse). A Főpapnő és az Uralkodónő kártyáin a női misztériumokat jelöli.

**Város/Falu a háttérben:**
A társadalom, a biztonság, a civilizáció. Ha valaki hátat fordít neki (Kelyhek 8), az a társadalmi normák elhagyását jelzi.`
    },
    {
        id: 'lesson-astro-basics',
        title: 'Asztrológia és Tarot (Golden Dawn)',
        description: 'Hogyan kapcsolódnak a csillagjegyek a kártyákhoz?',
        category: 'symbolism',
        difficulty: 'advanced',
        xpReward: 50,
        icon: '🪐',
        relatedCards: ['major-19', 'major-18', 'major-17'],
        content: `A 19. századi Golden Dawn rend összekapcsolta a Tarot-t az asztrológiával és a Kabbalával. Ha ismered az asztrológiát, mélyebb rétegeket fedezhetsz fel.

**Nagy Árkánum és a Zodiákus:**
* **Kos (Kezdet, Harc):** Az Uralkodó (Rendteremtés)
* **Bika (Anyag, Hit):** A Főpap (Tradíció)
* **Ikrek (Kettősség):** A Szeretők (Választás)
* **Rák (Otthon, Páncél):** A Diadalszekér (Védelem és irányítás)
* **Oroszlán (Szív, Erő):** Az Erő (Szenvedély)
* **Szűz (Elemzés, Magány):** A Remete (Belső rend)
* **Mérleg (Egyensúly):** Az Igazságosság (Döntés)
* **Skorpió (Halál, Transzformáció):** A Halál
* **Nyilas (Cél, Alkímia):** A Mértékletesség (Magasabb tudat)
* **Bak (Anyag, Ambíció):** Az Ördög (Kötöttségek)
* **Vízöntő (Remény, Jövő):** A Csillag
* **Halak (Tudatalatti):** A Hold

**Bolygók:**
* **Nap:** A Nap
* **Hold:** A Főpapnő
* **Merkúr:** A Mágus
* **Vénusz:** Az Uralkodónő
* **Mars:** A Torony (Romboló erő)
* **Jupiter:** Szerencsekerék
* **Szaturnusz:** A Világ (Idő és Határok)

**Kis Árkánum (Dekádok):**
Minden Kis Árkánum lap (2-10) a Zodiákus egy-egy 10 fokos szakaszához (dekádjához) tartozik.
Pl. A Botok 2 az első Kos dekád (Mars a Kosban) -> Ezért jelenti a hódítást és az uralmat.`
    }
];