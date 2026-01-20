
import React, { useState, useEffect } from 'react';
import { useTarot } from '../context/TarotContext';
import { useTranslation } from '../context/TranslationContext';

const LANG_FILES = {
  'UI Szövegek': {
      hu: 'langs/hu/ui.ts',
      en: 'langs/en/ui.ts',
      de: 'langs/de/ui.ts',
      type: 'object',
      variable: 'UI_TEXTS'
  },
  'Horoszkópok': {
      hu: 'langs/hu/horoscopes.ts',
      en: 'langs/en/horoscopes.ts',
      de: 'langs/de/horoscopes.ts',
      type: 'array',
      variable: 'WESTERN_HOROSCOPES',
      importType: 'WesternHoroscope'
  },
  'Kártyák - Nagy Árkánum': { hu: 'langs/hu/cards/major.ts', en: 'langs/en/cards/major.ts', de: 'langs/de/cards/major.ts', type: 'array', variable: 'MAJOR_ARCANA', importType: 'Card' },
  'Kártyák - Botok': { hu: 'langs/hu/cards/wands.ts', en: 'langs/en/cards/wands.ts', de: 'langs/de/cards/wands.ts', type: 'array', variable: 'WANDS', importType: 'Card' },
  'Kártyák - Kelyhek': { hu: 'langs/hu/cards/cups.ts', en: 'langs/en/cards/cups.ts', de: 'langs/de/cards/cups.ts', type: 'array', variable: 'CUPS', importType: 'Card' },
  'Kártyák - Kardok': { hu: 'langs/hu/cards/swords.ts', en: 'langs/en/cards/swords.ts', de: 'langs/de/cards/swords.ts', type: 'array', variable: 'SWORDS', importType: 'Card' },
  'Kártyák - Érmék': { hu: 'langs/hu/cards/pentacles.ts', en: 'langs/en/cards/pentacles.ts', de: 'langs/de/cards/pentacles.ts', type: 'array', variable: 'PENTACLES', importType: 'Card' }
};

type LangCode = 'hu' | 'en' | 'de';

