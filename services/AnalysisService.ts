
import { Reading } from '../types';
import { FULL_DECK } from '../constants';

export const AnalysisService = {
    generateMonthlyReport: async (stats: any, readings: Reading[]): Promise<string> => {
        // Heuristic Generation (Reliable and fast)
        // In a real scenario with Gemini API configured, we would fetch here.

        const elementMsg = {
            'Tűz': "A cselekvés és a szenvedély tüze hajtotta ezt a hónapot. Sok energiád volt, amit alkotásra vagy konfliktusok rendezésére fordíthattál.",
            'Víz': "Érzelmileg mély időszakon vagy túl. Az intuíciód felerősödött, és a lelki béke keresése került előtérbe.",
            'Levegő': "A gondolatok és a kommunikáció uralták a napjaidat. Fontos felismerésekre juthattál és tisztáztál helyzeteket.",
            'Föld': "A stabilitás és az anyagi ügyek voltak fókuszban. Kézzelfogható eredményeket értél el kitartó munkával."
        }[stats.dominantElement as string] || "Kiegyensúlyozott energiák jellemeztek.";

        const adviceMsg = stats.topCard.advice || stats.topCard.affirmation || 'Bízz a belső hangodban és a megérzéseidben.';

        let themeText = "";
        if (stats.dominantElement === 'Víz' || stats.topCard.suit === 'Kelyhek') {
            themeText = "A szíved szava és a kapcsolataid ápolása.";
        } else if (stats.dominantElement === 'Föld' || stats.topCard.suit === 'Érmék') {
            themeText = "Karrier építés és az otthon stabilitásának megteremtése.";
        } else if (stats.dominantElement === 'Tűz' || stats.topCard.suit === 'Botok') {
            themeText = "Önmegvalósítás és bátor kezdeményezések.";
        } else {
            themeText = "Objektív döntéshozatal és tanulás.";
        }

        return `
### 🔮 Összegzés
${elementMsg} A hónap során **${stats.readingCount} alkalommal** kértél útmutatást, ami ${stats.readingCount > 5 ? "intenzív útkeresést" : "megfontolt haladást"} jelez. A(z) **${stats.topCard.name}** gyakori felbukkanása azt súgja, hogy a(z) *${stats.topCard.keywords?.[0] || 'változás'}* témaköre központi szerepet játszott.

### 🗝️ Főbb Témák
*   **Fókusz:** ${themeText}
*   **Kihívás:** A domináns ${stats.dominantElement} elem árnyoldala lehetett a ${stats.dominantElement === 'Tűz' ? 'türelmetlenség' : stats.dominantElement === 'Víz' ? 'túlérzékenység' : stats.dominantElement === 'Levegő' ? 'túlgondolás' : 'merevség'}, amivel meg kellett küzdened.

### 🌙 Havi Tanács
*"${adviceMsg}"*
        `;
    }
};
