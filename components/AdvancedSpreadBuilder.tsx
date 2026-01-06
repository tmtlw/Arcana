
import React, { useState, useRef, useEffect } from 'react';
import { useTarot } from '../context/TarotContext';
import { Spread, SpreadPosition, MeaningContext, SpreadCategory } from '../types';

interface AdvancedSpreadBuilderProps {
    onCancel: () => void;
    initialSpread?: Spread;
}

export const AdvancedSpreadBuilder = ({ onCancel, initialSpread }: AdvancedSpreadBuilderProps) => {
    const { addCustomSpread, updateCustomSpread } = useTarot();
    const [name, setName] = useState(initialSpread?.name || "");
    const [description, setDescription] = useState(initialSpread?.description || "");
    const [positions, setPositions] = useState<SpreadPosition[]>(initialSpread?.positions || []);
    const [activePosId, setActivePosId] = useState<number | null>(null);
    const [bgImage, setBgImage] = useState<string | undefined>(initialSpread?.backgroundImage);
    const [category, setCategory] = useState<SpreadCategory>(initialSpread?.category || 'general');
    const [isMobile, setIsMobile] = useState(false);

    // Canvas Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const [draggingId, setDraggingId] = useState<number | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Coords in advanced mode are percentages (0-100) to remain responsive
    const addPosition = () => {
        const newId = positions.length > 0 ? Math.max(...positions.map(p => p.id)) + 1 : 1;
        const newPos: SpreadPosition = {
            id: newId,
            name: `Kártya ${newId}`,
            description: "",
            x: 50, // Center %
            y: 50, // Center %
            rotation: 0,
            defaultContext: 'general'
        };
        setPositions([...positions, newPos]);
        setActivePosId(newId);
    };

    const handleMouseDown = (e: React.MouseEvent, id: number) => {
        if (!containerRef.current) return;
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        setDraggingId(id);
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        setActivePosId(id);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (draggingId === null || !containerRef.current) return;
        
        const containerRect = containerRef.current.getBoundingClientRect();
        
        // Calculate new position relative to container
        let newXPx = e.clientX - containerRect.left - dragOffset.x;
        let newYPx = e.clientY - containerRect.top - dragOffset.y;

        // Convert to percentage
        let newX = (newXPx / containerRect.width) * 100;
        let newY = (newYPx / containerRect.height) * 100;

        // Clamp
        newX = Math.max(0, Math.min(100, newX));
        newY = Math.max(0, Math.min(100, newY));

        setPositions(prev => prev.map(p => p.id === draggingId ? { ...p, x: newX, y: newY } : p));
    };

    const handleMouseUp = () => {
        setDraggingId(null);
    };

    const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) setBgImage(ev.target.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSave = () => {
        if (!name) return alert("Adj nevet a kirakásnak!");
        if (positions.length === 0) return alert("Helyezz el kártyákat!");

        const newSpread: Spread = {
            id: initialSpread?.id || `custom_adv_${Date.now()}`,
            name,
            description,
            positions,
            backgroundImage: bgImage,
            category,
            isCustom: true
        };

        if (initialSpread) updateCustomSpread(newSpread);
        else addCustomSpread(newSpread);
        
        onCancel();
    };

    const updateActivePos = (field: keyof SpreadPosition, value: any) => {
        if (activePosId === null) return;
        setPositions(prev => prev.map(p => p.id === activePosId ? { ...p, [field]: value } : p));
    };

    const removeActivePos = () => {
        if (activePosId === null) return;
        setPositions(prev => prev.filter(p => p.id !== activePosId));
        setActivePosId(null);
    };

    const CATEGORIES: {id: SpreadCategory, label: string, icon: string}[] = [
        { id: 'general', label: 'Általános', icon: '✨' },
        { id: 'love', label: 'Szerelem & Kapcsolat', icon: '❤️' },
        { id: 'career', label: 'Karrier & Siker', icon: '💼' },
        { id: 'self', label: 'Önismeret', icon: '🧘' },
        { id: 'calendar', label: 'Naptár & Időzítés', icon: '📅' },
        { id: 'decision', label: 'Döntéshelyzet', icon: '⚖️' },
        { id: 'advice', label: 'Tanács & Útmutatás', icon: '💡' }
    ];

    if (isMobile) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6 animate-fade-in">
                <div className="text-6xl mb-4">🖥️</div>
                <h2 className="text-2xl font-bold text-white mb-2">Tablet vagy Asztali gép szükséges</h2>
                <p className="text-white/60">A fejlett kirakás tervező pontos egeret és nagyobb képernyőt igényel. Kérlek válts nagyobb eszközre.</p>
                <button onClick={onCancel} className="mt-8 bg-white/10 px-6 py-2 rounded-full font-bold">Vissza</button>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-100px)] gap-4 animate-fade-in pb-4" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            
            {/* Sidebar Controls */}
            <div className="w-80 flex-shrink-0 flex flex-col gap-4">
                <button onClick={onCancel} className="self-start text-white/50 hover:text-white font-bold">&larr; Mégse</button>
                
                <div className="glass-panel p-4 rounded-xl flex-1 flex flex-col overflow-hidden">
                    <h2 className="font-serif font-bold text-xl text-gold-400 mb-4">Haladó Tervező</h2>
                    
                    <div className="space-y-3 mb-4">
                        <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded p-2 text-white font-bold" placeholder="Kirakás Neve" />
                        
                        <select 
                            value={category}
                            onChange={e => setCategory(e.target.value as SpreadCategory)}
                            className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-xs"
                        >
                            {CATEGORIES.map(c => (
                                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                            ))}
                        </select>

                        <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded p-2 text-xs text-white h-20 resize-none" placeholder="Leírás..." />
                    </div>

                    <div className="border-t border-white/10 pt-4 mb-4">
                        <label className="block text-xs font-bold uppercase text-white/50 mb-2">Háttérkép</label>
                        <input type="file" accept="image/*" onChange={handleBackgroundUpload} className="text-xs text-white/50 file:bg-white/10 file:border-0 file:rounded file:text-white file:px-2 file:py-1" />
                        {bgImage && <button onClick={() => setBgImage(undefined)} className="text-xs text-red-400 mt-1 hover:underline">Háttér törlése</button>}
                    </div>

                    <button onClick={addPosition} className="bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-bold mb-4 shadow-lg">
                        + Kártya Hozzáadása
                    </button>

                    {/* Selected Card Properties */}
                    {activePosId !== null ? (
                        <div className="bg-black/30 p-3 rounded-lg border border-gold-500/30 flex-1 overflow-y-auto">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gold-400 font-bold text-sm">Kiválasztva: {activePosId}</span>
                                <button onClick={removeActivePos} className="text-red-400 text-xs font-bold hover:underline">Törlés</button>
                            </div>
                            <div className="space-y-2">
                                <input 
                                    className="w-full bg-white/5 border border-white/10 rounded p-1 text-sm text-white" 
                                    placeholder="Pozíció neve"
                                    value={positions.find(p => p.id === activePosId)?.name || ''}
                                    onChange={e => updateActivePos('name', e.target.value)}
                                />
                                <textarea
                                    className="w-full bg-white/5 border border-white/10 rounded p-1 text-xs text-white h-16 resize-none"
                                    placeholder="Jelentés..."
                                    value={positions.find(p => p.id === activePosId)?.description || ''}
                                    onChange={e => updateActivePos('description', e.target.value)}
                                />
                                <div className="flex gap-2 items-center">
                                    <span className="text-xs text-white/50">Forgatás:</span>
                                    <input 
                                        type="range" min="0" max="360" step="15" 
                                        value={positions.find(p => p.id === activePosId)?.rotation || 0}
                                        onChange={e => updateActivePos('rotation', parseInt(e.target.value))}
                                        className="flex-1"
                                    />
                                    <span className="text-xs w-8 text-right">{positions.find(p => p.id === activePosId)?.rotation}°</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-white/20 text-sm text-center p-4">
                            Kattints egy kártyára a szerkesztéshez.
                        </div>
                    )}

                    <button onClick={handleSave} className="bg-gold-500 hover:bg-gold-400 text-black py-3 rounded-lg font-bold mt-4 shadow-lg">
                        Mentés
                    </button>
                </div>
            </div>

            {/* The Canvas */}
            <div className="flex-1 glass-panel bg-black/50 rounded-xl relative overflow-hidden select-none" ref={containerRef}>
                {/* Background */}
                {bgImage && <div className="absolute inset-0 bg-cover bg-center opacity-50 pointer-events-none" style={{ backgroundImage: `url(${bgImage})` }}></div>}
                
                {/* Grid Lines (Optional visual aid) */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" 
                     style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }}>
                </div>

                {positions.map(pos => (
                    <div
                        key={pos.id}
                        onMouseDown={(e) => handleMouseDown(e, pos.id)}
                        className={`absolute w-24 h-36 rounded-lg flex items-center justify-center cursor-move transition-shadow
                            ${activePosId === pos.id ? 'ring-2 ring-gold-500 z-50 shadow-2xl bg-indigo-900/80' : 'bg-white/10 hover:bg-white/20 z-10 border border-white/20'}
                        `}
                        style={{
                            left: `${pos.x}%`,
                            top: `${pos.y}%`,
                            transform: `translate(-50%, -50%) rotate(${pos.rotation || 0}deg)`
                        }}
                    >
                        <div className="text-center pointer-events-none">
                            <div className="text-2xl opacity-50">🎴</div>
                            <div className="text-[10px] font-bold text-white mt-1 px-1 bg-black/50 rounded">{pos.name}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};