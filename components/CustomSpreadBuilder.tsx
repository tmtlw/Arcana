
import React, { useState, useEffect } from 'react';
import { useTarot } from '../context/TarotContext';
import { Spread, SpreadPosition, MeaningContext, SpreadCategory } from '../types';

export const CustomSpreadBuilder = ({ onCancel, initialSpread }: { onCancel: () => void, initialSpread?: Spread }) => {
    const { addCustomSpread, updateCustomSpread } = useTarot();
    const [name, setName] = useState(initialSpread?.name || "");
    const [description, setDescription] = useState(initialSpread?.description || "");
    const [positions, setPositions] = useState<SpreadPosition[]>(initialSpread?.positions || []);
    const [activePosId, setActivePosId] = useState<number | null>(null);
    const [category, setCategory] = useState<SpreadCategory>(initialSpread?.category || 'general');
    
    // 7x5 Grid for more flexibility
    const gridCols = 7;
    const gridRows = 5;

    // Load initial data if provided (for editing)
    useEffect(() => {
        if(initialSpread) {
            setName(initialSpread.name);
            setDescription(initialSpread.description);
            setPositions(initialSpread.positions);
            setCategory(initialSpread.category || 'general');
        }
    }, [initialSpread]);

    const togglePosition = (x: number, y: number) => {
        const existing = positions.find(p => p.x === x && p.y === y);
        
        if (existing) {
            // Only remove if it is the currently selected one, otherwise select it
            if(activePosId === existing.id) {
                // Remove
                const newPositions = positions.filter(p => p !== existing)
                    .map((p, index) => ({ ...p, id: index + 1 })); // Renumber remaining
                setPositions(newPositions);
                setActivePosId(null);
            } else {
                setActivePosId(existing.id);
            }
        } else {
            // Add
            if (positions.length >= 15) return alert("Maximum 15 kártya helyezhető el.");
            const newPos: SpreadPosition = {
                id: positions.length + 1,
                name: `Pozíció ${positions.length + 1}`,
                description: "Mit jelent ez a kártya?",
                x, y,
                rotation: 0,
                defaultContext: 'general'
            };
            setPositions([...positions, newPos]);
            setActivePosId(newPos.id);
        }
    };

    const updatePositionDetails = (id: number, field: keyof SpreadPosition, value: any) => {
        setPositions(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const toggleRotation = (id: number) => {
        setPositions(prev => prev.map(p => p.id === id ? { ...p, rotation: p.rotation === 90 ? 0 : 90 } : p));
    };

    const handleSave = () => {
        if (!name) return alert("Kérlek adj nevet a kirakásnak!");
        if (positions.length === 0) return alert("Helyezz el legalább egy kártyát az asztalon!");
        
        if (initialSpread) {
            // Update existing
            const updatedSpread: Spread = {
                ...initialSpread,
                name,
                description,
                positions,
                category
            };
            updateCustomSpread(updatedSpread);
        } else {
            // Create new
            const newSpread: Spread = {
                id: `custom_${Date.now()}`,
                name,
                description: description || "Egyéni kirakás",
                positions,
                category,
                isCustom: true
            };
            addCustomSpread(newSpread);
        }
        onCancel();
    };

    const activePosition = positions.find(p => p.id === activePosId);

    const CONTEXT_OPTIONS: {id: MeaningContext, label: string, icon: string}[] = [
        { id: 'general', label: 'Általános', icon: '✨' },
        { id: 'love', label: 'Szerelem', icon: '❤️' },
        { id: 'career', label: 'Karrier', icon: '💼' },
        { id: 'advice', label: 'Tanács', icon: '💡' },
        { id: 'daily', label: 'Napi', icon: '📅' },
        { id: 'yearly', label: 'Éves', icon: '🗓️' }
    ];

    const CATEGORIES: {id: SpreadCategory, label: string, icon: string}[] = [
        { id: 'general', label: 'Általános', icon: '✨' },
        { id: 'love', label: 'Szerelem & Kapcsolat', icon: '❤️' },
        { id: 'career', label: 'Karrier & Siker', icon: '💼' },
        { id: 'self', label: 'Önismeret', icon: '🧘' },
        { id: 'calendar', label: 'Naptár & Időzítés', icon: '📅' },
        { id: 'decision', label: 'Döntéshelyzet', icon: '⚖️' },
        { id: 'advice', label: 'Tanács & Útmutatás', icon: '💡' }
    ];

    return (
        <div className="flex flex-col lg:flex-row h-full lg:h-[calc(100vh-100px)] gap-6 animate-fade-in pb-24">
            
            {/* LEFT PANEL - Settings (Top on Mobile) */}
            <div className="lg:w-1/3 flex flex-col gap-4 order-1 lg:order-1">
                <button onClick={onCancel} className="self-start flex items-center gap-2 text-white/50 hover:text-white mb-2 font-bold transition-colors">
                    <span>&larr;</span> Mégse
                </button>

                <div className="glass-panel p-6 rounded-2xl flex-1 flex flex-col overflow-hidden border border-white/10 max-h-[500px] lg:max-h-none">
                    <h2 className="text-2xl font-serif font-bold text-gold-400 mb-6 flex items-center gap-2">
                        <span>✨</span> {initialSpread ? 'Kirakás Szerkesztése' : 'Kirakás Tervező'}
                    </h2>
                    
                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-xs font-bold uppercase text-white/50 mb-1">Kirakás Neve</label>
                            <input 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-white/20 focus:border-gold-500 outline-none transition-all font-serif text-lg"
                                placeholder="Pl. Párkapcsolati Elemzés"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-white/50 mb-1">Kategória</label>
                            <select 
                                value={category}
                                onChange={e => setCategory(e.target.value as SpreadCategory)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-gold-500 outline-none"
                            >
                                {CATEGORIES.map(c => (
                                    <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-white/50 mb-1">Rövid Leírás</label>
                            <textarea 
                                value={description} 
                                onChange={e => setDescription(e.target.value)} 
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-white/20 focus:border-gold-500 outline-none transition-all text-sm resize-none h-20"
                                placeholder="Mire való ez a kirakás?"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/20 rounded-xl p-2 border border-white/5 min-h-[150px]">
                        {positions.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-white/30 text-center p-4">
                                <span className="text-3xl mb-2">👆</span>
                                <p>Kattints a rácsra a jobb oldalon (mobilon lent), hogy kártyákat helyezz el.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="text-xs font-bold uppercase text-white/40 mb-2 sticky top-0 bg-[#1a1a2e] py-1 z-10">Pozíciók & Jelentés</div>
                                {positions.map((p) => (
                                    <div 
                                        key={p.id} 
                                        onClick={() => setActivePosId(p.id)}
                                        className={`p-3 rounded-lg border transition-all cursor-pointer ${activePosId === p.id ? 'bg-gold-500/10 border-gold-500' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${activePosId === p.id ? 'bg-gold-500 text-black' : 'bg-white/20'}`}>
                                                {p.id}
                                            </span>
                                            <input 
                                                value={p.name}
                                                onChange={(e) => updatePositionDetails(p.id, 'name', e.target.value)}
                                                className="bg-transparent border-b border-white/10 focus:border-gold-500 outline-none text-sm font-bold text-white flex-1"
                                                placeholder="Pozíció neve..."
                                            />
                                            {/* Context Selector Mini */}
                                            <select 
                                                value={p.defaultContext || 'general'}
                                                onChange={(e) => updatePositionDetails(p.id, 'defaultContext', e.target.value)}
                                                className="bg-black/40 border border-white/10 rounded text-[10px] p-1 text-gold-400 outline-none focus:border-gold-500"
                                                onClick={e => e.stopPropagation()}
                                                title="Milyen típusú értelmezést mutasson?"
                                            >
                                                {CONTEXT_OPTIONS.map(opt => (
                                                    <option key={opt.id} value={opt.id}>{opt.icon} {opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <input 
                                            value={p.description}
                                            onChange={(e) => updatePositionDetails(p.id, 'description', e.target.value)}
                                            className="w-full bg-transparent text-xs text-gray-400 focus:text-white outline-none placeholder-white/20"
                                            placeholder="Mit jelent ez a lap?"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-4 border-t border-white/10 pt-4">
                        {activePosition && (
                            <div className="mb-4 flex items-center justify-between text-sm">
                                <span className="text-white/60">Kiválasztva: <span className="font-bold text-white">{activePosition.id}. {activePosition.name}</span></span>
                                <button 
                                    onClick={() => toggleRotation(activePosition.id)} 
                                    className={`px-3 py-1 rounded border transition-colors ${activePosition.rotation ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-white/5 text-white/50 border-white/20 hover:text-white'}`}
                                >
                                    {activePosition.rotation ? 'Visszafordítás' : 'Elforgatás (90°)'}
                                </button>
                            </div>
                        )}
                        <button 
                            onClick={handleSave} 
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl font-bold text-white shadow-lg hover:shadow-indigo-500/50 transition-all transform hover:-translate-y-1"
                        >
                            {initialSpread ? 'Változtatások Mentése' : 'Kirakás Mentése'}
                        </button>
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL - The Table (Bottom on Mobile) */}
            <div className="lg:w-2/3 glass-panel-dark rounded-2xl border border-white/10 p-4 lg:p-8 flex items-center justify-center relative overflow-hidden shadow-inner order-2 lg:order-2 h-[500px] lg:h-auto">
                {/* Background Decoration */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#312e81_0%,_#000000_100%)] opacity-80"></div>
                <div className="absolute inset-0" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}}></div>

                {/* The Grid - Scrollable on mobile */}
                <div 
                    className="relative z-10 grid gap-2 lg:gap-4 max-w-full max-h-full overflow-auto p-4 custom-scrollbar"
                    style={{
                        gridTemplateColumns: `repeat(${gridCols}, minmax(50px, 100px))`,
                        gridTemplateRows: `repeat(${gridRows}, minmax(70px, 150px))`
                    }}
                >
                    {Array.from({ length: gridCols * gridRows }).map((_, i) => {
                        const x = (i % gridCols) + 1;
                        const y = Math.floor(i / gridCols) + 1;
                        const pos = positions.find(p => p.x === x && p.y === y);

                        return (
                            <div 
                                key={i}
                                onClick={() => togglePosition(x, y)}
                                className={`
                                    relative rounded-lg border-2 transition-all duration-300 cursor-pointer flex items-center justify-center group aspect-[2/3]
                                    ${pos 
                                        ? 'border-gold-500 bg-indigo-900/80 shadow-[0_0_15px_rgba(234,179,8,0.3)] z-10' 
                                        : 'border-white/5 hover:border-white/30 hover:bg-white/5'
                                    }
                                `}
                                style={{
                                    transform: pos?.rotation ? 'rotate(90deg) scale(0.9)' : 'none',
                                    zIndex: pos?.id // Simple layering if overlapped manually, though grid prevents real overlap
                                }}
                            >
                                {pos ? (
                                    <>
                                        <div className="absolute top-2 left-2 w-4 h-4 lg:w-6 lg:h-6 rounded-full bg-gold-500 text-black font-bold flex items-center justify-center text-[10px] lg:text-xs shadow-md" style={{transform: pos.rotation ? 'rotate(-90deg)' : 'none'}}>
                                            {pos.id}
                                        </div>
                                        <div className="text-center p-1 flex flex-col items-center" style={{transform: pos.rotation ? 'rotate(-90deg)' : 'none'}}>
                                            <div className="text-xl lg:text-[30px] leading-none">🎴</div>
                                            <div className="text-[8px] lg:text-[10px] text-gold-200 font-bold truncate mt-1 max-w-[80px] mx-auto">{pos.name}</div>
                                            {pos.defaultContext && pos.defaultContext !== 'general' && (
                                                <div className="text-[10px] mt-1 bg-white/20 px-1 rounded flex items-center gap-1 hidden lg:flex">
                                                    {CONTEXT_OPTIONS.find(c => c.id === pos.defaultContext)?.icon}
                                                </div>
                                            )}
                                        </div>
                                        {activePosId === pos.id && (
                                            <div className="absolute inset-0 border-2 border-white rounded-lg animate-pulse pointer-events-none"></div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-white/10 text-xl lg:text-2xl group-hover:text-white/40 transition-colors">+</div>
                                )}
                            </div>
                        );
                    })}
                </div>
                
                {/* Helper Text */}
                <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-white/30 italic pointer-events-none hidden lg:block">
                    Kattints egy üres helyre a kártya hozzáadásához, vagy egy meglévőre a törléshez/kiválasztáshoz.
                </div>
            </div>
        </div>
    );
};