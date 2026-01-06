
// --- HOLIDAY & MOON DATA ---
export const HOLIDAY_DETAILS: Record<string, { colors: string, scents: string, crystals: string, ritual: string, meaning: string, quote?: string }> = {
    "Samhain": {
        meaning: "A boszorkányújév, az ősök tisztelete. A fátyol a legvékonyabb az élők és holtak világa között. Az elengedés és a sötét félév kezdete.",
        colors: "Fekete, Narancs, Vörös",
        scents: "Zsálya, Cédrus, Fahéj, Üröm",
        crystals: "Obszidián, Ónix, Füstkvarc",
        ritual: "Gyújts egy fekete gyertyát az ablakban, hogy hazavezesse az ősök szellemét. Írd fel egy papírra, mit szeretnél elengedni az óévből, majd égesd el.",
        quote: "Az ősök nem mögöttünk vannak, hanem bennünk élnek."
    },
    "Yule": {
        meaning: "A téli napforduló, a Fény újjászületése. A leghosszabb éjszaka után a Nap ereje ismét növekedni kezd. A remény ünnepe.",
        colors: "Arany, Zöld, Piros, Ezüst",
        scents: "Fenyő, Narancs, Szegfűszeg, Tömjén",
        crystals: "Hegyikristály, Gránát, Rubin",
        ritual: "Készíts örökzöld koszorút a folytonosság jelképeként. Gyújts arany gyertyát napkeltekor, és köszöntsd a visszatérő fényt.",
        quote: "A legsötétebb órában születik meg a legfényesebb remény."
    },
    "Imbolc": {
        meaning: "A megtisztulás és a fény növekedésének ünnepe. Brigid istennő napja. A természet ébredezése a föld alatt.",
        colors: "Fehér, Világoszöld, Ezüst",
        scents: "Rozmaring, Bazsalikom, Ibolya",
        crystals: "Ametiszt, Holdkő, Türkiz",
        ritual: "Tarts tavaszi nagytakarítást. Tisztítsd meg a teret füstölővel, és ültess el egy magot a vágyaid jelképeként.",
        quote: "A hó alatt már ott dobog a föld szíve."
    },
    "Ostara": {
        meaning: "Tavaszi napéjegyenlőség. Az egyensúly napja: a nappal és az éjszaka egyforma hosszú. A termékenység és az új kezdetek ideje.",
        colors: "Pasztell színek, Sárga, Rózsaszín, Zöld",
        scents: "Jázmin, Rózsa, Orgona",
        crystals: "Aventurin, Rózsakvarc, Citrin",
        ritual: "Fess tojásokat szimbólumokkal. Sétálj a természetben, és keress tavaszi virágokat.",
        quote: "Az élet mindig utat tör magának a fény felé."
    },
    "Beltane": {
        meaning: "A tűz, a szenvedély és a termékenység ünnepe. Az Isten és az Istennő násza. Az életöröm és a vitalitás csúcspontja.",
        colors: "Piros, Zöld, Fehér",
        scents: "Rózsa, Ylang-Ylang, Vanília",
        crystals: "Smaragd, Karneol, Malachit",
        ritual: "Készíts virágkoszorút. Gyújts tüzet (vagy gyertyát), és ugord át jelképesen a megtisztulásért.",
        quote: "Szenvedély nélkül az élet csak várakozás."
    },
    "Litha": {
        meaning: "Nyári napforduló. A Nap erejének csúcspontja. A bőség, a siker és a tündérvilág ünnepe.",
        colors: "Arany, Sárga, Napraforgó-színek",
        scents: "Levendula, Citrom, Kamilla",
        crystals: "Tigrisszem, Borostyán, Citrin",
        ritual: "Gyűjts gyógynövényeket. Hagyj kint egy tál mézet vagy tejet a tündéreknek ajándékba.",
        quote: "A Nap nem kérdezi, kinek ragyoghat, csak adja önmagát."
    },
    "Lammas": {
        meaning: "Az első aratás ünnepe. A hálaadás a termésért és az elvégzett munkáért. A bőség és a felkészülés a télre.",
        colors: "Aranysárga, Barna, Bronz",
        scents: "Szantálfa, Aloe, Rózsa",
        crystals: "Citrin, Aventurin, Mohaachát",
        ritual: "Süss kenyeret, és oszd meg szeretteiddel. Írj hálalistát mindarról, amit ebben az évben elértél.",
        quote: "Amit elvetettél, azt fogod learatni."
    },
    "Mabon": {
        meaning: "Őszi napéjegyenlőség. A második aratás és az egyensúly ünnepe. Felkészülés a sötétségre, a befelé fordulás kezdete.",
        colors: "Bordó, Barna, Narancs, Arany",
        scents: "Zsálya, Alma, Fahéj",
        crystals: "Lápisz Lazuli, Zafír, Sárga Topáz",
        ritual: "Rendezz őszi lakomát szezonális gyümölcsökből. Díszítsd az oltárodat őszi levelekkel.",
        quote: "A természet elengedi leveleit, hogy jövőre megújulhasson."
    },
    "Telihold": {
        meaning: "A tetőzés, a kiteljesedés és az elengedés ideje. Az energiák a csúcson vannak, az intuíció felerősödik.",
        colors: "Ezüst, Fehér, Gyöngyház",
        scents: "Jázmin, Szantál, Mirha",
        crystals: "Holdkő, Szelenit, Hegyikristály",
        ritual: "Holdfürdő: töltsd fel a kristályaidat és a vizedet a Hold fényében.",
        quote: "A Hold a napfény csendes visszfénye lelkünk tükrében."
    },
    "Újhold": {
        meaning: "A kezdetek, a megújulás és a teremtés ideje. A Hold sötét, az energiák befelé fordulnak. Ideális új célok kitűzésére.",
        colors: "Fekete, Sötétkék",
        scents: "Levendula, Citromfű",
        crystals: "Labradorit, Obszidián",
        ritual: "Vágylista írása: fogalmazd meg a céljaidat a következő ciklusra.",
        quote: "A sötétség nem a fény hiánya, hanem az új kezdet méhe."
    },

    // --- ZODIAC SEASONS ---
    "Kos Szezon": {
        meaning: "Az asztrológiai újév kezdete. A Kos tüze energiával, bátorsággal és kezdeményezőkészséggel tölti fel a világot.",
        colors: "Vörös, Narancs, Skarlát",
        scents: "Fekete bors, Gyömbér, Fenyő",
        crystals: "Vörös jáspis, Karneol, Gyémánt",
        ritual: "Kezdj bele egy olyan dologba, amitől eddig féltél. Gyújts vörös gyertyát az akaraterőért.",
        quote: "A bátorság nem a félelem hiánya, hanem a döntés, hogy valami fontosabb nála."
    },
    "Bika Szezon": {
        meaning: "A stabilitás, a fizikai élvezetek és az anyagi bőség ideje. A föld ereje segít lehorgonyozni a terveinket.",
        colors: "Smaragdzöld, Rózsaszín, Földszínek",
        scents: "Rózsa, Pacsuli, Szantálfa",
        crystals: "Smaragd, Rózsakvarc, Szelenit",
        ritual: "Kényeztesd az érzékeidet: főzz egy ízletes vacsorát, vagy ültess növényeket a földbe.",
        quote: "A természet soha nem siet, mégis minden befejeződik."
    },
    "Ikrek Szezon": {
        meaning: "A kommunikáció, a kíváncsiság és a szellemi mozgékonyság időszaka. Ideje kapcsolódni másokhoz és tanulni.",
        colors: "Sárga, Világosszürke, Levendula",
        scents: "Borsmenta, Bergamott, Citromfű",
        crystals: "Achát, Citrin, Tigrisszem",
        ritual: "Írj levelet, naplózz, vagy keress fel egy régi barátot. Tanulj meg egy teljesen új készséget.",
        quote: "Minden ember egy külön világ, de a beszéd híd a világok között."
    },
    "Rák Szezon": {
        meaning: "A család, az otthon és az érzelmi biztonság hónapja. Fordulj befelé és ápold a lelki gyökereidet.",
        colors: "Ezüst, Fehér, Gyöngyház-fény",
        scents: "Kamilla, Jázmin, Lótusz",
        crystals: "Holdkő, Kalcedon, Pearl",
        ritual: "Végezz tértisztítást az otthonodban. Vegyél egy sós, illatos fürdőt az érzelmi megtisztulásért.",
        quote: "A haza nem ott van, ahol lakunk, hanem ott, ahol megértenek minket."
    },
    "Oroszlán Szezon": {
        meaning: "A kreativitás, az önkifejezés és a szív erejének csúcspontja. Ragyogj és merd megmutatni a tehetségedet.",
        colors: "Arany, Narancs, Napos sárga",
        scents: "Tömjén, Fahéj, Keserűnarancs",
        crystals: "Heliotrop (Nap kő), Borostyán, Topáz",
        ritual: "Tarts egy kreatív délutánt: fess, táncolj vagy alkoss valamit, ami tisztán téged tükröz.",
        quote: "Ne azért ragyogj, hogy lássanak, hanem hogy világíts másoknak."
    },
    "Szűz Szezon": {
        meaning: "A rendszerezés, az egészség és a segítőkészség ideje. Tisztítsd meg az életedet a felesleges dolgoktól.",
        colors: "Barna, Olajzöld, Törtfehér",
        scents: "Levendula, Zsálya, Eukaliptusz",
        crystals: "Amazonit, Peridot, Fluorit",
        ritual: "Szelektáld ki a tárgyaidat és a gondolataidat. Tervezd meg az egészségesebb rutinodat.",
        quote: "A rend a lélek nyugalma."
    },
    "Mérleg Szezon": {
        meaning: "A harmónia, az igazság és a párkapcsolatok egyensúlyának időszaka. Keresd a szépséget mindenben.",
        colors: "Pasztellkék, Rózsaszín, Türkiz",
        scents: "Rózsa, Geránium, Ylang-ylang",
        crystals: "Lápisz lazuli, Opál, Zafír",
        ritual: "Teremts békét egy konfliktusodban. Díszítsd fel a környezetedet friss virágokkal.",
        quote: "A harmónia nem a hangok azonossága, hanem az ellentétek egyensúlya."
    },
    "Skorpió Szezon": {
        meaning: "A mélység, a misztérium és a gyökeres átalakulás hónapja. Szembe kell néznünk a belső árnyékainkkal.",
        colors: "Mélyvörös, Fekete, Padlizsán",
        scents: "Pacsuli, Pézsma, Mirha",
        crystals: "Obszidián, Malachit, Gránát",
        ritual: "Végezz árnyékmunkát: írd le a félelmeidet, majd engedd el őket egy rituális égetéssel.",
        quote: "Csak a sötétségben látjuk meg igazán a csillagokat."
    },
    "Nyilas Szezon": {
        meaning: "A kaland, a bölcsesség és a távoli horizontok keresésének ideje. Tágítsd ki a határaidat szellemileg.",
        colors: "Lila, Királykék, Bíbor",
        scents: "Szegfűszeg, Fenyő, Cédrusfa",
        crystals: "Türkiz, Ametiszt, Szodalit",
        ritual: "Tervezd meg a jövőbeli utazásaidat vagy tanulmányaidat. Menj ki a természetbe és nézd a távolt.",
        quote: "Nem az az utazó, aki messzire megy, hanem aki képes máshogy látni."
    },
    "Bak Szezon": {
        meaning: "A fegyelem, a kitartás és a hosszú távú célok elérésének időszaka. Építsd fel a saját belső váradat.",
        colors: "Sötétzöld, Fekete, Palaszürke",
        scents: "Vetiver, Cédrus, Moha",
        crystals: "Ónix, Füstkvarc, Labradorit",
        ritual: "Írd le a következő egy évre szóló konkrét céljaidat és a hozzájuk vezető lépéseket.",
        quote: "A kitartás a tehetség türelmes formája."
    },
    "Vízöntő Szezon": {
        meaning: "Az újítás, a szabadság és a közösségi összefogás hónapja. Merj formabontó lenni és újítani.",
        colors: "Elektromos kék, Ezüst, Ibolya",
        scents: "Csillagánizs, Borsmenta, Teafa",
        crystals: "Akvamarin, Ametiszt, Angelit",
        ritual: "Csatlakozz egy közösséghez, vagy indíts el egy modern, digitális projektet.",
        quote: "Légy te a változás, amit a világban látni akarsz."
    },
    "Halak Szezon": {
        meaning: "Az intuíció, az álmok és az isteni egység megélésének ideje. A kör bezárul, felkészülünk az újrakezdésre.",
        colors: "Tengerzöld, Levendula, Törtfehér",
        scents: "Lótusz, Szantál, Írisz",
        crystals: "Ametiszt, Akvamarin, Holdkő",
        ritual: "Végezz mély meditációt. Vezess álomnaplót, és figyeld a tudatalattid üzeneteit.",
        quote: "A képzelet fontosabb a tudásnál, mert az egész világot átöleli."
    }
};

