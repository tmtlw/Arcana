
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

const QUESTION_TEMPLATES = [
    "Mire fókuszáljak ma?",
    "Mi a legfontosabb lecke a kapcsolatomhoz?",
    "Hogyan javíthatnám a pénzügyeimet?",
    "Mi gátol a haladásban?",
    "Mit üzen a tudatalattim?"
];

export const HistoryView = ({ deck, onBack }: any) => {
    const { readings, currentUser, deleteReading, updateReading, toggleFavorite, availableDecks, allSpreads, showToast, updateUser } = useTarot();
    
    // Filters
    const [search, setSearch] = useState("");
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc' | 'mood' | 'alpha'>('desc');
    const [filterFav, setFilterFav] = useState(false);
    const [filterDate, setFilterDate] = useState(""); // ISO YYYY-MM-DD
    const [filterTag, setFilterTag] = useState("");
    const [showArchived, setShowArchived] = useState(false);

    // View Mode
    const [viewMode, setViewMode] = useState<'list' | 'map' | 'gallery'>('list');

    // Selection State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

    // Editing State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editNote, setEditNote] = useState("");
    const [editQuestion, setEditQuestion] = useState("");
    const [editMood, setEditMood] = useState(""); 
    
    // Detail / Analysis State
    const [selectedReadingForAnalysis, setSelectedReadingForAnalysis] = useState<Reading | null>(null);

    // Folder Management State
    const [isManagingFolders, setIsManagingFolders] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");

    // Comparison State
    const [isCompareMode, setIsCompareMode] = useState(false);
    const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
    const [compareReadings, setCompareReadings] = useState<Reading[] | null>(null);

    // Stats Modal
    const [showStats, setShowStats] = useState(false);

    const userFolders = currentUser?.folders || [];

    const myReadings = useMemo(() => readings.filter(r => r.userId === currentUser?.id), [readings, currentUser?.id]);

    const filtered = useMemo(() => {
        const result = myReadings.filter(r => {
            const cardNames = r.cards.map(c => deck.find((d: any) => d.id === c.cardId)?.name || '').join(' ').toLowerCase();
            const searchTerm = search.toLowerCase();

            const matchesSearch = (
                r.question?.toLowerCase().includes(searchTerm) ||
                r.notes.toLowerCase().includes(searchTerm) ||
                cardNames.includes(searchTerm)
            );

            const matchesFav = filterFav ? r.isFavorite : true;

            // JAVÍTOTT DÁTUM SZŰRŐ: r.date ISO formátumú, filterDate pedig YYYY-MM vagy YYYY-MM-DD
            const matchesDate = filterDate ? r.date.includes(filterDate) : true;

            const matchesTag = filterTag ? (r.tags || []).includes(filterTag) : true;
            const matchesArchive = showArchived ? r.isArchived : !r.isArchived;

            return matchesSearch && matchesFav && matchesDate && matchesTag && matchesArchive;
        });

        return [...result].sort((a, b) => {
            if (sortOrder === 'mood') return (a.mood || '').localeCompare(b.mood || '');
            if (sortOrder === 'alpha') return (a.question || '').localeCompare(b.question || '');
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
    }, [myReadings, search, filterFav, filterDate, filterTag, sortOrder, deck, showArchived]);

    // "Ezen a napon" húzások
    const onThisDay = useMemo(() => {
        const today = new Date();
        return myReadings.filter(r => {
            const d = new Date(r.date);
            return d.getMonth() === today.getMonth() && d.getDate() === today.getDate() && d.getFullYear() < today.getFullYear();
        });
    }, [myReadings]);

    // Statisztikák (Gyakoriság, Elemi balance, Év kártyája)
    const stats = useMemo(() => {
        const counts: Record<string, number> = {};
        const elements: Record<string, number> = { 'Tűz': 0, 'Víz': 0, 'Levegő': 0, 'Föld': 0 };
        const moonPhases: Record<string, number> = {};

        myReadings.forEach(r => {
            r.cards.forEach(c => {
                counts[c.cardId] = (counts[c.cardId] || 0) + 1;
                const card = deck.find((d: any) => d.id === c.cardId);
                if (card?.element) {
                    const el = card.element.includes('Tűz') ? 'Tűz' : card.element.includes('Víz') ? 'Víz' : card.element.includes('Levegő') ? 'Levegő' : 'Föld';
                    elements[el]++;
                }
            });
            if (r.astrology?.moonPhase) {
                moonPhases[r.astrology.moonPhase] = (moonPhases[r.astrology.moonPhase] || 0) + 1;
            }
        });

        const sortedCards = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        return { sortedCards, elements, moonPhases };
    }, [myReadings, deck]);

    const handleBulkDelete = () => {
        if(confirm(`${selectedIds.length} bejegyzés törlése?`)) {
            selectedIds.forEach(id => deleteReading(id));
            setSelectedIds([]);
            setIsMultiSelectMode(false);
            showToast("Bejegyzések törölve.");
        }
    };

    const handleBulkArchive = () => {
        selectedIds.forEach(id => {
            const r = readings.find(x => x.id === id);
            if(r) updateReading({ ...r, isArchived: !showArchived });
        });
        setSelectedIds([]);
        setIsMultiSelectMode(false);
        showToast(showArchived ? "Visszaállítva." : "Archiválva.");
    };

    const handleExport = () => {
        let content = "# Arkánum Napló Export\n\n";
        filtered.forEach(r => {
            content += `## ${new Date(r.date).toLocaleDateString()} - ${r.question || "Kérdés nélkül"}\n`;
            content += `Hangulat: ${r.mood || "N/A"} | Fontosság: ${r.importance || 1}/5\n`;
            content += `Jegyzet: ${r.notes}\n\n`;
            r.cards.forEach(c => {
                const card = deck.find((d: any) => d.id === c.cardId);
                content += `- ${card?.name} ${c.isReversed ? "(Fordított)" : ""}\n`;
            });
            content += "\n---\n\n";
        });

        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `arkanum_naplo_${new Date().toISOString().split('T')[0]}.md`;
        a.click();
        showToast("Exportálás kész.");
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

    const startEdit = (r: any) => {
        setEditingId(r.id);
        setEditNote(r.notes || "");
        setEditQuestion(r.question || "");
        setEditMood(r.mood || 'calm');
    };

    const saveEdit = (r: any) => {
        updateReading({ ...r, notes: editNote, mood: editMood, question: editQuestion });
        setEditingId(null);
    };

    const getDominantElement = (cards: DrawnCard[]) => {
        const counts: Record<string, number> = { 'Tűz': 0, 'Víz': 0, 'Levegő': 0, 'Föld': 0 };
        cards.forEach(c => {
            const card = deck.find((d: any) => d.id === c.cardId);
            if (card?.element) {
                const el = card.element.includes('Tűz') ? 'Tűz' : card.element.includes('Víz') ? 'Víz' : card.element.includes('Levegő') ? 'Levegő' : 'Föld';
                counts[el]++;
            }
        });
        return Object.entries(counts).reduce((a, b) => a[1] >= b[1] ? a : b)[0];
    };

    const activeDeckImageSource = availableDecks.find(d => d.id === currentUser?.deckPreference);

    if (compareReadings) {
        return <CompareView readings={compareReadings} onBack={() => { setCompareReadings(null); setSelectedForCompare([]); setIsCompareMode(false); }} />;
    }

    if (selectedReadingForAnalysis) {
        return <ReadingAnalysis reading={selectedReadingForAnalysis} onClose={() => setSelectedReadingForAnalysis(null)} />;
    }

    if (viewMode === 'map') {
        return <HistoryHeatmap readings={myReadings} onSelectReading={(r) => { setViewMode('list'); setSelectedReadingForAnalysis(r); }} />;
    }

    return (
        <>
            <div className="space-y-6 pb-20 animate-fade-in max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div className="flex items-center">
                        <button onClick={onBack} className="mr-4 p-2 hover:bg-white/10 rounded-full transition-colors" title="Vissza a főoldalra">←</button>
                        <h2 className="text-3xl font-serif font-bold">Az Idő Fonalai</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <div className="bg-black/30 p-1 rounded-lg flex border border-white/10">
                            <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded text-xs font-bold transition ${viewMode === 'list' ? 'bg-white/20 text-white' : 'text-gray-500'}`}>Lista</button>
                            <button onClick={() => setViewMode('gallery')} className={`px-3 py-1.5 rounded text-xs font-bold transition ${viewMode === 'gallery' ? 'bg-white/20 text-white' : 'text-gray-500'}`}>Galéria</button>
                            <button onClick={() => setViewMode('map')} className={`px-3 py-1.5 rounded text-xs font-bold transition ${viewMode === 'map' ? 'bg-white/20 text-white' : 'text-gray-500'}`}>Térkép</button>
                        </div>
                        <button onClick={() => setShowStats(true)} className="bg-indigo-600/30 px-3 py-1.5 rounded-lg text-xs font-bold border border-indigo-500/30 hover:bg-indigo-600/50 transition-colors">📊 Statisztika</button>
                        <button 
                            onClick={() => { setIsMultiSelectMode(!isMultiSelectMode); setSelectedIds([]); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border ${isMultiSelectMode ? 'bg-gold-500 text-black border-gold-500' : 'bg-white/10 border-transparent text-white/60'}`}
                        >
                            {isMultiSelectMode ? 'Kész' : '☑️ Kijelölés'}
                        </button>
                        <button onClick={handleExport} className="bg-white/10 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-white/20">📤 Export</button>
                        <button onClick={() => setShowArchived(!showArchived)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${showArchived ? 'bg-amber-600/50 text-white' : 'bg-white/10 text-white/60'}`}>
                            📦 {showArchived ? 'Archiváltak' : 'Archívum'}
                        </button>
                    </div>
                </div>

                {/* On This Day Highlight */}
                {onThisDay.length > 0 && !showArchived && (
                    <div className="bg-gold-500/10 border border-gold-500/30 p-4 rounded-2xl animate-pulse-slow">
                        <h3 className="text-gold-400 font-serif font-bold mb-2 flex items-center gap-2">✨ Ezen a napon a múltban...</h3>
                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                            {onThisDay.map(r => (
                                <button key={r.id} onClick={() => setSelectedReadingForAnalysis(r)} className="flex-shrink-0 bg-black/40 p-2 rounded-xl border border-white/10 hover:border-gold-500 transition-colors text-left min-w-[150px]">
                                    <div className="text-[10px] opacity-50 uppercase">{new Date(r.date).getFullYear()}</div>
                                    <div className="text-xs font-bold truncate">{r.question || "Napi húzás"}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Multi-Select Toolbar */}
                {isMultiSelectMode && selectedIds.length > 0 && (
                    <div className="sticky top-20 z-40 bg-indigo-900/90 backdrop-blur-md p-4 rounded-xl border border-indigo-500/50 shadow-2xl flex justify-between items-center animate-fade-in">
                        <div className="text-sm font-bold">{selectedIds.length} kijelölve</div>
                        <div className="flex gap-2">
                            <button onClick={handleBulkArchive} className="bg-white/20 px-4 py-2 rounded-lg text-xs font-bold">{showArchived ? 'Visszaállítás' : 'Archiválás'}</button>
                            <button onClick={handleBulkDelete} className="bg-red-500 text-white px-4 py-2 rounded-lg text-xs font-bold">Törlés</button>
                        </div>
                    </div>
                )}

                {/* Filter Panel */}
                <div className="glass-panel p-4 rounded-xl mb-4 no-print">
                    <div className="flex flex-col sm:flex-row gap-4 mb-4">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Keresés..."
                                className="w-full bg-black/30 border border-white/10 rounded-lg p-2 pl-10 text-white placeholder-white/30 focus:outline-none focus:border-gold-500 transition-colors"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                            <span className="absolute left-3 top-2.5 opacity-30">🔍</span>
                        </div>
                        <button onClick={() => setFilterFav(!filterFav)} className={`px-4 py-2 rounded-lg font-bold text-sm border ${filterFav ? 'bg-gold-500 text-black border-gold-500' : 'bg-transparent text-gray-400 border-white/20'}`}>
                            {filterFav ? '★' : '☆'}
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <select className="bg-black/30 border border-white/10 p-2 rounded text-white text-sm" value={sortOrder} onChange={e => setSortOrder(e.target.value as any)}>
                            <option value="desc">🕒 Legújabb elől</option>
                            <option value="asc">🕒 Legrégebbi elől</option>
                            <option value="mood">🎭 Hangulat</option>
                            <option value="alpha">🔤 ABC (Kérdés)</option>
                        </select>
                        {/* JAVÍTOTT: Dátum szűrő input típusa és értéke */}
                        <input
                            type="date"
                            className="bg-black/30 border border-white/10 p-2 rounded text-white text-sm"
                            value={filterDate}
                            onChange={e => setFilterDate(e.target.value)}
                        />
                        <button onClick={() => setFilterDate("")} className="text-xs opacity-50 hover:opacity-100">✖ Szűrő törlése</button>
                        <select className="bg-black/30 border border-white/10 p-2 rounded text-white text-sm flex-1 min-w-[150px]" value={filterTag} onChange={e => setFilterTag(e.target.value)}>
                            <option value="">-- Minden Mappa --</option>
                            {userFolders.map(f => <option key={f} value={f}>📁 {f}</option>)}
                        </select>
                    </div>
                </div>

                {/* Question Templates for Search quick-start */}
                {!search && !filterDate && (
                    <div className="flex gap-2 overflow-x-auto pb-4 no-print custom-scrollbar">
                        {QUESTION_TEMPLATES.map(t => (
                            <button key={t} onClick={() => setSearch(t)} className="whitespace-nowrap text-[10px] bg-white/5 border border-white/10 px-3 py-1 rounded-full hover:bg-white/10 transition-colors opacity-60">
                                {t}
                            </button>
                        ))}
                    </div>
                )}

                {viewMode === 'gallery' ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                        {filtered.map(r => (
                            <div key={r.id} onClick={() => setSelectedReadingForAnalysis(r)} className="group relative aspect-[2/3] cursor-pointer">
                                <img src={getCardImage(r.cards[0].cardId, activeDeckImageSource)} className="w-full h-full object-cover rounded-lg border border-white/10 group-hover:border-gold-500 transition-all" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-2 text-center transition-opacity rounded-lg">
                                    <div className="text-[8px] font-bold uppercase">{new Date(r.date).toLocaleDateString()}</div>
                                    <div className="text-[10px] mt-1 line-clamp-2">{r.question || "Névtelen"}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filtered.map(r => {
                            const spreadInfo = allSpreads.find(s => s.id === r.spreadId);
                            const spreadName = spreadInfo ? spreadInfo.name : 'Ismeretlen';
                            const isSingleCard = r.cards.length === 1;
                            const moodInfo = MOODS.find(m => m.id === r.mood) || MOODS[0];
                            const isSelected = selectedIds.includes(r.id);
                            const dominantElement = getDominantElement(r.cards);
                            const elementIcons: any = { 'Tűz': '🔥', 'Víz': '💧', 'Levegő': '🌬️', 'Föld': '🌿' };

                            return (
                                <div
                                    key={r.id}
                                    onClick={() => isMultiSelectMode && setSelectedIds(prev => isSelected ? prev.filter(id => id !== r.id) : [...prev, r.id])}
                                    className={`glass-panel p-4 md:p-5 rounded-2xl transition-all group border relative
                                        ${isMultiSelectMode ? 'cursor-pointer hover:bg-white/10' : 'hover:bg-white/5'}
                                        ${isSelected ? 'border-gold-500 ring-2 ring-gold-500/50 bg-gold-500/5' : 'border-white/5'}
                                        ${r.importance && r.importance >= 4 ? 'shadow-[0_0_20px_rgba(251,191,36,0.1)]' : ''}
                                    `}
                                >
                                    {/* Multi-Select Indicator */}
                                    {isMultiSelectMode && (
                                        <div className={`absolute top-4 left-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-gold-500 border-gold-500 text-black' : 'border-white/30 text-transparent'}`}>
                                            ✓
                                        </div>
                                    )}

                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-white/5 pb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-black/40 p-3 rounded-xl text-center min-w-[70px] border border-white/10">
                                                <div className="font-bold text-gold-400 text-lg leading-none">{new Date(r.date).getDate()}</div>
                                                <div className="text-[10px] opacity-60 uppercase">{new Date(r.date).toLocaleDateString('hu-HU', { month: 'short' })}</div>
                                                <div className="text-[10px] opacity-40">{new Date(r.date).getFullYear()}</div>
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-500/30 uppercase tracking-wide">
                                                        {spreadName}
                                                    </span>
                                                    <span className="text-xl" title={`Hangulat: ${moodInfo.label}`}>{moodInfo.icon}</span>
                                                    <span className="text-xl" title={`Domináns elem: ${dominantElement}`}>{elementIcons[dominantElement]}</span>
                                                    {r.importance && (
                                                        <span className="text-gold-400 text-xs font-bold">{'★'.repeat(r.importance)}</span>
                                                    )}
                                                    {r.isFulfilled && (
                                                        <span className="bg-green-500/20 text-green-400 text-[9px] font-bold px-2 py-0.5 rounded border border-green-500/30">BETELJESÜLT</span>
                                                    )}
                                                </div>
                                                <div className="text-xs opacity-40 font-mono flex items-center gap-2">
                                                    {new Date(r.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    {r.sequenceId && <span className="text-indigo-400"># Sorozat: {r.sequenceId}</span>}
                                                </div>
                                            </div>
                                        </div>

                                        {!isMultiSelectMode && (
                                            <div className="flex flex-wrap gap-1.5 absolute top-4 right-4 md:static no-print bg-black/40 p-2 rounded-xl backdrop-blur-md border border-white/10 shadow-xl">
                                                <button onClick={(e) => { e.stopPropagation(); setSelectedReadingForAnalysis(r); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gold-500/20 text-gold-400 hover:text-gold-200 transition-all border border-gold-500/30" title="Részletes Elemzés">🔍</button>
                                                <button onClick={(e) => { e.stopPropagation(); updateReading({ ...r, isFulfilled: !r.isFulfilled }); showToast(r.isFulfilled ? "Mégse teljesült." : "Beteljesültnek jelölve!"); }} className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all ${r.isFulfilled ? 'text-green-400' : 'text-gray-400'}`} title="Beteljesülés jelölése">✅</button>
                                                <button onClick={(e) => { e.stopPropagation(); handleCopyToClipboard(r, spreadName); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all text-gray-400 hover:text-white" title="Másolás">📋</button>
                                                <button onClick={(e) => { e.stopPropagation(); toggleFavorite(r.id); }} className={`w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all ${r.isFavorite ? 'text-gold-400' : 'text-gray-400'}`} title="Kedvenc">★</button>
                                                <button onClick={(e) => { e.stopPropagation(); updateReading({ ...r, isArchived: !r.isArchived }); }} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400" title={r.isArchived ? "Visszaállítás" : "Archiválás"}>📦</button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-4 cursor-pointer" onClick={() => !isMultiSelectMode && setSelectedReadingForAnalysis(r)}>
                                        <div className="text-xs font-bold uppercase text-white/30 mb-2 tracking-widest">A Kérdés</div>
                                        <div className="font-serif text-xl md:text-2xl italic text-white leading-tight">"{r.question || "Csendes elmélkedés..."}"</div>
                                    </div>

                                    <div className="mb-4">
                                        {isSingleCard ? (
                                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                                {r.cards.map((c: any) => {
                                                    const card = deck.find((d: any) => d.id === c.cardId);
                                                    if(!card) return null;
                                                    return (
                                                        <React.Fragment key={c.positionId}>
                                                            <div className="w-full md:w-32 flex-shrink-0">
                                                                <div className={`relative aspect-[2/3] rounded-xl shadow-2xl ${c.isReversed ? 'rotate-180' : ''}`}>
                                                                    <img src={getCardImage(c.cardId, activeDeckImageSource)} className="w-full h-full object-cover rounded-xl border border-white/20" loading="lazy" />
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 space-y-2">
                                                                <div className="text-lg font-serif font-bold text-gold-400">{card.name}</div>
                                                                <div className="text-xs text-gray-400 line-clamp-3 overflow-hidden">
                                                                    <MarkdownRenderer content={c.isReversed ? card.meaningReversed : card.meaningUpright} />
                                                                </div>
                                                            </div>
                                                        </React.Fragment>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                                                    {r.cards.sort((a: any, b: any) => a.positionId - b.positionId).map((c: any) => {
                                                        const card = deck.find((d: any) => d.id === c.cardId);
                                                        if(!card) return null;
                                                        return (
                                                            <div key={c.positionId} className="flex flex-col items-center">
                                                                <div className={`relative w-full aspect-[2/3] rounded-lg overflow-hidden border border-white/5 ${c.isReversed ? 'rotate-180' : ''}`}>
                                                                    <img src={getCardImage(c.cardId, activeDeckImageSource)} className="w-full h-full object-cover" loading="lazy" />
                                                                </div>
                                                                <div className="text-[8px] font-bold truncate mt-1 text-white/50">{card.name}</div>
                                                            </div>
                                                        )
                                                    })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Importance Selector in card */}
                                    {!isMultiSelectMode && (
                                        <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap justify-between items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-white/30 uppercase font-bold">Fontosság:</span>
                                                <div className="flex gap-1">
                                                    {[1,2,3,4,5].map(lvl => (
                                                        <button key={lvl} onClick={(e) => { e.stopPropagation(); updateReading({ ...r, importance: lvl }); }} className={`w-5 h-5 rounded flex items-center justify-center text-xs ${r.importance === lvl ? 'bg-gold-500 text-black' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}>{lvl}</button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-white/30 uppercase font-bold">Sorozat:</span>
                                                <input
                                                    value={r.sequenceId || ""}
                                                    onChange={e => { e.stopPropagation(); updateReading({...r, sequenceId: e.target.value}); }}
                                                    onClick={e => e.stopPropagation()}
                                                    placeholder="Nincs"
                                                    className="bg-black/20 border border-white/10 rounded px-2 py-0.5 text-[10px] w-20 focus:outline-none focus:border-indigo-500"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Stats Modal */}
            {showStats && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowStats(false)}>
                    <div className="glass-panel-dark max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-3xl p-6 md:p-10 relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowStats(false)} className="absolute top-6 right-6 text-white/50 hover:text-white">✕</button>
                        <h2 className="text-3xl font-serif font-bold text-gold-400 mb-8 border-b border-gold-500/20 pb-4">Lélek-Statisztika</h2>

                        <div className="space-y-10">
                            {/* Év Kártyája (Gyakoriság alapján) */}
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4">Az Te Időszakod Vezér-Íve</h3>
                                {stats.sortedCards[0] ? (
                                    <div className="flex items-center gap-6 bg-white/5 p-4 rounded-2xl border border-gold-500/20">
                                        <img src={getCardImage(stats.sortedCards[0][0], activeDeckImageSource)} className="w-20 md:w-32 rounded-lg shadow-xl" />
                                        <div>
                                            <div className="text-2xl font-serif font-bold text-gold-400">{deck.find(d => d.id === stats.sortedCards[0][0])?.name}</div>
                                            <div className="text-sm opacity-50 mt-1">Ezt a lapot húztad a legtöbbször: {stats.sortedCards[0][1]} alkalommal.</div>
                                        </div>
                                    </div>
                                ) : <div className="text-sm italic opacity-30">Még nincs elég adat.</div>}
                            </div>

                            {/* Elemi Balance */}
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4">Elemi Egyensúly</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {Object.entries(stats.elements).map(([el, count]) => (
                                        <div key={el} className="bg-black/40 p-4 rounded-xl border border-white/5 text-center">
                                            <div className="text-2xl mb-1">{el === 'Tűz' ? '🔥' : el === 'Víz' ? '💧' : el === 'Levegő' ? '🌬️' : '🌿'}</div>
                                            <div className="text-xs font-bold text-white/60">{el}</div>
                                            <div className="text-xl font-bold text-gold-400">{count}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Holdfázis korreláció */}
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4">Hold-Rezonancia</h3>
                                <div className="space-y-2">
                                    {Object.entries(stats.moonPhases).sort((a,b) => b[1] - a[1]).map(([phase, count]) => (
                                        <div key={phase} className="flex items-center justify-between bg-white/5 px-4 py-2 rounded-lg border border-white/5">
                                            <span className="text-sm font-bold">{phase}</span>
                                            <div className="flex items-center gap-3">
                                                <div className="h-1.5 bg-indigo-500 rounded-full" style={{ width: `${(count / myReadings.length) * 100}px`, minWidth: '4px' }}></div>
                                                <span className="text-xs font-bold text-gold-400">{count} húzás</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Top 5 kártya lista */}
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4">Leggyakoribb Lapok</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {stats.sortedCards.slice(0, 6).map(([id, count]) => (
                                        <div key={id} className="flex items-center justify-between text-xs bg-black/20 p-2 rounded-lg">
                                            <span className="truncate">{deck.find(d => d.id === id)?.name}</span>
                                            <span className="font-bold text-indigo-400">{count}x</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-10 flex justify-center">
                            <button onClick={() => setShowStats(false)} className="bg-gold-500 text-black px-10 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-all">Visszatérés</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
