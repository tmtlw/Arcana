import { Lesson } from '../types';

export const MAJOR_LESSONS: Lesson[] = [
    {
        id: 'lesson-major-1',
        title: 'A Bolond Útja I. (Az Öntudat Ébredése: 0-7)',
        description: 'A lélek útja a tiszta potenciáltól a társadalmi diadalig. Részletes elemzés a 0-tól a 7-es kártyáig.',
        category: 'major',
        difficulty: 'beginner',
        xpReward: 60,
        icon: '🤡',
        relatedCards: ['major-0', 'major-1', 'major-2', 'major-3', 'major-4', 'major-5', 'major-6', 'major-7'],
        quizQuestions: [
            { statement: "A Bolond a 0-s számot viseli, ami a végtelen potenciált jelképezi.", isTrue: true },
            { statement: "A Mágus asztrológiai megfelelője a Hold.", isTrue: false },
            { statement: "Az Uralkodónő a természet bőségét és a termékenységet képviseli.", isTrue: true },
            { statement: "A Főpap (Hierophant) a lázadás és a káosz szimbóluma.", isTrue: false },
            { statement: "A Diadalszekér az akaraterő általi győzelmet jelenti.", isTrue: true }
        ],
        content: `A Nagy Árkánum első szakasza az egyéni fejlődésről és a világba való beilleszkedésről szól. Ez a "Külső Út".

# 0. A Bolond (The Fool)
* **Kulcsszavak:** Új kezdet, Lelkesedés, Kaland, Lehetőség, Spontaneitás.
* **Jelentés:** Új kezdetek, lelkesedés, kalandok, friss lehetőségek, a lehetőség arra, hogy életre keltsd álmaidat. Fordított helyzetben naivitást és elhamarkodott döntéseket jelez.
* **Megerősítés:** "Felébresztem a lelkem ösvényét, és készen állok a kalandra."

# 1. A Mágus (The Magician)
* **Kulcsszavak:** Készségek, Erő, Manifesztáció, Fókusz, Teremtés.
* **Jelentés:** Készségek, természetes adottságok, erő, vágyaid kifejezésének képessége. Az asztalán lévő négy eszköz (kehely, kard, bot, érme) jelzi, hogy minden forrás rendelkezésére áll.
* **Megerősítés:** "Kinyilvánítom az általam kívánt életet az energia és a szándék révén."

# 2. A Főpapnő (The High Priestess)
* **Kulcsszavak:** Intuíció, Álmok, Csend, Titkok, Misztikum.
* **Jelentés:** Intuíció, álmok, tudatalatti üzenetek, passzivitás, várakozás. Ő őrzi a templom bejáratát a két oszlop (Jachin és Boaz) között.
* **Megerősítés:** "A hit az intuitív szívemben van."

# 3. Az Uralkodónő (The Empress)
* **Kulcsszavak:** Termékenység, Bőség, Gondoskodás, Kreativitás, Anyaság.
* **Jelentés:** Termékenység, kreativitás, bőség, anyaság, érzékiség, új dolgok születése. A természet kifogyhatatlan erejét képviseli.
* **Megerősítés:** "Megszülöm bőségesen gazdag jövőmet."

# 4. Az Uralkodó (The Emperor)
* **Kulcsszavak:** Vezetés, Struktúra, Hatalom, Rend, Stratégia.
* **Jelentés:** Struktúra, stabilitás, tekintély, apaság, logikus döntések. Ő teremti meg a kereteket és a biztonságot.
* **Megerősítés:** "Magabiztossággal és tekintéllyel vezetem az életemet."

# 5. A Főpap (The Hierophant)
* **Kulcsszavak:** Hagyomány, Hit, Tanítás, Spirituális vezető, Bölcsesség.
* **Jelentés:** Spirituális útmutatás, hagyományok, házasság, tanulás, hit. A társadalmi és vallási rendszerek tanítója.
* **Megerősítés:** "Én vagyok a saját gurum, de tisztelem a hagyomány bölcsességét."

# 6. A Szeretők (The Lovers)
* **Kulcsszavak:** Szerelem, Választás, Harmónia, Kapcsolat, Egység.
* **Jelentés:** Szerelem, harmónia, fontos döntés, egyesülés, vonzalom. Gyakran a keresztúthoz érkezést jelzi, ahol a szív szerint kell dönteni.
* **Megerősítés:** "A szívem nyitott a mélyen értelmes kapcsolatra."

# 7. A Diadalszekér (The Chariot)
* **Kulcsszavak:** Győzelem, Akaraterő, Irányítás, Haladás, Elszántság.
* **Jelentés:** Győzelem, előrehaladás, önfegyelem, siker az akarat révén. A fekete és fehér szfinx az ellentétes erők uralását jelképezi.
* **Megerősítés:** "Én választom ki, hogy kivé válok, és meggyőződéssel futok felé."`
    },
    {
        id: 'lesson-major-2',
        title: 'A Bolond Útja II. (A Belső Átalakulás: 8-14)',
        description: 'Az igazság keresése és a lélek sötét éjszakája. Mélymerülés a 8-astól a 14-es kártyáig.',
        category: 'major',
        difficulty: 'intermediate',
        xpReward: 70,
        icon: '⚖️',
        relatedCards: ['major-8', 'major-9', 'major-10', 'major-11', 'major-12', 'major-13', 'major-14'],
        quizQuestions: [
            { statement: "Az Erő kártya a fizikai erőszak alkalmazását javasolja.", isTrue: false },
            { statement: "A Remete a belső fény (lámpás) követését tanítja.", isTrue: true },
            { statement: "A Szerencsekerék a ciklusokról és a karmáról szól.", isTrue: true },
            { statement: "A Halál kártya legtöbbször újjászületést és transzformációt jelent.", isTrue: true },
            { statement: "A Mértékletesség az alkímia és az egyensúly lapja.", isTrue: true }
        ],
        content: `A második szakasz a belső felismerésekről, a morális felelősségről és a mély pszichológiai változásokról szól.

# 8. Az Erő (Strength)
* **Kulcsszavak:** Bátorság, Együttérzés, Belső erő, Türelem, Szelídség.
* **Jelentés:** Belső erő, bátorság, a bennünk lévő "állati" szenvedély megszelídítése szeretettel, nem pedig erőszakkal.
* **Megerősítés:** "Szándékosan ragyogtatom együttérzésem és erőm."

# 9. A Remete (The Hermit)
* **Kulcsszavak:** Önvizsgálat, Magány, Bölcsesség, Útmutatás, Reflexió.
* **Jelentés:** Belső útkeresés, elvonulás, bölcsesség, önismeret. A válaszok most nem kívül, hanem a csendben rejlenek.
* **Megerősítés:** "Békében vagyok a csenddel, és figyelek a belső hangomra."

# 10. Szerencsekerék (Wheel of Fortune)
* **Kulcsszavak:** Sors, Változás, Ciklusok, Karma, Szerencse.
* **Jelentés:** Sorsszerű változás, új ciklus kezdete, fordulópont. Arra emlékeztet, hogy minden változik: aki lent van, felkerül, aki fent van, lekerül.
* **Megerősítés:** "Elfogadom az élet körforgását és bízom a sorsomban."

# 11. Az Igazságosság (Justice)
* **Kulcsszavak:** Igazság, Egyensúly, Karma, Felelősség, Integritás.
* **Jelentés:** Igazságosság, objektivitás, döntés, ok-okozat. Most aratjuk le tetteink gyümölcsét.
* **Megerősítés:** "Vállalom a felelősséget tetteimért és az igazságot keresem."

# 12. Az Akasztott Ember (The Hanged Man)
* **Kulcsszavak:** Átadás, Új perspektíva, Várakozás, Elengedés, Megvilágosodás.
* **Jelentés:** Megállás, önkéntes áldozat, elengedés. A fejjel lefelé lógás a világ más megvilágításba helyezését jelképezi.
* **Megerősítés:** "Elengedem az irányítást és bízom a folyamatban."

# 13. A Halál (Death)
* **Kulcsszavak:** Befejezés, Átalakulás, Elengedés, Új kezdet, Újjászületés.
* **Jelentés:** Valaminek a vége, radikális átalakulás. Nem fizikai halált, hanem egy korszak lezárását jelzi, ami szükséges az újhoz.
* **Megerősítés:** "Elengedem a régit, és bizalommal nyitok az új felé."

# 14. A Mértékletesség (Temperance)
* **Kulcsszavak:** Egyensúly, Mértékletesség, Türelem, Harmónia, Alkímia.
* **Jelentés:** Gyógyulás, türelem, harmónia. Két különböző minőség összevegyítése egy új, magasabb rendű egységgé.
* **Megerősítés:** "Harmóniát teremtek testemben, lelkemben és szellememben."`
    },
    {
        id: 'lesson-major-3',
        title: 'A Bolond Útja III. (A Szellem Felszabadulása: 15-21)',
        description: 'A sötétség legyőzése és a kozmikus egység megélése. Részletes elemzés a 15-től a 21-es kártyáig.',
        category: 'major',
        difficulty: 'advanced',
        xpReward: 80,
        icon: '🌟',
        relatedCards: ['major-15', 'major-16', 'major-17', 'major-18', 'major-19', 'major-20', 'major-21'],
        quizQuestions: [
            { statement: "Az Ördög kártya a fizikai rabságot és a tudatlanságot szimbolizálja.", isTrue: true },
            { statement: "A Torony kártya a biztonságos építkezés lapja.", isTrue: false },
            { statement: "A Csillag a reményt és a spirituális inspirációt hozza.", isTrue: true },
            { statement: "A Nap kártya a sikert és a gyermeki örömöt jelenti.", isTrue: true },
            { statement: "A Világ a beteljesülést és a ciklus sikeres lezárását jelzi.", isTrue: true }
        ],
        content: `Az út utolsó szakasza a korlátok ledöntéséről, az illúziók felismeréséről és a végső megvilágosodásról szól.

# 15. Az Ördög (The Devil)
* **Kulcsszavak:** Függőség, Anyagiasság, Kötődés, Árnyék, Felszabadulás.
* **Jelentés:** Függőség, kísértés, anyagiasság, saját árnyékunk. Felismeri, hogy a láncok valójában lazák, mi tartjuk magunkat fogva.
* **Megerősítés:** "Felismerem árnyékomat és a fény felé fordulok."

# 16. A Torony (The Tower)
* **Kulcsszavak:** Hirtelen változás, Káosz, Felismerés, Összeomlás, Ébredés.
* **Jelentés:** Hirtelen változás, katasztrófa, összeomlás. Lerombolja a hamis biztonságérzetet, hogy helyet adjon az igazságnak.
* **Megerősítés:** "Bátran fogadom a változást, amely felszabadít."

# 17. A Csillag (The Star)
* **Kulcsszavak:** Remény, Hit, Inspiráció, Gyógyulás, Cél.
* **Jelentés:** Remény, inspiráció, jövőkép, gyógyulás. A vihar utáni csend és a tiszta éjszakai égbolt fénye.
* **Megerősítés:** "Bízom az Univerzumban és követem a belső fényemet."

# 18. A Hold (The Moon)
* **Kulcsszavak:** Illúzió, Félelem, Tudatalatti, Intuíció, Misztikum.
* **Jelentés:** Illúzió, bizonytalanság, álmok. Utazás a lélek sötét, ismeretlen tájain keresztül.
* **Megerősítés:** "Bátran szembenézek a félelmeimmel és bízom a megérzéseimben."

# 19. A Nap (The Sun)
* **Kulcsszavak:** Öröm, Siker, Vitalitás, Pozitivitás, Boldogság.
* **Jelentés:** Öröm, siker, optimizmus, vitalitás. A teljes tudatosság és a gyermeki, tiszta létezés állapota.
* **Megerősítés:** "Élvezem az életet és sugárzom a boldogságot."

# 20. A Feltámadás (Judgement)
* **Kulcsszavak:** Újjászületés, Hívás, Megbocsátás, Ébredés, Felismerés.
* **Jelentés:** Megváltás, újjászületés, hívó szó. Megszabadulás a múlt terheitől és az új élet kezdete.
* **Megerősítés:** "Megbocsátok magamnak és másoknak, és szabadon élek."

# 21. A Világ (The World)
* **Kulcsszavak:** Beteljesülés, Egység, Utazás, Siker, Teljesség.
* **Jelentés:** Beteljesülés, célba érés, teljesség. A ciklus bezárult, a tánc tökéletes, egységben vagyunk a mindenséggel.
* **Megerősítés:** "Egy vagyok a világgal, és a világ egy velem."`
    }
];