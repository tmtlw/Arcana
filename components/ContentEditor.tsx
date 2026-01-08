
import React, { useState, useEffect } from 'react';
import { Card, Spread, Lesson } from '../types';
import { useTarot } from '../context/TarotContext';

// Import data sources to read initial structure if needed,
// but we will rely on loading them dynamically or from the context.
// We need the *raw* objects to edit.

// File Mapping Configuration
const FILES = {
    'Major Arcana': { path: 'cards/major.ts', variable: 'MAJOR_ARCANA', type: 'Card[]', importType: 'Card' },
    'Wands': { path: 'cards/wands.ts', variable: 'WANDS', type: 'Card[]', importType: 'Card' },
    'Cups': { path: 'cards/cups.ts', variable: 'CUPS', type: 'Card[]', importType: 'Card' },
    'Swords': { path: 'cards/swords.ts', variable: 'SWORDS', type: 'Card[]', importType: 'Card' },
    'Pentacles': { path: 'cards/pentacles.ts', variable: 'PENTACLES', type: 'Card[]', importType: 'Card' },
    'Spreads': { path: 'constants/spreads.ts', variable: 'DEFAULT_SPREADS', type: 'Spread[]', importType: 'Spread' },
    'Lessons - Basics': { path: 'lessons/basics.ts', variable: 'LESSONS_BASICS', type: 'Lesson[]', importType: 'Lesson' }
};

interface ContentEditorProps {
    secretKey: string;
}

