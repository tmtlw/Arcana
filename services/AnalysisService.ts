import { Reading, Card } from '../types';
import { FULL_DECK } from '../constants';

export const AnalysisService = {
    generateMonthlyReport: async (stats: any, readings: Reading[]): Promise<string> => {
        // Heuristic Generation based on provided stats and readings
        const elementMsg = {
            'Tűz': "A cselekvés és a szenvedély tüze hajtotta ezt a hónapot. Sok energiád volt, amit alkotásra vagy konfliktusok rendezésére fordíthattál. Energikus és kezdeményező voltál.",
            'Víz': "Érzelmileg mély időszakon vagy túl. Az intuíciód felerősödött, és a lelki béke keresése került előtérbe. Az érzelmi rugalmasság volt a kulcs.",
            'Levegő': "A gondolatok és a kommunikáció uralták a napjaidat. Fontos felismerésekre juthattál és tisztáztál helyzeteket. A mentális tisztaság segített a döntésekben.",
            'Föld': "A stabilitás és az anyagi ügyek voltak fókuszban. Kézzelfogható eredményeket értél el kitartó munkával. A türelem és a gyakorlatiasság hozta meg gyümölcsét."
        }[stats.dominantElement as string] || "Kiegyensúlyozott energiák jellemeztek a hónap során.";

        const topCard = stats.topCard as Card;
        const adviceMsg = topCard.advice || topCard.affirmation || 'Bízz a belső hangodban és a megérzéseidben, mert minden válasz ott rejlik a szívedben.';

        let themeText = "";
        if (stats.dominantElement === 'Víz') themeText = "Érzelmi gyógyulás és belső béke.";
        else if (stats.dominantElement === 'Föld') themeText = "Anyagi biztonság és fizikai jóllét.";
        else if (stats.dominantElement === 'Tűz') themeText = "Szenvedélyes projektek és önkifejezés.";
        else themeText = "Intellektuális fejlődés és tiszta kommunikáció.";

        // Calculate arcana ratio
        let majorCount = 0;
        let totalCards = 0;
        readings.forEach(r => {
            r.cards.forEach(c => {
                totalCards++;
                const def = FULL_DECK.find(d => d.id === c.cardId);
                if (def?.arcana === 'Major') majorCount++;
            });
        });
        const majorRatio = totalCards > 0 ? (majorCount / totalCards) : 0;
        const spiritualIntensity = majorRatio > 0.4 ? "Magas (Sorsszerű események)" : majorRatio > 0.2 ? "Közepes (Mindennapi fejlődés)" : "Alacsony (Gyakorlati fókusz)";

        return `
### 🔮 Összegzés
${elementMsg}

Ebben a hónapban összesen **${stats.readingCount} alkalommal** ültél le a lapok mellé. A spirituális intenzitásod: **${spiritualIntensity}**.

### 🃏 A Hónap Lapja: ${topCard.name}
Ez a lap kísérte végig az utadat a leggyakrabban, emlékeztetve téged belső erődre.

![card](${topCard.id})

### 🗝️ Kulcsfontosságú Területek
*   **Fókusz:** ${themeText}
*   **Kihívás:** A domináns **${stats.dominantElement}** elem túlsúlya néha ${stats.dominantElement === 'Tűz' ? 'türelmetlenséget' : stats.dominantElement === 'Víz' ? 'érzelmi hullámzást' : stats.dominantElement === 'Levegő' ? 'határozatlanságot' : 'makacsságot'} hozhatott.
*   **Tanulság:** Megtanultad, hogyan kezeld a váratlan helyzeteket a belső iránytűd segítségével.

### 🌙 Havi Útravaló
> "${adviceMsg}"

Sok sikert a következő hónaphoz! Legyenek a csillagok veled az utadon.
        `;
    }
};
