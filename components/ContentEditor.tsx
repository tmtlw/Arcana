
import React, { useState, useEffect } from 'react';
import { Card, Spread, Lesson } from '../types';
import { useTarot } from '../context/TarotContext';

// File Mapping Configuration
const FILES = {
    'Major Arcana': { path: 'cards/major.ts', variable: 'MAJOR_ARCANA', type: 'Card[]', importType: 'Card' },
    'Wands': { path: 'cards/wands.ts', variable: 'WANDS', type: 'Card[]', importType: 'Card' },
    'Cups': { path: 'cards/cups.ts', variable: 'CUPS', type: 'Card[]', importType: 'Card' },
    'Swords': { path: 'cards/swords.ts', variable: 'SWORDS', type: 'Card[]', importType: 'Card' },
    'Pentacles': { path: 'cards/pentacles.ts', variable: 'PENTACLES', type: 'Card[]', importType: 'Card' },
    'Spreads': { path: 'constants/spreads.ts', variable: 'DEFAULT_SPREADS', type: 'Spread[]', importType: 'Spread' },
    'Lessons - Basics': { path: 'lessons/basics.ts', variable: 'LESSONS_BASICS', type: 'Lesson[]', importType: 'Lesson' },
    'Lessons - Major': { path: 'lessons/major.ts', variable: 'MAJOR_LESSONS', type: 'Lesson[]', importType: 'Lesson' },
    'Lessons - Minor': { path: 'lessons/minor.ts', variable: 'MINOR_LESSONS', type: 'Lesson[]', importType: 'Lesson' },
    'Lessons - Reading': { path: 'lessons/reading.ts', variable: 'READING_LESSONS', type: 'Lesson[]', importType: 'Lesson' },
    'Lessons - Symbolism': { path: 'lessons/symbolism.ts', variable: 'SYMBOLISM_LESSONS', type: 'Lesson[]', importType: 'Lesson' }
};

interface ContentEditorProps {
    secretKey: string;
}

