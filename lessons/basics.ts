import { Lesson } from '../types';

export const BASICS_LESSONS: Lesson[] = [
    {
        id: 'lesson-basics-1',
        title: 'A Tarot Eredete és Felépítése',
        description: 'Történelem, a 78 kártya szerkezete és a szinkronicitás mélyebb megértése.',
        category: 'basics',
        difficulty: 'beginner',
        xpReward: 30,
        icon: '📜',
        relatedCards: ['major-0', 'major-1', 'major-21'],
        quizQuestions: [
            { statement: "A Tarot összesen 78 kártyából áll.", isTrue: true },
            { statement: "A Nagy Árkánum a mindennapi élet apró eseményeit jelképezi.", isTrue: false },
            { statement: "A kártya eredete a 15. századi Észak-Olaszországba nyúlik vissza.", isTrue: true },
            { statement: "A szinkronicitás elve Carl Jung pszichológiáján alapul.", isTrue: true },
            { statement: "A Tarot elsődleges célja a megmásíthatatlan jövő megjósolása.", isTrue: false }
        ],
        content: `A Tarot nem csupán egy jóseszköz, hanem egy komplex szimbólumrendszer, amely az emberi tapasztalatok összességét térképezi fel. 

### Történeti Áttekintés
Eredete a 15. századi Észak-Olaszországba nyúlik vissza (a legrégebbi fennmaradt pakli a Visconti-Sforza), ahol kezdetben kártyajátékként ("tarocchi") szolgált. A 18. századi okkultisták (mint Court de Gébelin és Etteilla) fedezték fel benne a rejtett spirituális tudást, összekapcsolva az egyiptomi misztériumokkal és a Kabbalával. A modern korszakot az 1909-es Rider-Waite-Smith pakli nyitotta meg, amely először ábrázolt jeleneteket a Kis Árkánum minden lapján.

### A 78 Kártya Struktúrája
A Tarot két fő részre oszlik, amelyek a makrokozmosz és a mikrokozmosz viszonyát tükrözik:

1. **Nagy Árkánum (Major Arcana):** 22 lap (0-21). A latin *arcanum* szó titkot jelent. Ezek a kártyák az élet nagy, sorsszerű fordulópontjait, karmikus leckéit és archetípusait jelképezik. A Nagy Árkánum a "Bolond Útja", amely a lélek inkarnációjától a megvilágosodásig tartó fejlődési ívet írja le.

2. **Kis Árkánum (Minor Arcana):** 56 lap. Ezek a kártyák a mindennapi élet eseményeit, az "itt és most" kihívásait írják le. Négy színre (suits) oszlanak:
   * **Botok (Tűz):** Akarat, szenvedély, munka, energia.
   * **Kelyhek (Víz):** Érzelmek, intuíció, szeretet, kapcsolatok.
   * **Kardok (Levegő):** Gondolatok, logika, igazság, konfliktusok.
   * **Érmék (Föld):** Anyagi világ, test, pénz, stabilitás.

### Hogyan működik? A Szinkronicitás elve
A Tarot működése nem mágikus beavatkozáson, hanem a C.G. Jung által leírt szinkronicitáson alapul. Ez az elv azt mondja ki, hogy a "véletlen" események (pl. melyik kártyát húzzuk ki) és a belső állapotunk között jelentésbeli összefüggés van. A kártya képei mint "tükrök" működnek: nem a jövőt írják elő, hanem segítenek a tudattalan tartalmakat (érzések, félelmek, vágyak) a tudat felszínére hozni.`
    },
    {
        id: 'lesson-basics-2',
        title: 'A Négy Elem és a Kis Árkánum',
        description: 'Tűz, Víz, Levegő és Föld - az univerzum építőkövei a tenyeredben.',
        category: 'basics',
        difficulty: 'beginner',
        xpReward: 35,
        icon: '🔥',
        relatedCards: ['wands-1', 'cups-1', 'swords-1', 'pentacles-1'],
        quizQuestions: [
            { statement: "A Botok színe a Tűz elemet képviseli.", isTrue: true },
            { statement: "A Kelyhek (Cups) a maszkulin, aktív energiákhoz tartoznak.", isTrue: false },
            { statement: "A Kardok az elme és az ego világát szimbolizálják.", isTrue: true },
            { statement: "Az Érmék (Pentacles) a föld elemet és az anyagi világot jelentik.", isTrue: true },
            { statement: "A Víz elem színe a Tarotban általában a kék.", isTrue: true }
        ],
        content: `A Kis Árkánum négy színe a négy klasszikus őselemet képviseli. Ezek megértése segít azonnal érzékelni egy kirakás alaphangulatát.

# 🔥 Botok (Wands) - Tűz Elem
* **Csillagjegyek:** Kos, Oroszlán, Nyilas.
* **Jelleg:** Forró, száraz, kiáradó, maszkulin (aktív).
* **Kulcsszavak:** Szenvedély, akarat, kreativitás, cselekvés, inspiráció, szexualitás, spirituális szikra.
* **Pszichológia:** Ez az "ID" vagy ösztön-én ereje. A bennünk lévő hajtóerő, ami cselekvésre késztet. Ha sok Bot van egy kirakásban, az nagy energiát, gyors változást, de konfliktusveszélyt vagy kiégést is jelezhet. Hiánya apátiára vagy depresszióra utal.

# 💧 Kelyhek (Cups) - Víz Elem
* **Csillagjegyek:** Rák, Skorpió, Halak.
* **Jelleg:** Hideg, nedves, befogadó, feminin (passzív).
* **Kulcsszavak:** Érzelmek, intuíció, kapcsolatok, tudatalatti, álmok, gyógyítás, szerelem.
* **Pszichológia:** A lélek nyelve. A Kelyhek a mélységet, az áramlást és az alkalmazkodást jelképezik. Túlsúlyuk érzelmi hullámzásra, álmodozásra vagy irracionalitásra utalhat. Hiányuk érzelmi sivárságot vagy elfojtást jelez.

# 🌬️ Kardok (Swords) - Levegő Elem
* **Csillagjegyek:** Ikrek, Mérleg, Vízöntő.
* **Jelleg:** Forró, nedves, mozgékony, maszkulin (aktív).
* **Kulcsszavak:** Gondolatok, intellektus, kommunikáció, igazság, logika, konfliktus, döntés.
* **Pszichológia:** Az elme és az ego világa. A Kardok gyakran a legnehezebb lapok (pl. 3-as, 9-es, 10-es), mert az emberi szenvedés gyökere gyakran a gondolkodásunkban rejlik (aggódás, önkritika). De ők hozzák el a tisztánlátást és a bölcsességet is. Túlsúlyuk "túlagyalást" vagy vitákat jelez.

# 🌱 Érmék (Pentacles) - Föld Elem
* **Csillagjegyek:** Bika, Szűz, Bak.
* **Jelleg:** Hideg, száraz, szilárd, feminin (passzív).
* **Kulcsszavak:** Anyagi világ, pénz, munka, test, egészség, stabilitás, természet, eredmények.
* **Pszichológia:** A kézzelfogható valóság és a biztonságérzet. Lassú, de tartós energiát képviselnek. Túlsúlyuk materializmusra vagy lassúságra, hiányuk pedig instabilitásra, pénzügyi gondokra vagy "földetlenségre" utalhat.`
    }
];