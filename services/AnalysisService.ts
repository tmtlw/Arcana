
import { Reading, Reading as ReadingType } from '../types';
import { FULL_DECK } from '../constants';

export const AnalysisService = {
    generateMonthlyReport: async (stats: any, readings: Reading[]): Promise<string> => {
        // Heuristic Generation
        const elementMsg = {
            'Tűz': "A cselekvés és a szenvedély tüze hajtotta ezt a hónapot. Sok energiád volt, amit alkotásra vagy konfliktusok rendezésére fordíthattál.",
            'Víz': "Érzelmileg mély időszakon vagy túl. Az intuíciód felerősödött, és a lelki béke keresése került előtérbe.",
            'Levegő': "A gondolatok és a kommunikáció uralták a napjaidat. Fontos felismerésekre juthattál és tisztáztál helyzeteket.",
            'Föld': "A stabilitás és az anyagi ügyek voltak fókuszban. Kézzelfogható eredményeket értél el kitartó munkával."
        }[stats.dominantElement as string] || "Kiegyensúlyozott energiák jellemeztek.";

        const topCard = stats.topCard;
        const adviceMsg = topCard.advice || topCard.affirmation || 'Bízz a belső hangodban és a megérzéseidben.';

        let themeText = "";
        if (stats.dominantElement === 'Víz' || topCard.suit === 'Kelyhek') {
            themeText = "A szíved szava és a kapcsolataid ápolása.";
        } else if (stats.dominantElement === 'Föld' || topCard.suit === 'Érmék') {
            themeText = "Karrier építés és az otthon stabilitásának megteremtése.";
        } else if (stats.dominantElement === 'Tűz' || topCard.suit === 'Botok') {
            themeText = "Önmegvalósítás és bátor kezdeményezések.";
        } else {
            themeText = "Objektív döntéshozatal és tanulás.";
        }

        // Feature: Inline card images in Markdown
        // Using a custom syntax that the MarkdownRenderer can handle or just regular markdown with IDs
        // For now, we'll embed some HTML-like markers that we can post-process or use in the UI.

        return `
### 🔮 Összegzés
${elementMsg} A hónap során **${stats.readingCount} alkalommal** kértél útmutatást.

### 🃏 A Hónap Lapja
A(z) **${topCard.name}** volt a legmeghatározóbb.
![card](${topCard.id})

### 🗝️ Főbb Témák
*   **Fókusz:** ${themeText}
*   **Kihívás:** A domináns ${stats.dominantElement} elem árnyoldala lehetett a ${stats.dominantElement === 'Tűz' ? 'türelmetlenség' : stats.dominantElement === 'Víz' ? 'túlérzékenység' : stats.dominantElement === 'Levegő' ? 'túlgondolás' : 'merevség'}, amivel meg kellett küzdened.

### 🌙 Havi Tanács
*"${adviceMsg}"*
        `;
    }
};