export const TranslatorDashboard: React.FC = () => {
    const { currentUser, showToast } = useTarot();
    const { t } = useTranslation();
    const [selectedCategory, setSelectedCategory] = useState<string>(Object.keys(LANG_FILES)[0]);
    const [targetLang, setTargetLang] = useState<LangCode>('en');

    // Adatok
    const [sourceData, setSourceData] = useState<any>(null);
    const [targetData, setTargetData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // Titkos kulcs bekérése (egyszerűsített, mivel a ContentEditorból átvehető lenne, de itt újra kérjük vagy props-ból)
    // Ideiglenesen hardcoded vagy props-ként kéne, de most input mező lesz.
    const [secretKey, setSecretKey] = useState('');

    useEffect(() => {
        if (secretKey) loadFiles();
    }, [selectedCategory, targetLang, secretKey]);

    const loadFile = async (path: string, variable: string) => {
        const response = await fetch(`./admin_io.php?action=read&file=${path}`, {
            headers: { 'X-Updater-Secret': secretKey }
        });
        const result = await response.json();
        if (result.error) throw new Error(result.error);

        const content = result.content;
        const regex = new RegExp(`export const ${variable}[\\s\\S]*?=\\s*([\\{\\[][\\s\\S]*[\\}\\]]);`);
        const match = content.match(regex);

        if (match && match[1]) {
            return new Function(`return ${match[1]}`)();
        }
        throw new Error("Nem sikerült parse-olni a fájlt.");
    };

    const loadFiles = async () => {
        setLoading(true);
        try {
            const config = LANG_FILES[selectedCategory as keyof typeof LANG_FILES];

            // Forrás mindig magyar
            const source = await loadFile(config.hu, config.variable);
            setSourceData(source);

            // Cél nyelv
            const targetPath = config[targetLang];
            try {
                const target = await loadFile(targetPath, config.variable);
                setTargetData(target);
            } catch (e) {
                console.warn("Target file not found or empty, creating empty structure based on source.");
                // Ha nincs meg a célfájl, vagy üres, másoljuk a forrás struktúrát de üres értékekkel?
                // Vagy egyszerűen a forrást másoljuk kiindulásnak.
                setTargetData(JSON.parse(JSON.stringify(source)));
            }

        } catch (e: any) {
            showToast(`Hiba: ${e.message}`, 'error');
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!confirm("Biztosan mented a változtatásokat?")) return;
        setLoading(true);
        try {
            const config = LANG_FILES[selectedCategory as keyof typeof LANG_FILES];
            const targetPath = config[targetLang];
            const jsonString = JSON.stringify(targetData, null, 4);

            let fileContent = '';
            if (config.type === 'array') {
                fileContent = `import { ${config.importType} } from '../../types';\n\nexport const ${config.variable}: ${config.importType}[] = ${jsonString};\n`;
            } else {
                fileContent = `export const ${config.variable} = ${jsonString};\n`;
            }

            const response = await fetch(`./admin_io.php?action=write&file=${targetPath}`, {
                method: 'POST',
                headers: {
                    'X-Updater-Secret': secretKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: fileContent })
            });

            const result = await response.json();
            if (result.success) {
                showToast("Sikeres mentés!", "success");
            } else {
                showToast(`Hiba: ${result.error}`, "error");
            }

        } catch (e) {
            showToast("Mentési hiba", "error");
        }
        setLoading(false);
    };

    // Rekurzív szerkesztő mező
    const renderEditor = (data: any, path: string[] = []) => {
        if (typeof data === 'string' || typeof data === 'number') {
            const currentVal = path.reduce((obj, key) => obj?.[key], targetData);
            const sourceVal = path.reduce((obj, key) => obj?.[key], sourceData);

            return (
                <div className="mb-4 bg-white/5 p-2 rounded">
                    <div className="text-xs text-gray-400 mb-1">{path.join('.')}</div>
                    <div className="text-sm text-gold-400 mb-2 border-l-2 border-gold-500/30 pl-2 italic">
                        {String(sourceVal)}
                    </div>
                    {String(sourceVal).length > 50 ? (
                        <textarea
                            className="w-full bg-black/50 text-white p-2 rounded border border-white/10 focus:border-gold-500 outline-none min-h-[80px]"
                            value={String(currentVal)}
                            onChange={(e) => updateTargetData(path, e.target.value)}
                        />
                    ) : (
                        <input
                            type="text"
                            className="w-full bg-black/50 text-white p-2 rounded border border-white/10 focus:border-gold-500 outline-none"
                            value={String(currentVal)}
                            onChange={(e) => updateTargetData(path, e.target.value)}
                        />
                    )}
                </div>
            );
        } else if (Array.isArray(data)) {
            // Ha tömb, akkor iterálunk
            return (
                <div className="pl-4 border-l border-white/10">
                    {data.map((item, idx) => (
                        <div key={idx}>
                             <div className="text-xs font-bold text-gray-500 mt-4">Elem #{idx + 1}</div>
                             {renderEditor(item, [...path, String(idx)])}
                        </div>
                    ))}
                </div>
            );
        } else if (typeof data === 'object' && data !== null) {
             return (
                <div className="pl-4 border-l border-white/10">
                    {Object.keys(data).map(key => (
                        <div key={key}>
                            {/* Csak címkét írunk ki, ha objektum következik, egyébként a renderEditor kezeli */}
                            {typeof data[key] === 'object' && <div className="text-xs font-bold text-gold-500/50 mt-2 uppercase">{key}</div>}
                            {renderEditor(data[key], [...path, key])}
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    const updateTargetData = (path: string[], value: any) => {
        const newData = JSON.parse(JSON.stringify(targetData));
        let current = newData;
        for (let i = 0; i < path.length - 1; i++) {
            current = current[path[i]];
        }
        current[path[path.length - 1]] = value;
        setTargetData(newData);
    };

    if (!currentUser?.isAdmin && currentUser?.role !== 'translator' && currentUser?.role !== 'admin') {
        return <div className="p-10 text-center text-red-500">Nincs jogosultságod ehhez az oldalhoz.</div>;
    }

    if (!secretKey) {
         return (
             <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                 <h2 className="text-2xl text-gold-400 font-serif">Fordítói Központ</h2>
                 <p className="text-gray-400">Kérlek add meg a rendszerkulcsot a folytatáshoz.</p>
                 <input
                    type="password"
                    className="bg-black/50 border border-gold-500 rounded px-4 py-2 text-white"
                    placeholder="X-Updater-Secret"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                 />
             </div>
         );
    }

    return (
        <div className="container mx-auto p-4 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl text-gold-400 font-serif">Fordítói Központ</h1>
                <div className="flex gap-4">
                     <select
                        className="bg-black/40 text-white border border-white/20 rounded px-3 py-1"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                     >
                        {Object.keys(LANG_FILES).map(k => <option key={k} value={k}>{k}</option>)}
                     </select>

                     <select
                        className="bg-black/40 text-white border border-white/20 rounded px-3 py-1"
                        value={targetLang}
                        onChange={(e) => setTargetLang(e.target.value as LangCode)}
                     >
                        <option value="en">Angol (EN)</option>
                        <option value="de">Német (DE)</option>
                     </select>

                     <button onClick={handleSave} className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-500 font-bold">
                        Mentés
                     </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gold-400 animate-pulse">Betöltés...</div>
            ) : (
                <div className="bg-black/30 rounded-xl p-6 border border-white/10 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {sourceData && targetData ? (
                        renderEditor(sourceData) // A forrás struktúráján iterálunk
                    ) : (
                        <div className="text-center text-gray-500">Válassz fájlt a betöltéshez.</div>
                    )}
                </div>
            )}
        </div>
    );
};
