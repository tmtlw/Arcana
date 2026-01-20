
import { Card } from '../../../types';

export const MAJOR_ARCANA: Card[] = [
    {
        id: 'major-0', name: 'A Bolond', nameEn: 'The Fool', arcana: 'Major', number: 0,
        element: 'Levegő', astrology: 'Uránusz', numerology: '0',
        keywords: ['Új kezdet', 'Lelkesedés', 'Kaland', 'Lehetőség', 'Spontaneitás'],
        meaningUpright: 'Új kezdetek, lelkesedés, kalandok, friss lehetőségek, a lehetőség arra, hogy életre keltsd álmaidat.',
        meaningReversed: 'Naivitás, feltételezve, hogy már megvan a válasz, kiütéses döntések.',
        generalMeaning: 'A Bolond a bennünk élő gyermeket szimbolizálja. Spontán újrakezdést és elfogulatlan nyitottságot jelent.',
        loveMeaning: 'Vidám, bonyodalmaktól mentes, életigenlő kapcsolatot jelez.',
        careerMeaning: 'Új területre lépünk, ahol még nincs tapasztalatunk, de tele vagyunk kíváncsisággal.',
        advice: 'Légy nyitott és előítéletektől mentes! Merj kockáztatni.',
        dailyMeaning: 'Légy ma spontán! Engedd el a görcsös irányítást.',
        yearlyMeaning: 'Ez az év az új kezdetek éve. Merj belevágni az ismeretlenbe!',
        questions: ['Ha tudnád, hogy az Univerzum repülés közben elkap, hova ugranál?'],
        affirmation: "Felébresztem a lelkem ösvényét, és készen állok a kalandra.",
        imageUrl: 'https://myralog.hu/tarot/major-0.jpg',
        shortDesc: 'A Tiszta Kezdet',
        decision: 'Igen',
        colors: [
            { id: 'c1', colorCode: '#FFFF00', description: 'Fény, vidámság' },
            { id: 'c2', colorCode: '#FFFFFF', description: 'Tisztaság, ártatlanság' }
        ],
        comparison: {
            title: 'Bolond vs. Mágus',
            text: 'Míg a Bolond a terv nélküli, tiszta potenciál és a hit útján jár, a Mágus már tudatosan használja az eszközeit a manifesztációhoz. A Bolondnál az ösztön vezérel, a Mágusnál az akarat.',
            relatedCardId: 'major-1'
        }
    },
    {
        id: 'major-1', name: 'A Mágus', nameEn: 'The Magician', arcana: 'Major', number: 1,
        element: 'Levegő', astrology: 'Merkúr', numerology: '1',
        keywords: ['Készségek', 'Erő', 'Manifesztáció', 'Fókusz', 'Teremtés'],
        meaningUpright: 'Készségek, természetes adottságok, erő, vágyaid kifejezésének képessége.',
        meaningReversed: 'Kihasználatlan potenciál, lappangó tehetségek, manipuláció.',
        generalMeaning: 'A Mágus az aktív cselekvést, a tudatosságot and az élet irányításának képességét jelenti.',
        loveMeaning: 'Erős vonzerőt és kezdeményezőkészsééget jelez.',
        careerMeaning: 'Sikeres vizsgákat, tárgyalásokat vagy projekteket jelez.',
        advice: 'Vedd kezedbe az irányítást! Használd a tehetségedet.',
        dailyMeaning: 'Ma minden sikerülhet, ha aktívan teszel érte.',
        yearlyMeaning: 'Ebben az évben a kezedbe veheted a sorsodat. Aktív, teremtő év vár rád.',
        questions: ['Milyen eszközök állnak rendelkezésére, amelyeket nem használ ki maradéktalanul?'],
        affirmation: "Kinyilvánítom az általam kívánt életet az energia és a szándék révén.",
        imageUrl: 'https://myralog.hu/tarot/major-1.jpg',
        decision: 'Igen',
        colors: [
            { id: 'c1', colorCode: '#FF0000', description: 'Akarat, cselekvés' },
            { id: 'c2', colorCode: '#FFFFFF', description: 'Szellemi tisztaság' }
        ]
    },
    {
        id: 'major-2', name: 'A Főpapnő', nameEn: 'The High Priestess', arcana: 'Major', number: 2,
        element: 'Víz', astrology: 'Hold', numerology: '2',
        keywords: ['Intuíció', 'Álmok', 'Csend', 'Titkok', 'Misztikum'],
        meaningUpright: 'Intuíció, álmok, tudatalatti üzenetek, passzivitás, várakozás.',
        meaningReversed: 'Titkok, pletykák, a belső hang figyelmen kívül hagyása.',
        generalMeaning: 'A Főpapnő a tudattalan erőinket, az intuíciót és a megérzéseket képviseli.',
        loveMeaning: 'Mély lelki összetartozást, empátiát és megértést jelez.',
        careerMeaning: 'Olyan feladatokat jelez, ahol pszichológiai érzékre vagy intuícióra van szükség.',
        advice: 'Ne cselekedj elhamarkodottan! Várj, figyelj befelé.',
        dailyMeaning: 'Ma hagyatkozz az ösztöneidre. Figyelj az álmokra.',
        yearlyMeaning: 'Ez az év a belső utazás éve. Fontos felismerésekre juthatsz.',
        questions: ['Hogyan lépsz kapcsolatba intuitív szíveddel?'],
        affirmation: "A hit az intuitív szívemben van.",
        imageUrl: 'https://myralog.hu/tarot/major-2.jpg',
        decision: 'Talán (Passzivitás)',
        colors: [
            { id: 'c1', colorCode: '#00008B', description: 'Tudatalatti, mélység' },
            { id: 'c2', colorCode: '#C0C0C0', description: 'Holdfény, intuíció' }
        ]
    },
    {
        id: 'major-3', name: 'Az Uralkodónő', nameEn: 'The Empress', arcana: 'Major', number: 3,
        element: 'Föld', astrology: 'Vénusz', numerology: '3',
        keywords: ['Termékenység', 'Bőség', 'Gondoskodás', 'Kreativitás', 'Anyaság'],
        meaningUpright: 'Termékenység, kreativitás, bőség, anyaság, érzékiség, új dolgok születése.',
        meaningReversed: 'Kreatív blokkok, függőség, elhanyagolás.',
        generalMeaning: 'Az Uralkodónő a természet kifogyhatatlan erejét és a növekedést jelképezi.',
        loveMeaning: 'Érzéki élvezeteket, szenvedélyt és védettséget jelent.',
        careerMeaning: 'Kreativitást, új ötletek születését és növekedést jelez.',
        advice: 'Légy kreatív és élvezd az életet! Tápláld azt, ami növekedni akar.',
        dailyMeaning: 'Menj ki a természetbe, alkoss valamit. Ma a bőség vesz körül.',
        yearlyMeaning: 'Termékeny év vár rád. Amit most elvetsz, az bőségesen fog teremni.',
        questions: ['Készen állok megszülni __________.'],
        affirmation: "Megszülöm bőségesen gazdag jövőmet.",
        imageUrl: 'https://myralog.hu/tarot/major-3.jpg',
        decision: 'Igen',
        colors: [
            { id: 'c1', colorCode: '#008000', description: 'Termékenység, természet' },
            { id: 'c2', colorCode: '#FFC0CB', description: 'Szeretet, gondoskodás' }
        ]
    },
    {
        id: 'major-4', name: 'Az Uralkodó', nameEn: 'The Emperor', arcana: 'Major', number: 4,
        element: 'Tűz', astrology: 'Kos', numerology: '4',
        keywords: ['Vezetés', 'Struktúra', 'Hatalom', 'Rend', 'Stratégia'],
        meaningUpright: 'Struktúra, stabilitás, tekintély, apaság, logikus döntések.',
        meaningReversed: 'Zsarnokság, merevség, kontrollmánia.',
        generalMeaning: 'Az Uralkodó a rendet, a struktúrát és a biztonságot képviseli.',
        loveMeaning: 'Stabilitást és biztonságot jelent a kapcsolatban.',
        careerMeaning: 'Sikert, vezetői pozíciót, strukturált megvalósítást jelent.',
        advice: 'Teremts rendet! Húzd meg a határaidat és légy következetes.',
        dailyMeaning: 'Ma légy határozott és rendezd a soraidat.',
        yearlyMeaning: 'Az építkezés és a stabilizáció éve. Most alapozhatod meg a jövődet.',
        questions: ['Mit építesz, és hogyan fog kinézni, ha elkészültél?'],
        affirmation: "Magabiztossággal és tekintéllyel vezetem az életemet.",
        imageUrl: 'https://myralog.hu/tarot/major-4.jpg',
        decision: 'Igen (Struktúrált)',
        colors: [
            { id: 'c1', colorCode: '#8B0000', description: 'Hatalom, stabilitás' },
            { id: 'c2', colorCode: '#FF0000', description: 'Energia, tűz' }
        ]
    },
    {
        id: 'major-5', name: 'A Főpap', nameEn: 'The Hierophant', arcana: 'Major', number: 5,
        element: 'Föld', astrology: 'Bika', numerology: '5',
        keywords: ['Hagyomány', 'Hit', 'Tanítás', 'Spirituális vezető', 'Bölcsesség'],
        meaningUpright: 'Spirituális útmutatás, hagyományok, házasság, tanulás, hit.',
        meaningReversed: 'Dogmatizmus, lázadás a normák ellen, képmutatás.',
        generalMeaning: 'A Főpap a bizalom, a hit és a mélyebb értelem keresésének kártyája.',
        loveMeaning: 'A bizalom és az egymás iránti elköteleződés növekedését jelzi.',
        careerMeaning: 'Megtaláljuk hivatásunk értelmét. Tanári pálya vagy mentorálás.',
        advice: 'Keresd a dolgok mélyebb értelmét! Tarts ki az elveid mellett.',
        dailyMeaning: 'Ma találkozhatsz valakivel, aki fontos tanácsot ad.',
        yearlyMeaning: 'Ez az év a bizalom és az értelemkeresés jegyében telik.',
        questions: ['Milyen hiedelem áll az álmaid útjában?'],
        affirmation: "Én vagyok a saját gurum, de tisztelem a hagyomány bölcsességét.",
        imageUrl: 'https://myralog.hu/tarot/major-5.jpg',
        decision: 'Igen (Ha etikus)',
        colors: [
            { id: 'c1', colorCode: '#808080', description: 'Bölcsesség, semlegesség' },
            { id: 'c2', colorCode: '#FFD700', description: 'Isteni tudás' }
        ]
    },
    {
        id: 'major-6', name: 'A Szeretők', nameEn: 'The Lovers', arcana: 'Major', number: 6,
        element: 'Levegő', astrology: 'Ikrek', numerology: '6',
        keywords: ['Szerelem', 'Választás', 'Harmónia', 'Kapcsolat', 'Egység'],
        meaningUpright: 'Szerelem, harmónia, fontos döntés, egyesülés, vonzalom.',
        meaningReversed: 'Döntésképtelenség, diszharmónia, elválás, hűtlenség.',
        generalMeaning: 'A Szeretők kártyája a nagy szerelmet és a szükségszerű döntést öleli fel.',
        loveMeaning: 'A nagy szerelem kártyája. Mély érzelmi kapcsolatot és boldogságot jelez.',
        careerMeaning: 'Szenvedéllyel végzett munkát vagy teljes elköteleződést jelent.',
        advice: 'Dönts szívből! Egyesítsd az erőidet másokkal.',
        dailyMeaning: 'Ma döntéshelyzetbe kerülhetsz. Válaszd azt, amihez a szíved húz.',
        yearlyMeaning: 'A szív döntéseinek éve. Elköteleződés egy fontos ügy mellett.',
        questions: ['Képes vagy ebben az időben teljesen beleállni egy partnerségbe?'],
        affirmation: "A szívem nyitott a mélyen értelmes kapcsolatra.",
        imageUrl: 'https://myralog.hu/tarot/major-6.jpg',
        decision: 'Igen',
        colors: [
            { id: 'c1', colorCode: '#FFC0CB', description: 'Szerelem' },
            { id: 'c2', colorCode: '#FFFF00', description: 'Tudatosság a döntésben' }
        ]
    },
    {
        id: 'major-7', name: 'A Diadalszekér', nameEn: 'The Chariot', arcana: 'Major', number: 7,
        element: 'Víz', astrology: 'Rák', numerology: '7',
        keywords: ['Győzelem', 'Akaraterő', 'Irányítás', 'Haladás', 'Elszántság'],
        meaningUpright: 'Győzelem, előrehaladás, önfegyelem, utazás, siker az akarat révén.',
        meaningReversed: 'Irányítás elvesztése, agresszió, akadályok.',
        generalMeaning: 'A Diadalszekér a lendületet és az új utakra lépést jelképezi.',
        loveMeaning: 'Új kapcsolat kezdetét vagy friss lendületet jelez.',
        careerMeaning: 'Nagy előrelépést, önállósodást vagy előléptetést jelent.',
        advice: 'Indulj el! Vedd kezedbe a gyeplőt és haladj a célod felé.',
        dailyMeaning: 'Ma lendületben vagy. Használd ki ezt az energiát.',
        yearlyMeaning: 'Az áttörés éve. Ha eddig toporogtál, most végre elindulnak a dolgok.',
        questions: ['Merre tartasz? Ön átvette a kormányt?'],
        affirmation: "Én választom ki, hogy kivé válok, és meggyőződéssel futok felé.",
        imageUrl: 'https://myralog.hu/tarot/major-7.jpg',
        decision: 'Igen (De cselekedni kell)',
        colors: [
            { id: 'c1', colorCode: '#FFD700', description: 'Győzelem, fény' },
            { id: 'c2', colorCode: '#000000', description: 'Titok, erő' }
        ]
    },
    {
        id: 'major-8', name: 'Az Erő', nameEn: 'Strength', arcana: 'Major', number: 8,
        element: 'Tűz', astrology: 'Oroszlán', numerology: '8',
        keywords: ['Bátorság', 'Együttérzés', 'Belső erő', 'Türelem', 'Szelídség'],
        meaningUpright: 'Belső erő, bátorság, szenvedély megszelídítése, türelem, együttérzés.',
        meaningReversed: 'Gyengeség, önbizalomhiány, nyers ösztönök uralma.',
        generalMeaning: 'Az Erő a belső tartást, a szenvedélyt és a bátorságot jelenti.',
        loveMeaning: 'Szenvedélyes, tüzes kapcsolatot jelez.',
        careerMeaning: 'Teljes bevetést, munkakedvet és kreatív energiákat jelent.',
        advice: 'Légy bátor és szenvedélyes! Használd az erődet bölcsen.',
        dailyMeaning: 'Ma tele vagy energiával. Nézz szembe a félelmeiddel.',
        yearlyMeaning: 'Szenvedélyes és energikus év. Megoldod a nehéz feladatokat.',
        questions: ['Hogyan találhatsz bátorságot a gyengédségben?'],
        affirmation: "Szándékosan ragyogtatom együttérzésem és erőm.",
        imageUrl: 'https://myralog.hu/tarot/major-8.jpg',
        decision: 'Igen',
        colors: [
            { id: 'c1', colorCode: '#FFA500', description: 'Tűz, erő' },
            { id: 'c2', colorCode: '#FFFFFF', description: 'Tisztaság, szellem' }
        ]
    },
    {
        id: 'major-9', name: 'A Remete', nameEn: 'The Hermit', arcana: 'Major', number: 9,
        element: 'Föld', astrology: 'Szűz', numerology: '9',
        keywords: ['Önvizsgálat', 'Magány', 'Bölcsesség', 'Útmutatás', 'Reflexió'],
        meaningUpright: 'Belső útkeresés, elvonulás, bölcsesség, magány, önismeret.',
        meaningReversed: 'Elszigetelődés, magányosság, a tanácsok figyelmen kívül hagyása.',
        generalMeaning: 'A Remete a befelé fordulás és a saját igazságunk megtalálásának kártyája.',
        loveMeaning: 'Érettebb szakaszba lépést vagy szükséges egyedüllétet jelez.',
        careerMeaning: 'Itt az ideje átgondolni, mit is akarsz valójában.',
        advice: 'Vonulj vissza és tisztázd a céljaidat! A válasz benned van.',
        dailyMeaning: 'Ma tölts egy kis időt csendben. Figyelj befelé.',
        yearlyMeaning: 'Az önismeret éve. Fontos döntéseket hozhatsz meg.',
        questions: ['Mit szólna a belső bölcsed, ha megkérdeznéd tőle, mit kell tenned?'],
        affirmation: "Békében vagyok a csenddel, és figyelek a belső hangomra.",
        imageUrl: 'https://myralog.hu/tarot/major-9.jpg',
        decision: 'Talán (Türelem kell)',
        colors: [
            { id: 'c1', colorCode: '#808080', description: 'Elvonulás' },
            { id: 'c2', colorCode: '#0000FF', description: 'Bölcsesség' }
        ]
    },
    {
        id: 'major-10', name: 'Szerencsekerék', nameEn: 'Wheel of Fortune', arcana: 'Major', number: 10,
        element: 'Tűz', astrology: 'Jupiter', numerology: '10',
        keywords: ['Sors', 'Változás', 'Ciklusok', 'Karma', 'Szerencse'],
        meaningUpright: 'Sorsszerű változás, szerencse, új ciklus kezdete, fordulópont.',
        meaningReversed: 'Balszerencse, ellenállás a változásnak, negatív ciklusok.',
        generalMeaning: 'A Szerencsekerék az élet állandó változására emlékeztet.',
        loveMeaning: 'Sorsszerű találkozást vagy változást jelez.',
        careerMeaning: 'Váratlan fordulat a karrierben, általában pozitív.',
        advice: 'Fogadd el a változást! Alkalmazkodj a sorshoz.',
        dailyMeaning: 'Ma váratlan dolgok történhetnek. Légy rugalmas.',
        yearlyMeaning: 'A sorsfordító változások éve. Új irányt vehet az életed.',
        questions: ['Hiszel abban, hogy a sorsod elkerülhetetlen, vagy te alakítod azt?'],
        affirmation: "Elfogadom az élet körforgását és bízom a sorsomban.",
        imageUrl: 'https://myralog.hu/tarot/major-10.jpg',
        decision: 'Igen (Szerencsés fordulat)',
        colors: [
            { id: 'c1', colorCode: '#FFA500', description: 'Változás' },
            { id: 'c2', colorCode: '#0000FF', description: 'Bölcsesség' }
        ]
    },
    {
        id: 'major-11', name: 'Az Igazságosság', nameEn: 'Justice', arcana: 'Major', number: 11,
        element: 'Levegő', astrology: 'Mérleg', numerology: '11',
        keywords: ['Igazság', 'Egyensúly', 'Karma', 'Felelősség', 'Integritás'],
        meaningUpright: 'Igazságosság, objektivitás, döntés, ok-okozat, jogi ügyek.',
        meaningReversed: 'Igazságtalanság, részrehajlás, felelősséghárítás.',
        generalMeaning: 'Az Igazságosság az objektivitást és a felelősségvállalást jelenti.',
        loveMeaning: 'Az egyenjogúság és az őszinteség fontosságát hangsúlyozza.',
        careerMeaning: 'Világos helyzetértékelést és reális célokat követel.',
        advice: 'Légy objektív és fair! Vállald a felelősséget.',
        dailyMeaning: 'Ma légy megfontolt és igazságos.',
        yearlyMeaning: 'A felelősségvállalás éve. Most aratod le, amit vetettél.',
        questions: ['Hol vagy kiegyensúlyozatlan az életedben?'],
        affirmation: "Vállalom a felelősséget tetteimért and az igazságot keresem.",
        imageUrl: 'https://myralog.hu/tarot/major-11.jpg',
        decision: 'Attól függ (Karma)',
        colors: [
            { id: 'c1', colorCode: '#FF0000', description: 'Cselekvés' },
            { id: 'c2', colorCode: '#008000', description: 'Egyensúly' }
        ]
    },
    {
        id: 'major-12', name: 'Az Akasztott Ember', nameEn: 'The Hanged Man', arcana: 'Major', number: 12,
        element: 'Víz', astrology: 'Neptunusz', numerology: '12',
        keywords: ['Átadás', 'Új perspektíva', 'Várakozás', 'Elengedés', 'Megvilágosodás'],
        meaningUpright: 'Megállás, új nézőpont, áldozat, elengedés, türelem.',
        meaningReversed: 'Stagnálás, mártíromság, hiábavaló áldozat.',
        generalMeaning: 'Az Akasztott Ember kényszerű megállást és nézőpontváltást jelez.',
        loveMeaning: 'Elakadást jelez a kapcsolatban. Most nem tudsz előre lépni.',
        careerMeaning: 'A dolgok nem haladnak. A kényszerpihenő hasznos lehet.',
        advice: 'Változtass nézőpontot! Légy türelmes.',
        dailyMeaning: 'Ma semmi sem úgy alakul, ahogy tervezted. Fogadd el.',
        yearlyMeaning: 'A fordulópont éve. Mély belső átalakulás várható.',
        questions: ['Mi az, amihez túl erősen ragaszkodsz?'],
        affirmation: "Elengedem az irányítást és bízom a folyamatban.",
        imageUrl: 'https://myralog.hu/tarot/major-12.jpg',
        decision: 'Nem (Most még nem)',
        colors: [
            { id: 'c1', colorCode: '#0000FF', description: 'Nyugalom, víz' },
            { id: 'c2', colorCode: '#FFFF00', description: 'Megvilágosodás' }
        ]
    },
    {
        id: 'major-13', name: 'A Halál', nameEn: 'Death', arcana: 'Major', number: 13,
        element: 'Víz', astrology: 'Skorpió', numerology: '13',
        keywords: ['Befejezés', 'Átalakulás', 'Elengedés', 'Új kezdet', 'Újjászületés'],
        meaningUpright: 'Vége valaminek, átalakulás, elengedés, elkerülhetetlen változás.',
        meaningReversed: 'Ragaszkodás a múlthoz, félelem a változástól.',
        generalMeaning: 'A Halál a radikális változást és az elengedést szimbolizálja.',
        loveMeaning: 'Egy életszakasz vagy kapcsolat végét jelentheti.',
        careerMeaning: 'Búcsút a régi munkahelytől. Engedd el a régit.',
        advice: 'Engedd el! Ne ragaszkodj ahhoz, ami már idejétmúlt.',
        dailyMeaning: 'Ma valami véget érhet. Zárd le a múltat.',
        yearlyMeaning: 'A nagy átalakulás éve. Fontos dolgokat fogsz lezárni.',
        questions: ['Mi az, aminek meg kell halnia az életedben, hogy te élhess?'],
        affirmation: "Elengedem a régit, és bizalommal nyitok az új felé.",
        imageUrl: 'https://myralog.hu/tarot/major-13.jpg',
        decision: 'Nem (Vége)',
        colors: [
            { id: 'c1', colorCode: '#000000', description: 'Vég' },
            { id: 'c2', colorCode: '#FFFFFF', description: 'Új kezdet' }
        ]
    },
    {
        id: 'major-14', name: 'A Mértékletesség', nameEn: 'Temperance', arcana: 'Major', number: 14,
        element: 'Tűz', astrology: 'Nyilas', numerology: '14',
        keywords: ['Egyensúly', 'Mértékletesség', 'Türelem', 'Harmónia', 'Alkímia'],
        meaningUpright: 'Egyensúly, gyógyulás, türelem, harmónia, megfelelő mérték.',
        meaningReversed: 'Egyensúlyhiány, túlzások, türelmetlenség.',
        generalMeaning: 'A Mértékletesség a belső béke és a harmónia kártyája.',
        loveMeaning: 'Harmonikus, békés kapcsolatot jelez.',
        careerMeaning: 'Kellemes, stresszmentes munkakörnyezetet jelent.',
        advice: 'Légy türelmes és mértéktartó! Keresd az arany középutat.',
        dailyMeaning: 'Ma a harmónia és a nyugalom napja van.',
        yearlyMeaning: 'A gyógyulás éve. Most megtalálhatod a belső békédet.',
        questions: ['Életed mely területén van szükség több egyensúlyra?'],
        affirmation: "Harmóniát teremtek testemben, lelkemben és szellememben.",
        imageUrl: 'https://myralog.hu/tarot/major-14.jpg',
        decision: 'Igen (Lassan)',
        colors: [
            { id: 'c1', colorCode: '#ADD8E6', description: 'Gyógyulás' },
            { id: 'c2', colorCode: '#FFA500', description: 'Energia' }
        ]
    },
    {
        id: 'major-15', name: 'Az Ördög', nameEn: 'The Devil', arcana: 'Major', number: 15,
        element: 'Föld', astrology: 'Bak', numerology: '15',
        keywords: ['Függőség', 'Anyagiasság', 'Kötődés', 'Árnyék', 'Felszabadulás'],
        meaningUpright: 'Függőség, kísértés, anyagiasság, szexualitás, saját árnyékunk.',
        meaningReversed: 'Megszabadulás a láncoktól, felismerés, a függőség vége.',
        generalMeaning: 'Az Ördög a függőségeinket és félelmeinket jelképezi.',
        loveMeaning: 'Szenvedélyes, de gyakran egészségtelen kapcsolatot jelez.',
        careerMeaning: 'Tisztességtelen üzleteket vagy rabszolgaság-érzést jelent.',
        advice: 'Nézz szembe az árnyékoddal! A láncok lazák.',
        dailyMeaning: 'Ma kísértésbe eshetsz. Ne hagyd, hogy a félelem irányítson.',
        yearlyMeaning: 'Az árnyékmunka éve. Szembesülsz a sötét oldaladdal.',
        questions: ['Mi az, ami rabságban tart?'],
        affirmation: "Felismerem árnyékomat és a fény felé fordulok.",
        imageUrl: 'https://myralog.hu/tarot/major-15.jpg',
        decision: 'Nem (Kötöttség)',
        colors: [
            { id: 'c1', colorCode: '#000000', description: 'Sötétség' },
            { id: 'c2', colorCode: '#FFA500', description: 'Tűz' }
        ]
    },
    {
        id: 'major-16', name: 'A Torony', nameEn: 'The Tower', arcana: 'Major', number: 16,
        element: 'Tűz', astrology: 'Mars', numerology: '16',
        keywords: ['Hirtelen változás', 'Káosz', 'Felismerés', 'Összeomlás', 'Ébredés'],
        meaningUpright: 'Hirtelen változás, katasztrófa, összeomlás, megvilágosodás.',
        meaningReversed: 'Félelem a változástól, elkerült katasztrófa.',
        generalMeaning: 'A Torony a hirtelen, sokkoló változás kártyája.',
        loveMeaning: 'Hirtelen szakítást vagy drámai felismerést jelez.',
        careerMeaning: 'Váratlan felmondást vagy projektösszeomlást jelenthet.',
        advice: 'Hagyd, hogy összeomoljon, ami nem stabil! Fogadd el a változást.',
        dailyMeaning: 'Ma valami váratlan dolog történhet. Ne állj ellen.',
        yearlyMeaning: 'A felszabadulás éve. Ami ingatag volt, most ledől.',
        questions: ['Mi az a hamis biztonság, amihez ragaszkodsz?'],
        affirmation: "Bátran fogadom a változást, amely felszabadít.",
        imageUrl: 'https://myralog.hu/tarot/major-16.jpg',
        decision: 'Nem (Hirtelen változás)',
        colors: [
            { id: 'c1', colorCode: '#FF0000', description: 'Katasztrófa, tűz' },
            { id: 'c2', colorCode: '#000000', description: 'Sötétség' }
        ]
    },
    {
        id: 'major-17', name: 'A Csillag', nameEn: 'The Star', arcana: 'Major', number: 17,
        element: 'Levegő', astrology: 'Vízöntő', numerology: '17',
        keywords: ['Remény', 'Hit', 'Inspiráció', 'Gyógyulás', 'Cél'],
        meaningUpright: 'Remény, inspiráció, jövőkép, gyógyulás, spiritualitás.',
        meaningReversed: 'Reménytelenség, hitetlenség, kiábrándultság.',
        generalMeaning: 'A Csillag a remény és a jövőbe vetett hit kártyája.',
        loveMeaning: 'Ígéretes találkozást vagy inspiráló szerelmet jelez.',
        careerMeaning: 'Olyan projektet jelez, aminek hosszú távon nagy jövője van.',
        advice: 'Bízz a jövőben! Ne add fel a reményt.',
        dailyMeaning: 'Ma tele leszel optimizmussal. Higgy a jóban.',
        yearlyMeaning: 'A remény és a tervezés éve. Most vetehetsz el magokat.',
        questions: ['Mi a legmerészebb álmod a jövőre nézve?'],
        affirmation: "Bízom az Univerzumban és követem a belső fényemet.",
        imageUrl: 'https://myralog.hu/tarot/major-17.jpg',
        decision: 'Igen (Reményteljes)',
        colors: [
            { id: 'c1', colorCode: '#ADD8E6', description: 'Remény' },
            { id: 'c2', colorCode: '#FFFF00', description: 'Csillagfény' }
        ]
    },
    {
        id: 'major-18', name: 'A Hold', nameEn: 'The Moon', arcana: 'Major', number: 18,
        element: 'Víz', astrology: 'Halak', numerology: '18',
        keywords: ['Illúzió', 'Félelem', 'Tudatalatti', 'Intuíció', 'Misztikum'],
        meaningUpright: 'Illúzió, félelem, bizonytalanság, álmok, tudatalatti.',
        meaningReversed: 'Félelmek feloldása, tisztánlátás.',
        generalMeaning: 'A Hold a sötétség és a tudatalatti birodalmába vezet.',
        loveMeaning: 'Bizonytalanságot vagy féltékenységet jelez.',
        careerMeaning: 'Félelem a kudarctól. Nem látod tisztán a viszonyokat.',
        advice: 'Ne félj a sötéttől, de légy óvatos! Hallgass az álmaidra.',
        dailyMeaning: 'Ma bizonytalan lehetsz. Ne hozz fontos döntést.',
        yearlyMeaning: 'A próbatétel éve. Szembe kell nézned a félelmeiddel.',
        questions: ['Milyen félelmek tartanak vissza az igazságtól?'],
        affirmation: "Bátran szembenézek a félelmeimmel és bízom a megérzéseimben.",
        imageUrl: 'https://myralog.hu/tarot/major-18.jpg',
        decision: 'Talán (Bizonytalan)',
        colors: [
            { id: 'c1', colorCode: '#C0C0C0', description: 'Holdfény' },
            { id: 'c2', colorCode: '#00008B', description: 'Éjszaka' }
        ]
    },
    {
        id: 'major-19', name: 'A Nap', nameEn: 'The Sun', arcana: 'Major', number: 19,
        element: 'Tűz', astrology: 'Nap', numerology: '19',
        keywords: ['Öröm', 'Siker', 'Vitalitás', 'Pozitivitás', 'Boldogság'],
        meaningUpright: 'Öröm, siker, optimizmus, vitalitás, tisztánlátás, boldogság.',
        meaningReversed: 'Időleges ború, késleltetett siker.',
        generalMeaning: 'A Nap az életörömöt és a sikert jelképezi.',
        loveMeaning: 'Felhőtlen boldogságot és melegséget jelent.',
        careerMeaning: 'Sikert, elismerést és önmegvalósítást jelez.',
        advice: 'Légy optimista és sugározz! Oszd meg az örömödet.',
        dailyMeaning: 'Ma csodálatos napod lesz. Élvezd az életet.',
        yearlyMeaning: 'A napfény éve. Sikeres és energikus időszak vár rád.',
        questions: ['Mi okoz neked tiszta, gyermeki örömöt?'],
        affirmation: "Élvezem az életet és sugárzom a boldogságot.",
        imageUrl: 'https://myralog.hu/tarot/major-19.jpg',
        decision: 'Igen (Egyértelmű)',
        colors: [
            { id: 'c1', colorCode: '#FFFF00', description: 'Napfény' },
            { id: 'c2', colorCode: '#FFA500', description: 'Melegség' }
        ]
    },
    {
        id: 'major-20', name: 'A Feltámadás', nameEn: 'Judgement', arcana: 'Major', number: 20,
        element: 'Tűz', astrology: 'Plútó', numerology: '20',
        keywords: ['Újjászületés', 'Hívás', 'Megbocsátás', 'Ébredés', 'Felismerés'],
        meaningUpright: 'Megváltás, újjászületés, hívó szó, megszabadulás, ítélet.',
        meaningReversed: 'Kétségbeesés, ragaszkodás a rabsághoz.',
        generalMeaning: 'A Feltámadás a megszabadulást és a gyógyulást jelenti.',
        loveMeaning: 'A kapcsolat "feltámadását" vagy új szintre lépését jelentheti.',
        careerMeaning: 'Megtalálod az igazi hivatásodat. Felszabadító változás.',
        advice: 'Kövesd a hívást! Emelkedj felül a kicsinyes gondokon.',
        dailyMeaning: 'Ma megoldódhat egy régi problémád.',
        yearlyMeaning: 'A kincskeresés éve. Megtalálod, amit régóta kerestél.',
        questions: ['Mire hív most az élet?'],
        affirmation: "Megbocsátok magamnak és másoknak, és szabadon élek.",
        imageUrl: 'https://myralog.hu/tarot/major-20.jpg',
        decision: 'Igen (Megújulás)',
        colors: [
            { id: 'c1', colorCode: '#FF4500', description: 'Tűz' },
            { id: 'c2', colorCode: '#ADD8E6', description: 'Szellem' }
        ]
    },
    {
        id: 'major-21', name: 'A Világ', nameEn: 'The World', arcana: 'Major', number: 21,
        element: 'Föld', astrology: 'Szaturnusz', numerology: '21',
        keywords: ['Beteljesülés', 'Egység', 'Utazás', 'Siker', 'Teljesség'],
        meaningUpright: 'Beteljesülés, célba érés, teljesség, világegyetem, utazás.',
        meaningReversed: 'Befejezetlenség, késlekedés, hiányérzet.',
        generalMeaning: 'A Világ a célba érést és a boldog befejezést jelenti.',
        loveMeaning: 'A "megérkezés" érzése a kapcsolatban. Teljes az életed.',
        careerMeaning: 'Elérted a célodat. Sikeresen befejeztél egy projektet.',
        advice: 'Élvezd a sikert! Ismerd fel, hogy minden a helyén van.',
        dailyMeaning: 'Ma minden kerek egész. Örülj a sikereidnek.',
        yearlyMeaning: 'A beteljesülés éve. Boldogság és elégedettség vár.',
        questions: ['Mi az, ami teljessé teszi az életedet?'],
        affirmation: "Egy vagyok a világgal, és a világ egy velem.",
        imageUrl: 'https://myralog.hu/tarot/major-21.jpg',
        decision: 'Igen (Beteljesülés)',
        colors: [
            { id: 'c1', colorCode: '#008000', description: 'Föld, élet' },
            { id: 'c2', colorCode: '#0000FF', description: 'Kozmosz' }
        ]
    }
];