export const ZODIAC_INFO: Record<string, { sun: string, moon: string, ascendant: string, keywords: string[] }> = {
    "Kos": {
        keywords: ["Határozott", "Bátor", "Első", "Lobbanékony", "Energikus", "Önközpontú"],
        sun: "Tele vagy energiával, kezdeményezőkészséggel és bátorsággal. Született vezető vagy.",
        moon: "Érzelmileg impulzív and szenvedélyes vagy. Gyorsan dühbe gurulsz, de hamar meg is bocsátasz.",
        ascendant: "A külvilág felé határozottnak, energikusnak és néha kicsit harciasnak tűnsz."
    },
    "Bika": {
        keywords: ["Kényelmes", "Megfontolt", "Megbízható", "Higgadt", "Birtokló", "Érzéki"],
        sun: "Gyakorlatias, türelmes és megbízható vagy. Szereted a kényelmet és a szépséget.",
        moon: "Érzelmi biztonságra és stabilitásra vágysz. Hűséges vagy és ragaszkodó.",
        ascendant: "Nyugodt, megfontolt és békés kisugárzásod van. Mások megbízhatónak látnak."
    },
    "Ikrek": {
        keywords: ["Beszédes", "Sokoldalú", "Kíváncsi", "Nyughatatlan", "Okos", "Fürge"],
        sun: "Kíváncsi, kommunikatív és alkalmazkodó vagy. Szereted a változatosságot.",
        moon: "Érzelmeidet szereted racionalizálni és megbeszélni. Szükséged van a mentális ingerekre.",
        ascendant: "Barátságosnak, beszédesnek és fiatalosnak tűnsz. Folyamatosan mozgásban vagy."
    },
    "Rák": {
        keywords: ["Tápláló", "Meleg", "Függő", "Együttérző", "Védelmező", "Biztonságorientált"],
        sun: "Érzékeny, gondoskodó és családcentrikus vagy. Erős az intuíciód.",
        moon: "Mélyen érző és empatikus vagy. A biztonságos otthon a mindened.",
        ascendant: "Kedvesnek, de kissé félénknek vagy távolságtartónak tűnhetsz elsőre."
    },
    "Oroszlán": {
        keywords: ["Kreatív", "Kockázatvállaló", "Karizmatikus", "Szórakoztató", "Nagylelkű", "Izgalmas"],
        sun: "Kreatív, nagylelkű és drámai vagy. Szeretsz a középpontban lenni.",
        moon: "Érzelmileg melegszívű, de büszke vagy. Szükséged van a figyelemre.",
        ascendant: "Magabiztos, sugárzó és karizmatikus a fellépésed."
    },
    "Szűz": {
        keywords: ["Munkamániás", "Alapos", "Hatékony", "Pragmatikus", "Igényes", "Diszkrét"],
        sun: "Analitikus, szorgalmas és maximalista vagy. Szeretsz segíteni másokon.",
        moon: "Érzelmeidet kontrollálod és elemzed. Akkor érzed jól magad, ha hasznos lehetsz.",
        ascendant: "Visszafogottnak, szerénynek és intelligensnek tűnsz."
    },
    "Mérleg": {
        keywords: ["Együttműködő", "Diplomatikus", "Tétovázó", "Versengő", "Esztétikus"],
        sun: "Diplomatikus, bájos és igazságos vagy. Keresed a harmóniát.",
        moon: "Érzelmi biztonságodat a párkapcsolatok adják. Kerülöd a konfliktusokat.",
        ascendant: "Kellemes, mosolygós és vonzó a kisugárzásod."
    },
    "Skorpió": {
        keywords: ["Behatoló", "Intenzív", "Találékony", "Hatalmas", "Kényszeres"],
        sun: "Szenvedélyes, intenzív és titokzatos vagy. Mindent vagy semmit alapon működsz.",
        moon: "Érzelmeid mélyek és viharosak. Nehezen bocsátasz meg, de lojális vagy.",
        ascendant: "Mágikus, átható tekinteted van. Titokzatosnak és erősnek tűnsz."
    },
    "Nyilas": {
        keywords: ["Jószívű", "Optimista", "Tékozló", "Lelkes", "Idealista"],
        sun: "Optimista, kalandvágyó és filozófus alkat vagy. Szereted a szabadságot.",
        moon: "Érzelmileg is a szabadságra vágysz. Nem bírod a korlátokat.",
        ascendant: "Vidám, nyitott és barátságos a fellépésed."
    },
    "Bak": {
        keywords: ["Felelősségteljes", "Formális", "Hagyományos", "Tekintélyelvű", "Karrierorientált"],
        sun: "Céltudatos, fegyelmezett és felelősségteljes vagy. Komolyan veszed az életet.",
        moon: "Érzelmeidet nehezen mutatod ki, szereted megőrizni a hidegvéredet.",
        ascendant: "Komolynak, érettnek és kompetensnek tűnsz. Megbízható vagy."
    },
    "Vízöntő": {
        keywords: ["Egyedi", "Lázadó", "Jövőbe tekintő", "Független", "Találékony", "Objektív"],
        sun: "Eredeti, független és humanitárius vagy. Szeretsz kilógni a sorból.",
        moon: "Érzelmileg távolságtartó lehetsz, fontosabb a barátság.",
        ascendant: "Különcnek, egyedinek és barátságosnak tűnsz."
    },
    "Halak": {
        keywords: ["Együttérző", "Misztikus", "Illuzórikus", "Érzékeny", "Spirituális", "Álmodozó"],
        sun: "Álmodozó, empatikus és művészi lélek vagy. Könnyen ráhangolódsz másokra.",
        moon: "Rendkívül érzékeny vagy a környezeted rezgéseire.",
        ascendant: "Lágynak, titokzatosnak és álomszerűnek tűnsz."
    }
};

export const ASTRO_ASPECTS = [
    { name: "Együttállás", symbol: "☌", degrees: 0, keywords: "Tied/Kevert - Egység, intenzitás, új kezdet" },
    { name: "Szextil", symbol: "✶", degrees: 60, keywords: "Támogatás, segítség, lehetőség" },
    { name: "Kvadrát", symbol: "□", degrees: 90, keywords: "Konfliktus, küzdelem, feszültség" },
    { name: "Trigon", symbol: "△", degrees: 120, keywords: "Megerősítés, harmónia, szerencse" },
    { name: "Kvinkunx", symbol: "⚻", degrees: 150, keywords: "Összeférhetetlen, furcsa, alkalmazkodást igényel" },
    { name: "Oppozíció", symbol: "☍", degrees: 180, keywords: "Szembenállás, mérleghinta, tudatosság" }
];