export const ContentEditor: React.FC<ContentEditorProps> = ({ secretKey }) => {
    const { showToast } = useTarot();
    const [selectedFileKey, setSelectedFileKey] = useState<string>(Object.keys(FILES)[0]);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [editItem, setEditItem] = useState<any | null>(null); // Item being edited
    const [jsonMode, setJsonMode] = useState(false); // Toggle between Form and JSON view for item

    // Load data when selection changes
    useEffect(() => {
        loadData();
    }, [selectedFileKey]);

    const loadData = async () => {
        setLoading(true);
        const config = FILES[selectedFileKey as keyof typeof FILES];

        try {
            // We fetch the raw TS file content
            const response = await fetch(`./admin_io.php?action=read&file=${config.path}`, {
                headers: { 'X-Updater-Secret': secretKey }
            });
            const result = await response.json();

            if (result.error) {
                showToast(`Hiba: ${result.error}`, 'error');
                setData([]);
            } else {
                // Parse the TS content to JSON
                // Logic: Find the array bracket [ ... ]
                // This is a "risky" parse but since we control the format it's okay for now.
                // We use a Function constructor to evaluate the right hand side.

                const content = result.content;
                const match = content.match(/=\s*(\[[\s\S]*\]);/);
                if (match && match[1]) {
                    // We need to be careful with 'defaultContext: 'general'' strings which might not be quoted keys
                    // actually TS object keys don't need quotes. JSON.parse fails there.
                    // We use `eval` or `new Function` to parse the object literal.
                    // Security: We trust the server content (it's our own code).
                    try {
                        const parsed = new Function(`return ${match[1]}`)();
                        setData(parsed);
                    } catch (e) {
                        console.error("Parse error:", e);
                        showToast("Nem sikerült értelmezni a fájlt.", "error");
                    }
                } else {
                    showToast("Nem található adatstruktúra a fájlban.", "info");
                }
            }
        } catch (e) {
            console.error(e);
            showToast("Hálózati hiba betöltéskor.", "error");
        }
        setLoading(false);
    };

    const handleSaveFile = async () => {
        if (!confirm(`Biztosan felülírod a(z) ${FILES[selectedFileKey as keyof typeof FILES].path} fájlt a szerveren?`)) return;

        setLoading(true);
        const config = FILES[selectedFileKey as keyof typeof FILES];

        // Serialize Data to TS String
        // We use JSON.stringify but we might want to make it look nicer (unquoted keys where possible?)
        // For simplicity and robustness, JSON.stringify is fine, TS accepts it.
        const jsonString = JSON.stringify(data, null, 4);

        // Reconstruct the file content
        const fileContent = `import { ${config.importType} } from '../types';

export const ${config.variable}: ${config.type} = ${jsonString};
`;

        try {
            const response = await fetch(`./admin_io.php?action=write&file=${config.path}`, {
                method: 'POST',
                headers: {
                    'X-Updater-Secret': secretKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: fileContent })
            });
            const result = await response.json();
            if (result.success) {
                showToast("Sikeres mentés! (Backup készült)", "success");
            } else {
                showToast(`Mentés sikertelen: ${result.error}`, "error");
            }
        } catch (e) {
            showToast("Hálózati hiba mentéskor.", "error");
        }
        setLoading(false);
    };

    const handleUpdateItem = (updatedItem: any) => {
        setData(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
        setEditItem(null);
    };

    // Generic Form Component
    const ItemEditor = ({ item, onSave, onCancel }: { item: any, onSave: (i: any) => void, onCancel: () => void }) => {
        const [formData, setFormData] = useState(JSON.stringify(item, null, 2));
        const [error, setError] = useState('');

        const handleSave = () => {
            try {
                const parsed = JSON.parse(formData);
                onSave(parsed);
            } catch (e) {
                setError("Érvénytelen JSON formátum!");
            }
        };

        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 border border-gold-500 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
                    <h3 className="text-xl font-bold text-gold-400 mb-4">Szerkesztés: {item.name || item.id}</h3>

                    <div className="flex-1 overflow-hidden flex flex-col">
                         <div className="text-xs text-gray-400 mb-2">JSON Szerkesztő (Formátum megtartása kötelező!)</div>
                         <textarea
                            className="flex-1 bg-black/50 border border-gray-700 rounded p-4 font-mono text-sm text-green-400 focus:outline-none focus:border-gold-500 resize-none"
                            value={formData}
                            onChange={(e) => setFormData(e.target.value)}
                         />
                    </div>

                    {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

                    <div className="flex justify-end gap-3 mt-4">
                        <button onClick={onCancel} className="px-4 py-2 rounded border border-gray-600 hover:bg-gray-800 transition">Mégse</button>
                        <button onClick={handleSave} className="px-4 py-2 rounded bg-gold-600 text-black font-bold hover:bg-gold-500 transition">Rendben</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif text-white">Tartalom Szerkesztő (Szerver Fájlok)</h2>
                <select
                    value={selectedFileKey}
                    onChange={(e) => setSelectedFileKey(e.target.value)}
                    className="bg-black/40 border border-white/20 rounded px-4 py-2 text-gold-400 font-bold focus:outline-none focus:border-gold-500"
                >
                    {Object.keys(FILES).map(key => <option key={key} value={key}>{key}</option>)}
                </select>
            </div>

            {loading && <div className="text-center py-10"><div className="animate-spin text-4xl">🔄</div></div>}

            {!loading && (
                <>
                    <div className="overflow-x-auto custom-scrollbar border border-white/10 rounded-lg bg-black/20 mb-6">
                        <table className="w-full text-left text-sm text-gray-300">
                            <thead className="bg-white/5 text-gold-400 font-serif uppercase text-xs">
                                <tr>
                                    <th className="p-3">ID</th>
                                    <th className="p-3">Név</th>
                                    <th className="p-3">Leírás / Kulcsszavak</th>
                                    <th className="p-3 text-right">Művelet</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {data.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-3 font-mono text-xs opacity-70">{item.id}</td>
                                        <td className="p-3 font-bold text-white">{item.name}</td>
                                        <td className="p-3 truncate max-w-md opacity-80">
                                            {item.description || (Array.isArray(item.keywords) ? item.keywords.join(', ') : '') || item.meaningUpright?.substring(0,50)+'...'}
                                        </td>
                                        <td className="p-3 text-right">
                                            <button
                                                onClick={() => setEditItem(item)}
                                                className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded hover:bg-blue-500 hover:text-white transition"
                                            >
                                                Szerk.
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {data.length === 0 && <div className="p-10 text-center opacity-50">Nincs adat vagy betöltési hiba.</div>}
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleSaveFile}
                            className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-lg shadow-green-900/20 transition-all hover:scale-105"
                        >
                            💾 Változtatások Mentése (Szerver)
                        </button>
                    </div>
                </>
            )}

            {editItem && (
                <ItemEditor
                    item={editItem}
                    onSave={handleUpdateItem}
                    onCancel={() => setEditItem(null)}
                />
            )}
        </div>
    );
};