// ----------------------------------------------------------------------
// Field Editor Component
// ----------------------------------------------------------------------
const FieldEditor = ({
    label,
    value,
    onChange
}: {
    label: string,
    value: any,
    onChange: (val: any) => void
}) => {
    // 1. Array handling
    if (Array.isArray(value)) {
        // If it's an array of strings/numbers, use textarea
        if (value.length === 0 || typeof value[0] === 'string' || typeof value[0] === 'number') {
            return (
                <div className="flex flex-col gap-1 mb-4">
                    <label className="text-xs font-bold text-gray-500 uppercase">{label}</label>
                    <textarea
                        className="w-full bg-black/30 border border-white/10 rounded p-2 text-white font-mono text-sm h-20 resize-y focus:border-gold-500 outline-none"
                        value={value.join('\n')}
                        onChange={(e) => onChange(e.target.value.split('\n').filter(s => s.trim() !== '').map(s => !isNaN(Number(s)) && s.trim() !== '' ? Number(s) : s))}
                        placeholder="Egy sor egy elem..."
                    />
                </div>
            );
        }
        // If it's an array of objects, we need recursive rendering
        return (
            <div className="flex flex-col gap-2 mb-4 pl-4 border-l-2 border-white/10">
                <label className="text-xs font-bold text-gold-400 uppercase tracking-widest mb-1">{label} (Lista)</label>
                {value.map((item: any, idx: number) => (
                    <div key={idx} className="mb-4 p-2 bg-white/5 rounded border border-white/5">
                        <div className="text-xs text-gray-500 mb-2">#{idx + 1}</div>
                        {typeof item === 'object' ? (
                            Object.keys(item).map(key => (
                                <FieldEditor
                                    key={key}
                                    label={key}
                                    value={item[key]}
                                    onChange={(newVal) => {
                                        const newArr = [...value];
                                        newArr[idx] = { ...item, [key]: newVal };
                                        onChange(newArr);
                                    }}
                                />
                            ))
                        ) : (
                            <FieldEditor
                                label={`Item ${idx}`}
                                value={item}
                                onChange={(val) => {
                                    const newArr = [...value];
                                    newArr[idx] = val;
                                    onChange(newArr);
                                }}
                            />
                        )}
                        <button
                            onClick={() => {
                                const newArr = value.filter((_, i) => i !== idx);
                                onChange(newArr);
                            }}
                            className="text-xs text-red-400 hover:text-red-200 mt-1"
                        >
                            Törlés
                        </button>
                    </div>
                ))}
                <button
                    onClick={() => {
                        // Try to infer structure from first item or add empty object
                        const newItem = value.length > 0 ? JSON.parse(JSON.stringify(value[0])) : {};
                        // Clear values
                        if(typeof newItem === 'object') Object.keys(newItem).forEach(k => newItem[k] = "");
                        onChange([...value, newItem]);
                    }}
                    className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded hover:bg-green-600/40 w-fit"
                >
                    + Új Elem hozzáadása
                </button>
            </div>
        );
    }

    // 2. Object (Recursive) - Correctly identifying plain objects
    if (typeof value === 'object' && value !== null) {
        return (
            <div className="flex flex-col gap-2 mb-4 pl-4 border-l-2 border-gold-500/30">
                <label className="text-xs font-bold text-gold-400 uppercase tracking-widest mb-1">{label}</label>
                {Object.keys(value).map(key => (
                    <FieldEditor
                        key={key}
                        label={key}
                        value={value[key]}
                        onChange={(newVal) => onChange({ ...value, [key]: newVal })}
                    />
                ))}
            </div>
        );
    }

    // 3. Boolean
    if (typeof value === 'boolean') {
        return (
            <div className="flex items-center gap-2 mb-4">
                 <label className="text-xs font-bold text-gray-500 uppercase w-32">{label}</label>
                 <button
                    onClick={() => onChange(!value)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${value ? 'bg-green-600' : 'bg-gray-600'}`}
                 >
                     <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${value ? 'left-7' : 'left-1'}`} />
                 </button>
            </div>
        );
    }

    // 4. Number
    if (typeof value === 'number') {
        return (
            <div className="flex items-center gap-4 mb-4">
                <label className="text-xs font-bold text-gray-500 uppercase w-32">{label}</label>
                <input
                    type="number"
                    className="flex-1 bg-black/30 border border-white/10 rounded p-2 text-white font-mono focus:border-gold-500 outline-none"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                />
            </div>
        );
    }

    // 5. String (Short vs Long)
    const strVal = String(value || '');
    const isLong = strVal.length > 60 || label.toLowerCase().includes('meaning') || label.toLowerCase().includes('desc') || label.toLowerCase().includes('content');

    return (
        <div className={`flex ${isLong ? 'flex-col gap-1' : 'items-center gap-4'} mb-4`}>
            <label className={`text-xs font-bold text-gray-500 uppercase ${isLong ? '' : 'w-32'}`}>{label}</label>
            {isLong ? (
                <textarea
                    className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-sm h-32 resize-y focus:border-gold-500 outline-none"
                    value={strVal}
                    onChange={(e) => onChange(e.target.value)}
                />
            ) : (
                <input
                    type="text"
                    className="flex-1 bg-black/30 border border-white/10 rounded p-2 text-white focus:border-gold-500 outline-none"
                    value={strVal}
                    onChange={(e) => onChange(e.target.value)}
                />
            )}
        </div>
    );
};

