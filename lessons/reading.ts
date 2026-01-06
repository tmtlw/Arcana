import { Lesson } from '../types';

export const READING_LESSONS: Lesson[] = [
    {
        id: 'lesson-reading-timing',
        title: 'Az Idő Mérése a Tarotban',
        description: 'Mikor fog megtörténni? Módszerek az események időzítésére.',
        category: 'reading',
        difficulty: 'intermediate',
        xpReward: 40,
        icon: '⏳',
        relatedCards: ['wands-8', 'pentacles-7', 'major-10'],
        quizQuestions: [
            { statement: "A Botok (Wands) jelentik a leggyorsabb időzítést (napok).", isTrue: true },
            { statement: "Az Érmék (Pentacles) hetekben mérhető időt jeleznek.", isTrue: false },
            { statement: "A Kelyhek a nyári évszakhoz köthetők.", isTrue: true },
            { statement: "A Kardok (Swords) gyors energiák, hetekben mérve.", isTrue: true },
            { statement: "A Remete kártya lassulást és késlekedést jelez.", isTrue: true }
        ],
        content: `A Tarot kártyákkal való időmeghatározás az egyik legösszetettebb feladat. Számos rendszer létezik, de a legegyszerűbb az elemi sebességeken alapul.

# ⏳ Időzítés az Elemek Alapján

| Szín (Elem) | Időtartam | Sebesség | Évszak |
| :--- | :--- | :--- | :--- |
| **Botok (Tűz)** | Napok | Nagyon gyors | Tavasz |
| **Kardok (Levegő)** | Hetek | Gyors | Ősz |
| **Kelyhek (Víz)** | Hónapok | Lassú | Nyár |
| **Érmék (Föld)** | Évek | Nagyon lassú | Tél |

# 🌟 Speciális Időzítés a Nagy Árkánumban
Néhány kártya kiemelt jelentőséggel bír az idő szempontjából:
* **A Mágus:** Azonnal, most van itt az idő a cselekvésre.
* **Szerencsekerék:** Sorsszerű fordulat, aminek eljött az ideje.
* **A Remete:** Hosszú idő, türelemre van szükség.
* **Az Akasztott Ember:** Megállás, stagnálás, a dolgok egyelőre nem mozognak.
* **A Halál:** Hirtelen és végleges lezárás.
* **A Nap:** Nappal, nyáron, vagy a legfényesebb pillanatban.

# 🔢 Numerológiai Módszer
Húzhatsz egy külön kártyát az időpontra. A kártya száma jelentheti a napok, hetek vagy hónapok számát. Például a Botok 3-as jelenthet 3 napot vagy a tavasz 3. hetét.

### 🌟 Nagy Árkánum Időzítés

| Kártya | Idő / Időszak | Minőség |
| :--- | :--- | :--- |
| **A Bolond** | Váratlanul | Bármikor |
| **A Mágus** | Gyorsan | Azonnal |
| **A Főpapnő** | Titok / Ismeretlen | Rejtett |
| **Az Uralkodónő** | Amikor a feltételek összeállnak | Termékeny idő |
| **Az Uralkodó** | Márc 21 - Ápr 20 | Kos (Aries) |
| **A Főpap** | Ápr 21 - Máj 21 | Bika (Taurus) |
| **A Szeretők** | Máj 22 - Jún 21 | Ikrek (Gemini) |
| **A Diadalszekér** | Jún 22 - Júl 22 | Rák (Cancer) |
| **Az Erő** | Júl 23 - Aug 23 | Oroszlán (Leo) |
| **A Remete** | Aug 24 - Szep 22 | Szűz (Virgo) |
| **Szerencsekerék** | Meglepetés | Sorsszerű |
| **Igazságosság** | Szep 23 - Okt 23 | Mérleg (Libra) |
| **Akasztott Ember** | Késlekedés, várakozás | Türelem |
| **A Halál** | Okt 24 - Nov 22 | Skorpió (Scorpio) |
| **Mértékletesség** | Nov 23 - Dec 21 | Nyilas (Sagittarius) |
| **Az Ördög** | Dec 22 - Jan 20 | Bak (Capricorn) |
| **A Torony** | Hirtelen, robbanásszerűen | Most! |
| **A Csillag** | Jan 21 - Feb 18 | Vízöntő (Aquarius) |
| **A Hold** | Feb 19 - Márc 20 | Halak (Pisces) |
| **A Nap** | Nappal, Nyáron | Ragyogó idő |
| **Feltámadás** | Gyors, lassú, állandó | Végleges |
| **A Világ** | Lassú, de sikeres | Beteljesülés |

---

### 🔥 Botok (Wands) - Tavasz
**Sebesség:** Leggyorsabb (Napok)

| Kártya | Időszak |
| :--- | :--- |
| **Ász** | Tavaszi szezon |
| **2** | Márc 21 - 30 |
| **3** | Márc 31 - Ápr 10 |
| **4** | Ápr 11 - Ápr 20 |
| **5** | Júl 22 - Aug 1 |
| **6** | Aug 2 - Aug 11 |
| **7** | Aug 12 - Aug 22 |
| **8** | Nov 23 - Dec 2 |
| **9** | Dec 3 - Dec 12 |
| **10** | Dec 13 - Dec 21 |
| **Apród** | Jún 21 - Szep 22 |
| **Lovag** | Nov 13 - Dec 12 |
| **Királynő** | Márc 11 - Ápr 10 |
| **Király** | Júl 12 - Aug 11 |

---

### 🏆 Kelyhek (Cups) - Nyár
**Sebesség:** Lassú (Hónapok)

| Kártya | Időszak |
| :--- | :--- |
| **Ász** | Nyári szezon |
| **2** | Jún 21 - Júl 1 |
| **3** | Júl 2 - Júl 11 |
| **4** | Júl 12 - Júl 21 |
| **5** | Okt 23 - Nov 1 |
| **6** | Nov 2 - Nov 12 |
| **7** | Nov 13 - Nov 22 |
| **8** | Feb 19 - Feb 29 |
| **9** | Márc 1 - Márc 10 |
| **10** | Márc 11 - Márc 20 |
| **Apród** | Szep 23 - Dec 21 |
| **Lovag** | Feb 9 - Márc 10 |
| **Királynő** | Jún 11 - Júl 11 |
| **Király** | Okt 13 - Nov 12 |

---

### ⚔️ Kardok (Swords) - Ősz
**Sebesség:** Gyors (Hetek)

| Kártya | Időszak |
| :--- | :--- |
| **Ász** | Őszi szezon |
| **2** | Szep 23 - Okt 2 |
| **3** | Okt 3 - Okt 12 |
| **4** | Okt 13 - Okt 22 |
| **5** | Jan 20 - Jan 29 |
| **6** | Jan 30 - Feb 8 |
| **7** | Feb 9 - Feb 18 |
| **8** | Máj 21 - Máj 31 |
| **9** | Jún 1 - Jún 10 |
| **10** | Jún 11 - Jún 20 |
| **Apród** | Dec 22 - Márc 20 |
| **Lovag** | Máj 11 - Jún 10 |
| **Királynő** | Szep 12 - Okt 12 |
| **Király** | Jan 10 - Feb 8 |

---

### 🌟 Érmék (Pentacles) - Tél
**Sebesség:** Leglassabb (Évek)

| Kártya | Időszak |
| :--- | :--- |
| **Ász** | Téli szezon |
| **2** | Dec 22 - Dec 30 |
| **3** | Dec 31 - Jan 9 |
| **4** | Jan 10 - Jan 19 |
| **5** | Ápr 21 - Ápr 30 |
| **6** | Máj 1 - Máj 10 |
| **7** | Máj 11 - Máj 20 |
| **8** | Aug 23 - Szep 1 |
| **9** | Szep 2 - Szep 11 |
| **10** | Szep 12 - Szep 22 |
| **Apród** | Márc 21 - Jún 20 |
| **Lovag** | Aug 12 - Szep 11 |
| **Királynő** | Dec 13 - Jan 9 |
| **Király** | Ápr 11 - Máj 10 |`
    },
    {
        id: 'lesson-reading-ethics',
        title: 'Tarot Etika és Felelősség',
        description: 'Hogyan kérdezzünk helyesen, és mik a határok?',
        category: 'reading',
        difficulty: 'beginner',
        xpReward: 35,
        icon: '⚖️',
        relatedCards: ['major-11', 'major-5'],
        quizQuestions: [
            { statement: "A Tarot segítségével bármit megváltoztathatunk mások életében.", isTrue: false },
            { statement: "Etikus dolog harmadik fél tudta nélkül kutakodni a magánéletében.", isTrue: false },
            { statement: "A Tarot tanácsadás kiegészítheti, de nem helyettesítheti az orvosi diagnózist.", isTrue: true },
            { statement: "A jó kérdés a kérdezőnek ad erőt a döntéshez.", isTrue: true },
            { statement: "Minden jóslat 100%-os biztonsággal bekövetkezik.", isTrue: false }
        ],
        content: `A Tarot olvasás felelősséggel jár. A kártya nem irányítja az életünket, hanem eszköz az önismerethez és a tudatos döntéshozatalhoz.

# 1. A Helyes Kérdésföltevés
A "jövő" nem egy kőbe vésett film. A kérdéseid határozzák meg a válaszok mélységét.
* **Kerüld el:** Az eldöntendő (Igen/Nem) kérdéseket, mert passzivitásra késztetnek. (Pl: "Megnyerem a lottót?")
* **Válaszd ezt:** Az erőt adó, cselekvésre ösztönző kérdéseket. (Pl: "Mit tehetek azért, hogy anyagi bőségbe kerüljek?")

# 2. A Harmadik Fél Szabálya
Sokan kíváncsiak mások érzéseire ("Szeret engem X?"). Etikailag aggályos valaki más tudatalattijában "turkálni". Próbáld a kérdést magadra fordítani: "Hogyan javíthatom a kapcsolatomat X-szel?" vagy "Mi az én feladatom ebben a viszonyban?".

# 3. A Szakmai Határok
A Tarot olvasó nem orvos, nem ügyvéd és nem pénzügyi tanácsadó.
* **Egészség:** Soha ne jósolj betegséget vagy gyógyulást! Irányítsd a kérdezőt szakemberhez.
* **Jog:** Jogi kimeneteleket ne ígérj biztosra.
* **Halál:** Soha ne jósolj fizikai halált!

# 4. Szabad Akarat
Emlékeztesd a kérdezőt (vagy magadat), hogy a kártyák a jelenlegi energiák legvalószínűbb kimenetelét mutatják. Minden pillanatban jogod és lehetőséged van változtatni a döntéseiden, és ezzel a jövődön is.

**5. A "Rossz" Kártyák mítosza:**
Ne ijesztgesd magad vagy a kérdezőt!
* A **Halál** ritkán jelent fizikai halált; inkább változást, lezárást.
* Az **Ördög** nem a Sátán, hanem a saját függőségeink és félelmeink.
* A **Torony** bár fájdalmas, de szükséges tisztulást hoz (mint egy vihar).
A te felelősséged, hogy a nehéz lapokban is megtaláld a segítő, építő üzenetet.`
    }
];