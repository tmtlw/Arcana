
import React, { useState, useMemo } from 'react';
import { useTarot } from '../context/TarotContext';
import { Reading, Spread } from '../types';
import { FULL_DECK } from '../constants';
import { CardImage } from './CardImage';
import { MarkdownRenderer } from './MarkdownSupport';

interface ReadingAnalysisProps {
    reading: Reading;
    onClose: () => void;
    spread?: Spread; // Optional, looks up from context if missing
}

export const ReadingAnalysis = ({ reading, onClose, spread }: ReadingAnalysisProps) => {
    const { allSpreads } = useTarot();
    const [activeTab, setActiveTab] = useState<'table' | 'deep' | 'story' | 'stats'>('deep');

    const usedSpread = spread || allSpreads.find(s => s.id === reading.spreadId);

    // --- CORE ANALYTICS ENGINE ---
    const analysis = useMemo(() => {
        if (!reading || !reading.cards || reading.cards.length === 0) return null;

        const drawnDetails = reading.cards.map(dc => {
            const card = FULL_DECK.find(c => c.id === dc.cardId);
            const pos = usedSpread?.positions.find(p => p.id === dc.positionId);
            return { ...dc, card, pos };
        }).filter(d => d.card); // Ensure card exists

        // 1. Elemental Balance
        const elements: Record<string, number> = { 'Tűz': 0, 'Víz': 0, 'Levegő': 0, 'Föld': 0 };
        const arcanas = { 'Major': 0, 'Minor': 0 };
        const suits: Record<string, number> = { 'Botok': 0, 'Kelyhek': 0, 'Kardok': 0, 'Érmék': 0 };
        const keywords: string[] = [];
        let totalNumerology = 0;

        drawnDetails.forEach(d => {
            if (d.card?.element) elements[d.card.element as keyof typeof elements] = (elements[d.card.element as keyof typeof elements] || 0) + 1;
            if (d.card?.arcana) arcanas[d.card.arcana]++;
            if (d.card?.suit) suits[d.card.suit]++;
            if (d.card?.keywords) keywords.push(...d.card.keywords);
            if (d.card?.number !== undefined) totalNumerology += d.card.number;
        });

        const total = drawnDetails.length;
        // Dominance
        const dominanceEntry = Object.entries(elements).sort((a, b) => b[1] - a[1])[0];
        const dominantElement = dominanceEntry ? dominanceEntry[0] : 'Kiegyensúlyozott';
        
        const missing = Object.entries(elements).filter(e => e[1] === 0).map(e => e[0]);

        // 2. Synthesis Advice
        let elementalAdvice = "";
        if (dominantElement === 'Tűz') elementalAdvice = "A szenvedély és az akarat uralja a helyzetet. Cselekvésre ösztönöz, de vigyázz a kiégéssel!";
        if (dominantElement === 'Víz') elementalAdvice = "Az érzelmek és az intuíció dominálnak. Hallgass a szívedre, de maradj a földön.";
        if (dominantElement === 'Levegő') elementalAdvice = "A racionalitás és a kommunikáció a kulcs. Tiszta gondolatok vezetnek, de ne légy túl hűvös.";
        if (dominantElement === 'Föld') elementalAdvice = "A stabilitás és az anyagiak vannak fókuszban. Gyakorlatias megközelítésre van szükség.";
        
        if (missing.length > 0) elementalAdvice += ` Hiányzik a(z) ${missing.join(', ')} energia, próbáld tudatosan pótolni.`;

        // 3. Karmic Weight
        const isKarmic = arcanas['Major'] > total / 2;

        // 4. Numerology of the Reading
        let reducedNum = totalNumerology;
        while (reducedNum > 21) {
            reducedNum = reducedNum.toString().split('').reduce((a: number, b: string) => a + parseInt(b), 0);
        }
        const numerologyCard = FULL_DECK.find(c => c.arcana === 'Major' && c.number === reducedNum);

        // 5. Pattern Scanner (New Heuristics)
        const patterns = [];
        if (arcanas.Major >= 3) patterns.push("Sorsszerű Változás (3+ Nagy Árkánum)");
        if (elements['Tűz'] >= 3) patterns.push("Nagy Szenvedély/Konfliktus (Tűz dominancia)");
        if (elements['Víz'] >= 3) patterns.push("Érzelmi Áradat (Víz dominancia)");
        if (elements['Levegő'] >= 3) patterns.push("Túlgondolás Veszélye (Levegő dominancia)");
        if (elements['Föld'] >= 3) patterns.push("Anyagi Fókusz (Föld dominancia)");

        // Check for specific number sequences (e.g. three Aces)
        const numberCounts: Record<number, number> = {};
        drawnDetails.forEach(d => { if(d.card?.number) numberCounts[d.card.number] = (numberCounts[d.card.number] || 0) + 1; });
        if (numberCounts[1] >= 2) patterns.push("Új Kezdetek (Több Ász)");
        if (numberCounts[10] >= 2) patterns.push("Ciklusok Vége (Több Tízes)");

        return { 
            drawnDetails, 
            elements, 
            arcanas, 
            suits, 
            dominance: dominanceEntry || ['None', 0], 
            missing, 
            elementalAdvice, 
            isKarmic, 
            keywords: [...new Set(keywords)].slice(0, 8),
            numerologySum: totalNumerology,
            numerologyCard,
            patterns
        };
    }, [reading, usedSpread]);

    if (!analysis) return <div className="p-8 text-center text-white/50">Betöltés...</div>;

    // --- SUB-COMPONENTS ---

    const StatsTab = () => (
        <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pattern Scanner Alert */}
            {analysis.patterns.length > 0 && (
                <div className="col-span-1 md:col-span-2 bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-xl flex items-start gap-4 animate-pulse-slow">
                    <div className="text-3xl">✨</div>
                    <div>
                        <h4 className="font-bold text-indigo-300 text-sm uppercase tracking-wider mb-1">Felismerések (Mintázat Elemző)</h4>
                        <ul className="list-disc pl-4 text-sm text-gray-300 space-y-1">
                            {analysis.patterns.map(p => <li key={p}>{p}</li>)}
                        </ul>
                    </div>
                </div>
            )}

            {/* Elemental Chart */}
            <div className="glass-panel p-6 rounded-2xl border border-white/10">
                <h3 className="font-serif font-bold text-gold-400 mb-4 flex items-center gap-2">🔥 Elemi Egyensúly</h3>
                <div className="space-y-4">
                    {Object.entries(analysis.elements).map(([elem, count]) => (
                        <div key={elem}>
                            <div className="flex justify-between text-xs uppercase font-bold mb-1">
                                <span>{elem}</span>
                                <span>{Math.round((Number(count) / reading.cards.length) * 100)}%</span>
                            </div>
                            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-1000 ${elem === 'Tűz' ? 'bg-red-500' : elem === 'Víz' ? 'bg-blue-500' : elem === 'Levegő' ? 'bg-yellow-200' : 'bg-green-500'}`} 
                                    style={{ width: `${(Number(count) / reading.cards.length) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-6 text-sm italic text-gray-300 bg-white/5 p-4 rounded-xl border border-white/5">
                    💡 {analysis.elementalAdvice}
                </div>
            </div>

            {/* Karmic & Suit Info */}
            <div className="space-y-6">
                <div className="glass-panel p-6 rounded-2xl border border-white/10">
                    <h3 className="font-serif font-bold text-purple-300 mb-4 flex items-center gap-2">⚖️ Súlyozás</h3>
                    <div className="flex items-center gap-4">
                        <div className="relative w-20 h-20 flex-shrink-0">
                            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                <path className="text-gray-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                                <path className="text-gold-500 transition-all duration-1000" strokeDasharray={`${(Number(analysis.arcanas.Major) / reading.cards.length) * 100}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center font-bold text-xs text-white">{analysis.arcanas.Major} / {reading.cards.length}</div>
                        </div>
                        <div className="text-sm text-gray-300">
                            {analysis.isKarmic 
                                ? <span className="text-gold-400 font-bold">Sorsszerű Helyzet:</span> 
                                : <span className="text-gray-400 font-bold">Mindennapi Ügy:</span>}
                            <br/>
                            {analysis.isKarmic 
                                ? "A Nagy Árkánumok dominanciája miatt ez a helyzet hosszú távú hatással bír az életedre." 
                                : "A Kis Árkánumok túlsúlya azt jelzi, hogy a kezedben van az irányítás, cselekedj bátran."}
                        </div>
                    </div>
                </div>

                {/* Numerology of the Spread */}
                {analysis.numerologyCard && (
                    <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center gap-4">
                        <div className="w-12 h-16 flex-shrink-0 rounded overflow-hidden">
                            <CardImage cardId={analysis.numerologyCard.id} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <div className="text-[10px] uppercase font-bold opacity-50">A Húzás Összrezgése</div>
                            <div className="font-serif font-bold text-white">{analysis.numerologyCard.number}. {analysis.numerologyCard.name}</div>
                            <div className="text-xs text-gray-400">Summa: {analysis.numerologySum}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Keyword Cloud */}
            <div className="col-span-1 md:col-span-2 glass-panel p-6 rounded-2xl border border-white/10">
                <h3 className="font-serif font-bold text-white mb-4">🔑 Kulcsszavak</h3>
                <div className="flex flex-wrap gap-2">
                    {analysis.keywords.map(k => (
                        <span key={k} className="px-3 py-1 bg-white/10 rounded-full text-xs text-gold-400 border border-white/10">{k}</span>
                    ))}
                </div>
            </div>
        </div>
    );

    const DeepDiveTab = () => (
        <div className="animate-fade-in space-y-6">
            {analysis.drawnDetails.map((item, idx) => (
                <div key={item.positionId} className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row gap-6 relative overflow-hidden group">
                    {/* Position Label */}
                    <div className="absolute top-0 left-0 bg-gold-500 text-black text-xs font-bold px-3 py-1 rounded-br-lg z-10 shadow-lg">
                        {idx + 1}. {item.pos?.name}
                    </div>
                    
                    {/* Card Visual */}
                    <div className="w-full md:w-48 flex-shrink-0 flex flex-col items-center pt-6 md:pt-0">
                        <div className={`w-32 rounded-lg shadow-2xl overflow-hidden mb-3 transition-transform duration-500 group-hover:scale-105 border border-white/10 ${item.isReversed ? 'rotate-180' : ''}`}>
                            <CardImage cardId={item.card!.id} className="w-full object-cover" />
                        </div>
                        <span className="text-sm font-bold text-white text-center">{item.card!.name}</span>
                        {item.isReversed && <span className="text-[10px] text-red-300 font-bold uppercase mt-1 bg-red-900/40 px-2 py-0.5 rounded">Fordított</span>}
                    </div>

                    {/* Interpretation */}
                    <div className="flex-1 pt-2">
                        <div className="mb-4 bg-white/5 p-3 rounded-lg border-l-2 border-gold-500/50">
                            <h4 className="text-[10px] uppercase font-bold text-gold-500/80 mb-1">A Pozíció Jelentése</h4>
                            <p className="text-gray-300 italic text-sm">{item.pos?.description}</p>
                        </div>
                        
                        <div className="mb-4">
                            <h4 className="text-sm font-bold text-white mb-2">Üzenet</h4>
                            <div className="text-gray-200 text-sm leading-relaxed">
                                <MarkdownRenderer content={item.isReversed ? item.card!.meaningReversed : item.card!.meaningUpright} />
                            </div>
                        </div>

                        {/* Contextual Meaning */}
                        {item.pos?.defaultContext && item.pos.defaultContext !== 'general' && (
                            <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 mt-4">
                                <h4 className="text-[10px] uppercase font-bold text-indigo-300 mb-1">Specifikus ({item.pos.defaultContext})</h4>
                                <div className="text-xs text-gray-300">
                                    {/* Dynamic lookup for context meaning */}
                                    {/* @ts-ignore */}
                                    <MarkdownRenderer content={item.card![`${item.pos.defaultContext}Meaning`] || "Nincs specifikus adat."} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );

    const StoryTab = () => {
        const narrative = analysis.drawnDetails.map((d, i) => {
            const meaning = d.isReversed ? d.card?.meaningReversed : d.card?.meaningUpright;
            return (
                <div key={i} className="mb-6 relative pl-6 border-l-2 border-white/10 last:border-0 pb-2">
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gold-500 border-4 border-[#1a1a2e]"></div>
                    <h4 className="text-gold-400 font-bold text-xs mb-1 uppercase tracking-wide opacity-70">{d.pos?.name}</h4>
                    <div className="text-base text-gray-200 font-serif leading-relaxed">
                        <span className="font-bold text-indigo-300 block mb-1">{d.card?.name}</span>
                        <MarkdownRenderer content={meaning || ""} />
                    </div>
                </div>
            );
        });

        return (
            <div className="animate-fade-in glass-panel p-8 rounded-2xl border border-white/10 bg-black/40">
                <h3 className="text-2xl font-serif font-bold text-white mb-2 text-center">
                    🔮 A Te Történeted
                </h3>
                <p className="text-center text-white/40 text-sm mb-8 italic">A lapok összefüggő üzenete</p>
                
                <div className="max-w-2xl mx-auto">
                    {narrative}
                    <div className="mt-8 p-6 bg-gradient-to-br from-indigo-900/40 to-black rounded-xl text-center border border-gold-500/30">
                        <h4 className="text-gold-500 font-bold uppercase text-xs mb-2">Lényeg</h4>
                        <p className="text-white italic text-lg font-serif">
                            "{analysis.dominance[0]} elem túlsúlya és a {analysis.arcanas.Major > analysis.arcanas.Minor ? 'sorsszerű erők' : 'mindennapi tettek'} határozzák meg ezt a helyzetet. A kulcs a {analysis.keywords[0]} és a {analysis.keywords[1]}."
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    const VisualTableTab = () => {
        if (!usedSpread) return <div>Nincs vizuális adat.</div>;
        const maxX = Math.max(...usedSpread.positions.map(p => p.x));
        const maxY = Math.max(...usedSpread.positions.map(p => p.y));
        const isFreeform = !!usedSpread.backgroundImage || usedSpread.positions.some(p => p.x > 15);

        return (
            <div className="flex justify-center p-4 overflow-auto custom-scrollbar animate-fade-in">
                {isFreeform ? (
                    <div className="relative w-full aspect-video bg-black/40 rounded-xl border border-white/10 shadow-2xl max-w-4xl">
                         {usedSpread.backgroundImage && <div className="absolute inset-0 bg-cover bg-center opacity-50" style={{ backgroundImage: `url(${usedSpread.backgroundImage})` }}></div>}
                         {usedSpread.positions.map(pos => {
                             const drawn = reading.cards.find(c => c.positionId === pos.id);
                             if(!drawn) return null;
                             return (
                                 <div key={pos.id} className="absolute w-[12%] aspect-[2/3]" style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: `translate(-50%, -50%) rotate(${pos.rotation || 0}deg)` }}>
                                     <CardImage cardId={drawn.cardId} className={`w-full h-full object-cover rounded shadow-md ${drawn.isReversed ? 'rotate-180' : ''}`} />
                                 </div>
                             )
                         })}
                    </div>
                ) : (
                    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${maxX}, 100px)`, gridTemplateRows: `repeat(${maxY}, 150px)` }}>
                        {usedSpread.positions.map(pos => {
                            const drawn = reading.cards.find(c => c.positionId === pos.id);
                            if(!drawn) return null;
                            return (
                                <div key={pos.id} style={{ gridColumn: pos.x, gridRow: pos.y, transform: pos.rotation ? 'rotate(90deg)' : 'none' }} className="relative group">
                                    <CardImage cardId={drawn.cardId} className={`w-full h-full object-cover rounded-lg shadow-lg ${drawn.isReversed ? 'rotate-180' : ''}`} />
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-[9px] text-center text-white py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {pos.name}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="animate-fade-in pb-20 max-w-6xl mx-auto">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                <button onClick={onClose} className="flex items-center gap-2 text-white/60 hover:text-white font-bold transition-colors self-start md:self-auto">
                    <span>&larr;</span> Vissza
                </button>
                
                <div className="text-center">
                    <div className="text-gold-400 font-serif font-bold text-xl md:text-2xl">{usedSpread?.name || 'Részletes Elemzés'}</div>
                    <div className="text-xs text-white/40 uppercase tracking-widest">{new Date(reading.date).toLocaleDateString()}</div>
                </div>

                <div className="w-20 hidden md:block"></div> {/* Spacer for center alignment */}
            </div>

            {/* Navigation Tabs */}
            <div className="flex justify-center mb-8">
                <div className="flex gap-2 bg-black/40 p-1.5 rounded-full border border-white/10 overflow-x-auto custom-scrollbar max-w-full">
                    {[
                        { id: 'deep', icon: '🧐', label: 'Elemzés' },
                        { id: 'stats', icon: '📊', label: 'Mérleg' },
                        { id: 'story', icon: '📜', label: 'Sztori' },
                        { id: 'table', icon: '🎴', label: 'Kép' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-gold-500 text-black shadow-lg' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                        >
                            <span className="text-base">{tab.icon}</span> <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                {activeTab === 'deep' && <DeepDiveTab />}
                {activeTab === 'stats' && <StatsTab />}
                {activeTab === 'story' && <StoryTab />}
                {activeTab === 'table' && <VisualTableTab />}
            </div>
        </div>
    );
};