export const ContentEditor: React.FC<ContentEditorProps> = ({ secretKey }) => {
    const { showToast } = useTarot();
    const [selectedFileKey, setSelectedFileKey] = useState<string>(Object.keys(FILES)[0]);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [editItem, setEditItem] = useState<any | null>(null);
    const [jsonMode, setJsonMode] = useState(false);

    useEffect(() => {
        loadData();
    }, [selectedFileKey]);

    const loadData = async () => {
        setLoading(true);
        const config = FILES[selectedFileKey as keyof typeof FILES];
        try {
            const response = await fetch(`./admin_io.php?action=read&file=${config.path}`, {
                headers: { 'X-Updater-Secret': secretKey }
            });
            const result = await response.json();
            if (result.error) {
                showToast(`Hiba: ${result.error}`, 'error');
                setData([]);
            } else {
                const content = result.content;
                const match = content.match(/=\s*(\[[\s\S]*\]);/);
                if (match && match[1]) {
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

    const validateData = (dataToSave: any[]) => {
        if (!Array.isArray(dataToSave)) return false;
        // Basic check: Ensure IDs exist and are strings
        for (const item of dataToSave) {
            if (!item.id || typeof item.id !== 'string') {
                showToast("Validációs Hiba: Minden elemnek kell legyen 'id' mezője!", "error");
                return false;
            }
        }
        // Attempt JSON cycle check
        try {
            JSON.stringify(dataToSave);
        } catch (e) {
            showToast("Validációs Hiba: Ciklikus hivatkozás vagy érvénytelen struktúra.", "error");
            return false;
        }
        return true;
    };

    const handleSaveFile = async () => {
        if (!validateData(data)) return;
        if (!confirm(`Biztosan felülírod a(z) ${FILES[selectedFileKey as keyof typeof FILES].path} fájlt a szerveren?`)) return;

        setLoading(true);
        const config = FILES[selectedFileKey as keyof typeof FILES];

        // Pretty print JSON with indentation
        const jsonString = JSON.stringify(data, null, 4);

        // Reconstruct TS file
        const fileContent = `import { ${config.importType} } from '../types';

export const ${config.variable}: ${config.type} = ${jsonString};
`;
        // Double check syntax via "compile" simulation (parse back)
        try {
             // Basic syntax check: can we interpret what we just built?
             // Since we use JSON.stringify, it is valid JS expression.
             // Just ensure variables match.
             if (!fileContent.includes(`export const ${config.variable}`)) {
                 throw new Error("Variable mismatch");
             }
        } catch(e) {
            showToast("Kritikus belső hiba a generáláskor.", "error");
            setLoading(false);
            return;
        }

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

    // New Item Editor with Form support
    const ItemEditor = ({ item, onSave, onCancel }: { item: any, onSave: (i: any) => void, onCancel: () => void }) => {
        const [localItem, setLocalItem] = useState(JSON.parse(JSON.stringify(item))); // Deep copy
        const [rawJson, setRawJson] = useState(JSON.stringify(item, null, 2));
        const [mode, setMode] = useState<'form' | 'json'>('form');
        const [error, setError] = useState('');

        const handleSave = () => {
            if (mode === 'json') {
                try {
                    const parsed = JSON.parse(rawJson);
                    onSave(parsed);
                } catch (e) {
                    setError("Érvénytelen JSON!");
                }
            } else {
                onSave(localItem);
            }
        };

        const handleFieldChange = (key: string, value: any) => {
            setLocalItem((prev: any) => ({ ...prev, [key]: value }));
        };

        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm" style={{ pointerEvents: 'auto' }}>
                <div className="bg-gray-900 border border-gold-500 rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl relative">
                    <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black/20">
                        <h3 className="text-xl font-bold text-gold-400">
                            Szerkesztés: <span className="text-white">{localItem.name || localItem.id}</span>
                        </h3>
                        <div className="flex gap-2 bg-black/40 rounded-lg p-1 border border-white/10">
                            <button
                                onClick={() => setMode('form')}
                                className={`px-4 py-1 rounded text-xs font-bold uppercase transition ${mode === 'form' ? 'bg-gold-600 text-black' : 'text-gray-400 hover:text-white'}`}
                            >
                                Űrlap
                            </button>
                            <button
                                onClick={() => setMode('json')}
                                className={`px-4 py-1 rounded text-xs font-bold uppercase transition ${mode === 'json' ? 'bg-gold-600 text-black' : 'text-gray-400 hover:text-white'}`}
                            >
                                JSON (Nyers)
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-[#1a1a20]">
                        {mode === 'form' ? (
                            <div className="space-y-2">
                                {/* Iterate over keys but sort them to put ID/Name first */}
                                {Object.keys(localItem)
                                    .sort((a, b) => {
                                        const prio = ['id', 'name', 'arcana', 'suit', 'number', 'keywords', 'meaningUpright', 'meaningReversed'];
                                        const idxA = prio.indexOf(a);
                                        const idxB = prio.indexOf(b);
                                        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                                        if (idxA !== -1) return -1;
                                        if (idxB !== -1) return 1;
                                        return 0;
                                    })
                                    .map(key => (
                                        <FieldEditor
                                            key={key}
                                            label={key}
                                            value={localItem[key]}
                                            onChange={(val) => handleFieldChange(key, val)}
                                        />
                                    ))
                                }
                            </div>
                        ) : (
                             <textarea
                                className="w-full h-full min-h-[400px] bg-black/50 border border-gray-700 rounded p-4 font-mono text-sm text-green-400 focus:outline-none focus:border-gold-500 resize-none"
                                value={rawJson}
                                onChange={(e) => setRawJson(e.target.value)}
                             />
                        )}
                        {error && <div className="text-red-500 text-sm mt-4 font-bold bg-red-900/20 p-2 rounded border border-red-500/50">{error}</div>}
                    </div>

                    <div className="p-4 border-t border-white/10 bg-black/20 flex justify-end gap-3">
                        <button onClick={onCancel} className="px-6 py-2 rounded border border-gray-600 text-gray-300 hover:bg-gray-800 transition">Mégse</button>
                        <button onClick={handleSave} className="px-6 py-2 rounded bg-gold-600 text-black font-bold hover:bg-gold-500 transition shadow-lg hover:scale-105 transform">Mentés</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="animate-fade-in relative">
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
                                        <td className="p-3 font-bold text-white">{item.name || item.title}</td>
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
