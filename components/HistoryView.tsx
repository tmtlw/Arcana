
import React, { useState, useMemo } from 'react';
import { useTarot } from '../context/TarotContext';
import { THEMES, getCardImage, MOODS } from '../constants';
import { Card, DrawnCard, Reading, MeaningContext } from '../types';
import { CommunityService } from '../services/communityService';
import { CompareView } from './CompareView';
import { ReadingAnalysis } from './ReadingAnalysis';
import { MarkdownRenderer, MarkdownEditor } from './MarkdownSupport';
import { HistoryHeatmap } from './HistoryHeatmap';

const PROMPTS = [
    "Hogyan éreztem magam a húzáskor?",
    "Mi volt az első gondolatom a képről?",
    "Hogyan kapcsolódik ez a mai napomhoz?",
    "Mit tanácsolna a jövőbeli énem?",
    "Milyen ellenállást érzek a lappal kapcsolatban?"
];

export const HistoryView = ({ deck }: any) => {
    const { readings, currentUser, deleteReading, updateReading, toggleFavorite, availableDecks, allSpreads, showToast, updateUser } = useTarot();
    
    // Filters
    const [search, setSearch] = useState("");
    const [filterFav, setFilterFav] = useState(false);
    const [filterDate, setFilterDate] = useState("");
    const [filterTag, setFilterTag] = useState("");

    // Editing State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editNote, setEditNote] = useState("");
    const [editQuestion, setEditQuestion] = useState(""); // NEW: Allow editing question
    const [editMood, setEditMood] = useState(""); 
    
    // Detail / Analysis State (NEW)
    const [selectedReadingForAnalysis, setSelectedReadingForAnalysis] = useState<Reading | null>(null);

    // Folder Management State
    const [isManagingFolders, setIsManagingFolders] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");

    // Comparison State
    const [isCompareMode, setIsCompareMode] = useState(false);
    const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
    const [compareReadings, setCompareReadings] = useState<Reading[] | null>(null);

    // View Mode
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

    const myReadings = readings.filter(r => r.userId === currentUser?.id);
    const userFolders = currentUser?.folders || [];

    const filtered = myReadings.filter(r => {
        const cardNames = r.cards.map(c => deck.find((d: any) => d.id === c.cardId)?.name || '').join(' ').toLowerCase();
        const searchTerm = search.toLowerCase();
        
        const matchesSearch = (
            r.question?.toLowerCase().includes(searchTerm) || 
            r.notes.toLowerCase().includes(searchTerm) ||
            cardNames.includes(searchTerm)
        );
        
        const matchesFav = filterFav ? r.isFavorite : true;
        const matchesDate = filterDate ? r.date.startsWith(filterDate) : true;
        const matchesTag = filterTag ? (r.tags || []).includes(filterTag) : true;
        return matchesSearch && matchesFav && matchesDate && matchesTag;
    });

    const startEdit = (r: any) => {
        setEditingId(r.id);
        setEditNote(r.notes || "");
        setEditQuestion(r.question || "");
        setEditMood(r.mood || 'calm');
    };

    const addPrompt = (text: string) => {
        setEditNote(prev => prev ? `${prev}\n\n**${text}**\n` : `**${text}**\n`);
    };

    const saveEdit = (r: any) => {
        updateReading({ ...r, notes: editNote, mood: editMood, question: editQuestion });
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        if(confirm("Biztosan törölni szeretnéd ezt a bejegyzést?")) {
            deleteReading(id);
            showToast("Bejegyzés törölve.", "info");
        }
    };

    const togglePublicStatus = async (r: Reading) => {
        const newStatus = !r.isPublic;
        updateReading({ ...r, isPublic: newStatus });
        if (newStatus) {
            await CommunityService.publishReading({ ...r, isPublic: true });
            showToast("Jóslat publikálva a közösségnek!", "success");
        } else {
            await CommunityService.unpublishReading(r.id);
            showToast("Jóslat elrejtve a közösség elől.", "info");
        }
    };

    const handleCreateFolder = () => {
        if(newFolderName && currentUser) {
            const updatedFolders = [...(currentUser.folders || []), newFolderName];
            updateUser({ ...currentUser, folders: updatedFolders });
            setNewFolderName("");
            showToast(`Mappa létrehozva: ${newFolderName}`, "success");
        }
    };

    const toggleTagOnReading = (reading: Reading, tag: string) => {
        const currentTags = reading.tags || [];
        let newTags;
        if(currentTags.includes(tag)) {
            newTags = currentTags.filter(t => t !== tag);
        } else {
            newTags = [...currentTags, tag];
        }
        updateReading({ ...reading, tags: newTags });
    };

    const handleCopyToClipboard = (reading: Reading, spreadName: string) => {
        let text = `🔮 ${spreadName} - ${new Date(reading.date).toLocaleDateString()}\n`;
        if (reading.question) text += `❓ Kérdés: ${reading.question}\n`;
        if (reading.notes) text += `📝 Jegyzet: ${reading.notes}\n`;
        text += `\n`;
        
        const spreadInfo = allSpreads.find(s => s.id === reading.spreadId);
        
        reading.cards.forEach(drawn => {
            const card = deck.find((d: any) => d.id === drawn.cardId);
            const pos = spreadInfo?.positions.find(p => p.id === drawn.positionId);
            const posName = pos?.name || `#${drawn.positionId}`;
            
            if (card) {
                text += `${posName}: ${card.name} ${drawn.isReversed ? '(Fordított)' : ''}\n`;
                const meaning = drawn.isReversed ? card.meaningReversed : card.meaningUpright;
                text += `   ${meaning}\n\n`;
            }
        });
        
        navigator.clipboard.writeText(text);
        showToast("Húzás másolva a vágólapra!", "success");
    };

    const handleCompareToggle = (id: string) => {
        if (selectedForCompare.includes(id)) {
            setSelectedForCompare(prev => prev.filter(sid => sid !== id));
        } else {
            if (selectedForCompare.length < 3) {
                setSelectedForCompare(prev => [...prev, id]);
            } else {
                showToast("Maximum 3 húzást választhatsz ki.", "info");
            }
        }
    };

    const launchCompare = () => {
        if (selectedForCompare.length < 2) return;
        const selectedReadings = selectedForCompare.map(id => readings.find(r => r.id === id)).filter(Boolean) as Reading[];
        setCompareReadings(selectedReadings);
    };

    const activeDeckImageSource = availableDecks.find(d => d.id === currentUser?.deckPreference);

    if (compareReadings) {
        return <CompareView readings={compareReadings} onBack={() => { setCompareReadings(null); setSelectedForCompare([]); setIsCompareMode(false); }} />;
    }

    // IF READING SELECTED FOR ANALYSIS
    if (selectedReadingForAnalysis) {
        return <ReadingAnalysis reading={selectedReadingForAnalysis} onClose={() => setSelectedReadingForAnalysis(null)} />;
    }

    return (
        <>
            <div className="space-y-8 pb-20 animate-fade-in max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-serif font-bold">Az Idő Fonalai</h2>
                    <div className="flex gap-2">
                        <div className="bg-black/30 p-1 rounded-lg flex border border-white/10">
                            <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded text-xs font-bold transition ${viewMode === 'list' ? 'bg-white/20 text-white' : 'text-gray-500'}`}>Lista</button>
                            <button onClick={() => setViewMode('map')} className={`px-3 py-1.5 rounded text-xs font-bold transition ${viewMode === 'map' ? 'bg-white/20 text-white' : 'text-gray-500'}`}>Térkép</button>
                        </div>
                        <button 
                            onClick={() => { setIsCompareMode(!isCompareMode); setSelectedForCompare([]); }} 
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors border ${isCompareMode ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/10 border-transparent text-white/60 hover:text-white'}`}
                        >
                            {isCompareMode ? 'Mégse' : '⚖️ Összehasonlítás'}
                        </button>
                        <button onClick={() => setIsManagingFolders(!isManagingFolders)} className="bg-white/10 px-4 py-2 rounded-lg text-sm font-bold hover:bg-white/20 transition-colors">
                            📁 Mappák
                        </button>
                    </div>
                </div>

                {/* Compare Mode Header */}
                {isCompareMode && (
                    <div className="sticky top-20 z-40 bg-indigo-900/90 backdrop-blur-md p-4 rounded-xl border border-indigo-500/50 shadow-2xl flex justify-between items-center mb-6 animate-fade-in">
                        <div className="text-sm font-bold">Kiválasztva: {selectedForCompare.length} / 3</div>
                        <button 
                            onClick={launchCompare}
                            disabled={selectedForCompare.length < 2}
                            className="bg-gold-500 disabled:opacity-50 disabled:cursor-not-allowed text-black px-6 py-2 rounded-lg font-bold shadow-lg hover:scale-105 transition-all"
                        >
                            Elemzés Indítása
                        </button>
                    </div>
                )}
                
                {isManagingFolders && (
                    <div className="glass-panel p-4 rounded-xl mb-4 bg-black/40 border border-gold-500/30 animate-fade-in">
                        <h4 className="font-bold text-xs uppercase mb-2 text-gold-400">Mappák Kezelése</h4>
                        <div className="flex gap-2 mb-4">
                            <input 
                                value={newFolderName} 
                                onChange={e => setNewFolderName(e.target.value)} 
                                placeholder="Új mappa neve..."
                                className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm flex-1"
                            />
                            <button onClick={handleCreateFolder} className="bg-gold-500 text-black px-3 py-1 rounded text-sm font-bold">Létrehozás</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {userFolders.map(f => (
                                <span key={f} className="bg-indigo-600 px-2 py-1 rounded text-xs border border-white/20">📁 {f}</span>
                            ))}
                            {userFolders.length === 0 && <span className="text-xs opacity-50">Nincsenek mappák.</span>}
                        </div>
                    </div>
                )}

                {viewMode === 'map' && (
                    <HistoryHeatmap readings={myReadings} onSelectReading={(r) => { setViewMode('list'); setSelectedReadingForAnalysis(r); }} />
                )}

                {/* Filter Panel */}
                <div className="glass-panel p-4 rounded-xl mb-8 no-print">
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <input 
                            type="text" 
                            placeholder="Keresés kérdésben, jegyzetben vagy kártya nevében..." 
                            className="flex-1 bg-transparent border-b border-white/20 p-2 text-white placeholder-white/30 focus:outline-none focus:border-gold-500 transition-colors"
                            value={search} 
                            onChange={e => setSearch(e.target.value)}
                        />
                        <button onClick={() => setFilterFav(!filterFav)} className={`px-4 py-2 rounded-lg font-bold text-sm border ${filterFav ? 'bg-gold-500 text-black border-gold-500' : 'bg-transparent text-gray-400 border-white/20'}`}>
                            {filterFav ? '★' : '☆'}
                        </button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <input type="month" className="bg-black/30 border border-white/10 p-2 rounded text-white" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
                        <select className="bg-black/30 border border-white/10 p-2 rounded text-white flex-1" value={filterTag} onChange={e => setFilterTag(e.target.value)}>
                            <option value="">-- Minden Mappa --</option>
                            {userFolders.map(f => <option key={f} value={f}>📁 {f}</option>)}
                        </select>
                    </div>
                </div>
                
                <div className="space-y-12">
                    {filtered.map(r => {
                        const spreadInfo = allSpreads.find(s => s.id === r.spreadId);
                        const spreadName = spreadInfo ? spreadInfo.name : 'Ismeretlen';
                        const isSingleCard = r.cards.length === 1;
                        const moodInfo = MOODS.find(m => m.id === r.mood) || MOODS[0];
                        const isSelected = selectedForCompare.includes(r.id);

                        return (
                            <div 
                                key={r.id} 
                                onClick={() => isCompareMode && handleCompareToggle(r.id)}
                                className={`glass-panel p-6 md:p-8 rounded-2xl transition-all group border relative print:border-black print:text-black print:bg-white 
                                    ${isCompareMode ? 'cursor-pointer hover:bg-white/10' : 'hover:bg-white/5'}
                                    ${isSelected ? 'border-gold-500 ring-2 ring-gold-500/50 bg-gold-500/5' : 'border-white/5'}
                                `}
                            >
                                {/* Selection Indicator */}
                                {isCompareMode && (
                                    <div className={`absolute top-4 left-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-gold-500 border-gold-500 text-black' : 'border-white/30 text-transparent'}`}>
                                        ✓
                                    </div>
                                )}

                                {/* Folder Tags on Reading */}
                                <div className={`flex flex-wrap gap-2 mb-4 ${isCompareMode ? 'pl-8' : ''}`}>
                                    {userFolders.map(f => (
                                        <button 
                                            key={f}
                                            onClick={(e) => { e.stopPropagation(); toggleTagOnReading(r, f); }}
                                            className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${r.tags?.includes(f) ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                                        >
                                            {r.tags?.includes(f) ? '📁' : '➕'} {f}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-white/5 pb-4 print:border-black/20">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-black/40 p-3 rounded-xl text-center min-w-[70px] border border-white/10 print:border-black print:bg-gray-100 print:text-black">
                                            <div className="font-bold text-gold-400 text-lg leading-none print:text-black">{new Date(r.date).getDate()}</div>
                                            <div className="text-[10px] opacity-60 uppercase">{new Date(r.date).toLocaleDateString('hu-HU', { month: 'short' })}</div>
                                            <div className="text-[10px] opacity-40">{new Date(r.date).getFullYear()}</div>
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-500/30 uppercase tracking-wide print:text-black print:border-black">
                                                    {spreadName}
                                                </span>
                                                <span className="text-xl" title={`Hangulat: ${moodInfo.label}`}>{moodInfo.icon}</span>
                                                {r.astrology && (
                                                    <div className="flex gap-2 text-[10px] opacity-80">
                                                        {r.astrology.icon && <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10 text-blue-200" title={`Holdfázis: ${r.astrology.moonPhase}`}>{r.astrology.icon} {r.astrology.moonPhase}</span>}
                                                        <span className="bg-white/5 px-2 py-0.5 rounded border border-white/10 hidden sm:inline" title="Napjegy">☀️ {r.astrology.sunSign}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-xs opacity-40 font-mono">
                                                {new Date(r.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {!isCompareMode && (
                                        <div className="flex flex-wrap gap-2 md:gap-3 absolute top-6 right-6 md:static no-print bg-black/40 p-2 rounded-xl backdrop-blur-md border border-white/10 shadow-xl">
                                                {/* NEW: Open Detailed Analysis */}
                                                <button onClick={(e) => { e.stopPropagation(); setSelectedReadingForAnalysis(r); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gold-500/20 text-gold-400 hover:text-gold-200 transition-all border border-gold-500/30" title="Részletes Elemzés">
                                                    🔍
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleCopyToClipboard(r, spreadName); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all text-gray-400 hover:text-white" title="Másolás vágólapra">
                                                    📋
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); togglePublicStatus(r); }} className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all ${r.isPublic ? 'text-green-400' : 'text-gray-400 hover:text-white'}`} title={r.isPublic ? "Publikus (Megosztva)" : "Privát"}>
                                                    {r.isPublic ? '🔓' : '🔒'}
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); toggleFavorite(r.id); }} className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all ${r.isFavorite ? 'text-gold-400' : 'text-gray-400 hover:text-white'}`} title="Kedvenc">
                                                    {r.isFavorite ? '★' : '☆'}
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all" title="Törlés">
                                                    🗑️
                                                </button>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mb-8 cursor-pointer" onClick={() => setSelectedReadingForAnalysis(r)}>
                                    <div className="text-xs font-bold uppercase text-white/30 mb-2 tracking-widest print:text-black/50">A Kérdés</div>
                                    <div className="font-serif text-2xl md:text-3xl italic text-white leading-tight print:text-black">"{r.question || "Csendes elmélkedés..."}"</div>
                                </div>
                                
                                <div className="mb-8">
                                    {isSingleCard ? (
                                        <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start">
                                            {r.cards.map((c: any) => {
                                                const card = deck.find((d: any) => d.id === c.cardId);
                                                if(!card) return null;
                                                return (
                                                    <React.Fragment key={c.positionId}>
                                                        <div className="w-full md:w-1/3 flex-shrink-0">
                                                            <div className={`relative aspect-[2/3] rounded-xl shadow-2xl transition-transform duration-500 hover:scale-105 ${c.isReversed ? 'rotate-180' : ''}`}>
                                                                <img src={getCardImage(c.cardId, activeDeckImageSource)} className="w-full h-full object-cover rounded-xl border border-white/20 print:border-black" loading="lazy" />
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 space-y-4">
                                                            <div className="hidden md:block">
                                                                <div className="text-2xl font-serif font-bold text-gold-400 mb-1 print:text-black">{card.name}</div>
                                                                {c.isReversed && <span className="text-xs text-red-400 uppercase font-bold tracking-widest border border-red-500/30 px-2 py-0.5 rounded bg-red-500/10 print:text-red-600 print:border-red-600">Fordított</span>}
                                                            </div>
                                                            <div className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed whitespace-pre-line print:text-black">
                                                                {/* Simple preview text - Now using Markdown Renderer if we wanted, but keeping simple for preview */}
                                                                <MarkdownRenderer content={c.isReversed ? card.meaningReversed : card.meaningUpright} />
                                                            </div>
                                                        </div>
                                                    </React.Fragment>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                                                {r.cards.sort((a: any, b: any) => a.positionId - b.positionId).map((c: any) => {
                                                    const card = deck.find((d: any) => d.id === c.cardId);
                                                    const pos = spreadInfo?.positions.find(p => p.id === c.positionId);
                                                    const posName = pos?.name || `#${c.positionId}`;
                                                    if(!card) return null;
                                                    return (
                                                        <div key={c.positionId} onClick={(e) => { e.stopPropagation(); setSelectedReadingForAnalysis(r); }} className="group/card flex flex-col gap-2 relative bg-black/20 p-3 rounded-xl border border-white/5 hover:border-gold-500/50 transition-all cursor-pointer hover:bg-white/5 hover:-translate-y-1 print:bg-white print:border-black print:text-black">
                                                            <div className="text-center min-h-[2.5rem] flex flex-col justify-center border-b border-white/5 pb-2 mb-1 print:border-black/20">
                                                                <div className="text-[10px] uppercase font-bold text-gold-500/80 tracking-wider leading-tight print:text-black">{posName}</div>
                                                            </div>
                                                            <div className={`relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-gray-900 shadow-lg ${c.isReversed ? 'rotate-180' : ''}`}>
                                                                <img src={getCardImage(c.cardId, activeDeckImageSource)} className="w-full h-full object-cover opacity-90 group-hover/card:opacity-100 transition-opacity" loading="lazy" />
                                                            </div>
                                                            <div className="text-center mt-1">
                                                                <div className="text-sm font-bold text-gray-200 leading-tight group-hover/card:text-white print:text-black">{card.name}</div>
                                                                {c.isReversed && <div className="text-[9px] text-red-400/80 font-bold uppercase mt-0.5 print:text-red-600">Fordított</div>}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 pt-6 border-t border-white/5 print:border-black/20">
                                    <div className="text-xs font-bold uppercase text-white/30 mb-3 tracking-widest flex items-center gap-2 print:text-black/50"><span>📝</span> Személyes Jegyzetek</div>
                                    {editingId === r.id ? (
                                        <div className="flex flex-col gap-3 animate-fade-in bg-black/40 p-4 rounded-xl border border-white/10 no-print" onClick={e => e.stopPropagation()}>

                                            {/* Edit Title / Question */}
                                            <div className="mb-2">
                                                <label className="text-[10px] uppercase font-bold text-white/50">Jóslat Címe (Kérdés)</label>
                                                <input
                                                    value={editQuestion}
                                                    onChange={e => setEditQuestion(e.target.value)}
                                                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white font-serif italic focus:border-gold-500 outline-none"
                                                    placeholder="Mi volt a kérdés?"
                                                />
                                            </div>

                                            <div className="flex gap-2 mb-2 bg-black/20 p-1 rounded-lg w-fit">
                                                {MOODS.map(m => (
                                                    <button key={m.id} onClick={() => setEditMood(m.id)} className={`w-6 h-6 rounded flex items-center justify-center ${editMood === m.id ? 'bg-white/20' : 'opacity-50'}`}>{m.icon}</button>
                                                ))}
                                            </div>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {PROMPTS.map((p, i) => (
                                                    <button key={i} onClick={() => addPrompt(p)} className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded border border-white/10 transition-colors">
                                                        {p}
                                                    </button>
                                                ))}
                                            </div>
                                            <MarkdownEditor 
                                                value={editNote} 
                                                onChange={setEditNote}
                                                height="h-32"
                                                placeholder="Írd ide a gondolataidat..." 
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white/50 hover:bg-white/10 transition-colors">Mégse</button>
                                                <button onClick={() => saveEdit(r)} className="px-4 py-1.5 bg-gold-500 hover:bg-gold-400 text-black rounded-lg text-xs font-bold shadow-lg transition-colors">Mentés</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-sm bg-black/20 p-4 rounded-xl cursor-text hover:bg-black/30 transition-colors border border-white/5 min-h-[60px] print:bg-white print:text-black print:border-black print:not-italic relative group" onClick={(e) => { e.stopPropagation(); startEdit(r); }} title="Kattints a szerkesztéshez">
                                            {r.notes ? (
                                                <MarkdownRenderer content={r.notes} />
                                            ) : (
                                                <span className="opacity-30 not-italic no-print italic">Kattints ide, hogy leírd az érzéseidet vagy a jóslat értelmezését...</span>
                                            )}
                                            <span className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-xs text-white/30">✏️ Szerkesztés</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
};
