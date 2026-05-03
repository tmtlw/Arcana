
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

export const HistoryView = ({ deck, onBack }: any) => {
    const { readings, currentUser, deleteReading, updateReading, toggleFavorite, availableDecks, allSpreads, showToast, updateUser } = useTarot();
    
    // Filters
    const [search, setSearch] = useState("");
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc' | 'mood' | 'alpha'>('desc');
    const [filterFav, setFilterFav] = useState(false);
    const [filterDate, setFilterDate] = useState(""); // ISO YYYY-MM-DD
    const [filterTag, setFilterTag] = useState("");
    const [filterSunSign, setFilterSunSign] = useState("");
    const [filterMoonSign, setFilterMoonSign] = useState("");
    const [showArchived, setShowArchived] = useState(false);

    // View Mode
    const [viewMode, setViewMode] = useState<'list' | 'gallery' | 'map'>('list');

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

    // Sequence Management State
    const [isManagingSequences, setIsManagingSequences] = useState(false);
    const [newSequenceName, setNewSequenceName] = useState("");

    // Comparison State
    const [isCompareMode, setIsCompareMode] = useState(false);
    const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
    const [compareReadings, setCompareReadings] = useState<Reading[] | null>(null);

    // Stats Modal
    const [showStats, setShowStats] = useState(false);

    // Share as Image State
    const [sharingReading, setSharingReading] = useState<Reading | null>(null);

    // Menu state
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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

            // JAVÍTOTT DÁTUM SZŰRŐ: r.date lehet ISO string vagy Date objektum, filterDate YYYY-MM
            const readingDateStr = typeof r.date === 'string' ? r.date : new Date(r.date).toISOString();
            const matchesDate = filterDate ? readingDateStr.startsWith(filterDate) : true;

            const matchesTag = filterTag ? (r.tags || []).includes(filterTag) || r.sequenceId === filterTag : true;

            // Asztrológia szűrés javítása: normalization
            const normalizeSign = (s: string) => s?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const rSun = r.astrology?.sunSign ? normalizeSign(r.astrology.sunSign) : null;
            const rMoon = r.astrology?.moonSign ? normalizeSign(r.astrology.moonSign) : null;
            const fSun = filterSunSign ? normalizeSign(filterSunSign) : null;
            const fMoon = filterMoonSign ? normalizeSign(filterMoonSign) : null;

            const matchesSun = fSun ? rSun === fSun : true;
            const matchesMoon = fMoon ? rMoon === fMoon : true;
            const matchesArchive = showArchived ? r.isArchived : !r.isArchived;

            return matchesSearch && matchesFav && matchesDate && matchesTag && matchesSun && matchesMoon && matchesArchive;
        });

        return [...result].sort((a, b) => {
            if (sortOrder === 'mood') return (a.mood || '').localeCompare(b.mood || '');
            if (sortOrder === 'alpha') return (a.question || '').localeCompare(b.question || '');
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
    }, [myReadings, search, filterFav, filterDate, filterTag, sortOrder, deck, showArchived]);

    // "Ezen a napon" húzások (Évfordulók és Havi fordulók)
    const onThisDay = useMemo(() => {
        const today = new Date();
        const lastMonth = new Date();
        lastMonth.setMonth(today.getMonth() - 1);

        return myReadings.filter(r => {
            const d = new Date(r.date);
            // Éves évforduló (bármely korábbi év, ugyanaz a hónap/nap)
            const isYearly = d.getMonth() === today.getMonth() && d.getDate() === today.getDate() && d.getFullYear() < today.getFullYear();
            // Havi évforduló (bármely korábbi hónap, ugyanaz a nap)
            const isMonthly = d.getDate() === today.getDate() && (d.getMonth() !== today.getMonth() || d.getFullYear() !== today.getFullYear());
            return isYearly || isMonthly;
        });
    }, [myReadings]);

    // Statisztika hónap navigáció
    const [statsMonth, setStatsMonth] = useState(new Date().getMonth());
    const [statsYear, setStatsYear] = useState(new Date().getFullYear());

    const handleStatsMonthChange = (offset: number) => {
        let newMonth = statsMonth + offset;
        let newYear = statsYear;
        if (newMonth < 0) { newMonth = 11; newYear--; }
        if (newMonth > 11) { newMonth = 0; newYear++; }
        setStatsMonth(newMonth);
        setStatsYear(newYear);
    };

    // Statisztikák (Gyakoriság, Elemi balance, Év kártyája)
    const stats = useMemo(() => {
        const counts: Record<string, number> = {};
        const monthlyCounts: Record<string, number> = {};
        const elements: Record<string, number> = { 'Tűz': 0, 'Víz': 0, 'Levegő': 0, 'Föld': 0 };
        const moonPhases: Record<string, number> = {};

        myReadings.forEach(r => {
            const rDate = new Date(r.date);
            const isTargetMonth = rDate.getMonth() === statsMonth && rDate.getFullYear() === statsYear;

            r.cards.forEach(c => {
                counts[c.cardId] = (counts[c.cardId] || 0) + 1;
                if (isTargetMonth) {
                    monthlyCounts[c.cardId] = (monthlyCounts[c.cardId] || 0) + 1;
                }
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
        const sortedMonthlyCards = Object.entries(monthlyCounts).sort((a, b) => b[1] - a[1]);
        return { sortedCards, sortedMonthlyCards, elements, moonPhases };
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

    const handleCalendarExport = (r: Reading) => {
        const spreadInfo = allSpreads.find(s => s.id === r.spreadId);
        const title = `Tarot: ${r.question || spreadInfo?.name || "Napi húzás"}`;
        const description = `Jegyzet: ${r.notes}\nKártyák: ${r.cards.map(c => deck.find((d: any) => d.id === c.cardId)?.name).join(', ')}`;

        const startDate = new Date(r.date).toISOString().replace(/-|:|\.\d+/g, "");
        const endDate = new Date(new Date(r.date).getTime() + 30 * 60000).toISOString().replace(/-|:|\.\d+/g, ""); // 30 min event

        const icsContent = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "BEGIN:VEVENT",
            `DTSTART:${startDate}`,
            `DTEND:${endDate}`,
            `SUMMARY:${title}`,
            `DESCRIPTION:${description}`,
            "END:VEVENT",
            "END:VCALENDAR"
        ].join("\r\n");

        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tarot_event_${r.id.slice(0,5)}.ics`;
        a.click();
        showToast("Naptár bejegyzés letöltve.");
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

    if ((viewMode as string) === 'map') {
        return (
            <div className="space-y-4">
                <button onClick={() => setViewMode('list')} className="bg-white/10 px-4 py-2 rounded-lg text-sm font-bold">← Vissza a listához</button>
                <HistoryHeatmap readings={myReadings} onSelectReading={(r) => { setViewMode('list'); setSelectedReadingForAnalysis(r); }} />
            </div>
        );
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
                        <button onClick={() => setIsManagingSequences(!isManagingSequences)} className="bg-white/10 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-white/20">📂 Sorozatok</button>
                    </div>
                </div>

                {/* Sequence Management Panel */}
                {isManagingSequences && (
                    <div className="glass-panel p-4 rounded-xl border border-white/10 animate-slide-down">
                        <h3 className="text-sm font-bold mb-4 flex items-center gap-2">📂 Sorozatok Kezelése</h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {(currentUser?.folders || []).map(seq => (
                                <div key={seq} className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1 rounded text-xs">
                                    <span>{seq}</span>
                                    <button onClick={() => updateUser({ ...currentUser!, folders: currentUser?.folders?.filter(f => f !== seq) })} className="text-red-400 hover:text-red-200 ml-1">×</button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                value={newSequenceName}
                                onChange={e => setNewSequenceName(e.target.value)}
                                placeholder="Új sorozat neve..."
                                className="bg-black/30 border border-white/10 rounded px-3 py-1 text-sm flex-1"
                            />
                            <button
                                onClick={() => {
                                    if(newSequenceName && !currentUser?.folders?.includes(newSequenceName)) {
                                        updateUser({ ...currentUser!, folders: [...(currentUser?.folders || []), newSequenceName] });
                                        setNewSequenceName("");
                                    }
                                }}
                                className="bg-gold-500 text-black font-bold px-4 py-1 rounded text-sm"
                            >
                                Hozzáadás
                            </button>
                        </div>
                    </div>
                )}

                {/* On This Day Highlight - Collapsible */}
                {onThisDay.length > 0 && !showArchived && (
                    <details className="bg-gold-500/10 border border-gold-500/30 rounded-2xl overflow-hidden group">
                        <summary className="p-4 cursor-pointer hover:bg-gold-500/5 transition-colors flex items-center justify-between">
                            <h3 className="text-gold-400 font-serif font-bold flex items-center gap-2">✨ Ezen a napon a múltban...</h3>
                            <span className="text-gold-400/50 group-open:rotate-180 transition-transform">▼</span>
                        </summary>
                        <div className="p-4 pt-0">
                            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                {onThisDay.map(r => {
                                    const d = new Date(r.date);
                                    const isMonthly = d.getFullYear() === new Date().getFullYear();
                                    return (
                                        <button key={r.id} onClick={() => setSelectedReadingForAnalysis(r)} className="flex-shrink-0 bg-black/40 p-3 rounded-xl border border-white/10 hover:border-gold-500 transition-colors text-left min-w-[180px]">
                                            <div className="text-[10px] opacity-50 uppercase font-bold text-gold-500/70">
                                                {isMonthly ? `${d.toLocaleDateString('hu-HU', { month: 'short' })} (Havi)` : d.getFullYear()}
                                            </div>
                                            <div className="text-xs font-bold truncate mt-1">{r.question || "Napi húzás"}</div>
                                            <div className="text-[9px] opacity-40 mt-1">{r.cards.length} lapos kirakás</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </details>
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
                        {/* Havi szűrő visszállítása */}
                        <input
                            type="month"
                            className="bg-black/30 border border-white/10 p-2 rounded text-white text-sm"
                            value={filterDate}
                            onChange={e => setFilterDate(e.target.value)}
                        />
                        <button onClick={() => setFilterDate("")} className="text-xs opacity-50 hover:opacity-100">✖ Szűrő törlése</button>
                        <select className="bg-black/30 border border-white/10 p-2 rounded text-white text-sm flex-1 min-w-[150px]" value={filterTag} onChange={e => setFilterTag(e.target.value)}>
                            <option value="">-- Minden Sorozat --</option>
                            {userFolders.map(f => <option key={f} value={f}>📂 {f}</option>)}
                        </select>
                        <select className="bg-black/30 border border-white/10 p-2 rounded text-white text-sm" value={filterSunSign} onChange={e => setFilterSunSign(e.target.value)}>
                            <option value="">☀️ Bármely Napjegy</option>
                            {["Kos", "Bika", "Ikrek", "Rák", "Oroszlán", "Szűz", "Mérleg", "Skorpió", "Nyilas", "Bak", "Vízöntő", "Halak"].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select className="bg-black/30 border border-white/10 p-2 rounded text-white text-sm" value={filterMoonSign} onChange={e => setFilterMoonSign(e.target.value)}>
                            <option value="">🌙 Bármely Holdjegy</option>
                            {["Kos", "Bika", "Ikrek", "Rák", "Oroszlán", "Szűz", "Mérleg", "Skorpió", "Nyilas", "Bak", "Vízöntő", "Halak"].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>


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
                                                    {r.astrology && (
                                                        <div className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded border border-white/5 text-[10px]">
                                                            {r.astrology.sunSign && <span title={`Nap: ${r.astrology.sunSign}`}>☀️ {r.astrology.sunSign}</span>}
                                                            {r.astrology.moonSign && <span title={`Hold: ${r.astrology.moonSign}`}>🌙 {r.astrology.moonSign}</span>}
                                                            {r.astrology.moonPhase && <span title={r.astrology.moonPhase} className="opacity-70">{r.astrology.icon || '🌑'}</span>}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-2">
                                                        {r.importance && (
                                                            <span className="text-gold-400 text-xs font-bold">{'★'.repeat(r.importance)}</span>
                                                        )}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); updateReading({ ...r, isFulfilled: !r.isFulfilled }); showToast(r.isFulfilled ? "Mégse teljesült." : "Beteljesültnek jelölve!"); }}
                                                            className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${r.isFulfilled ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-white/5 text-white/30 border-white/10 hover:bg-white/10'}`}
                                                            title="Beteljesülés jelölése"
                                                        >
                                                            {r.isFulfilled ? '✅ BETELJESÜLT' : 'BETELJESÜLÉS?'}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="text-xs opacity-40 font-mono flex items-center gap-2">
                                                    {new Date(r.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    {r.sequenceId && <span className="text-indigo-400"># Sorozat: {r.sequenceId}</span>}
                                                </div>
                                            </div>
                                        </div>

                                        {!isMultiSelectMode && (
                                            <div className="absolute top-4 right-4 flex items-center gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); toggleFavorite(r.id); }} className={`w-8 h-8 flex items-center justify-center rounded-full border transition-all ${r.isFavorite ? 'bg-gold-500/20 border-gold-500 text-gold-400' : 'bg-white/5 border-white/10 text-white/30 hover:text-white'}`} title="Kedvenc">★</button>
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === r.id ? null : r.id); }}
                                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/20 transition-all border border-white/10"
                                                    >⋮</button>
                                                    {openMenuId === r.id && (
                                                        <>
                                                            <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)}></div>
                                                            <div className="absolute top-full right-0 mt-2 w-48 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl z-50 p-2 space-y-1 animate-scale-in">
                                                                <button onClick={(e) => { e.stopPropagation(); setSelectedReadingForAnalysis(r); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 flex items-center gap-2 text-xs"><span>🔍</span> Részletes Elemzés</button>
                                                                <button onClick={(e) => { e.stopPropagation(); setSharingReading(r); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 flex items-center gap-2 text-xs"><span>🖼️</span> Megosztás képként</button>
                                                                <button onClick={(e) => { e.stopPropagation(); updateReading({ ...r, isPublic: !r.isPublic }); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 flex items-center gap-2 text-xs"><span>{r.isPublic ? '🔒' : '🌍'}</span> {r.isPublic ? 'Priváttá tétel' : 'Publikussá tétel'}</button>
                                                                <button onClick={(e) => { e.stopPropagation(); handleCopyToClipboard(r, spreadName); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 flex items-center gap-2 text-xs"><span>📋</span> Másolás</button>
                                                                <button onClick={(e) => { e.stopPropagation(); handleCalendarExport(r); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 flex items-center gap-2 text-xs"><span>📅</span> Naptárba</button>
                                                                <button onClick={(e) => { e.stopPropagation(); updateReading({ ...r, isArchived: !r.isArchived }); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 flex items-center gap-2 text-xs"><span>📦</span> {r.isArchived ? 'Visszaállítás' : 'Archiválás'}</button>
                                                                <div className="h-px bg-white/5 my-1"></div>
                                                                <button onClick={(e) => { e.stopPropagation(); if(confirm('Törlöd ezt a bejegyzést?')) deleteReading(r.id); setOpenMenuId(null); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-400 flex items-center gap-2 text-xs"><span>🗑️</span> Törlés</button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="text-xs font-bold uppercase text-white/30 tracking-widest">A Kérdés</div>
                                            {editingId !== r.id && (
                                                <button onClick={(e) => { e.stopPropagation(); startEdit(r); }} className="text-sm px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-gold-500 font-bold transition-all" title="Szerkesztés">✎ Szerkesztés</button>
                                            )}
                                        </div>
                                        {editingId === r.id ? (
                                            <div className="space-y-3" onClick={e => e.stopPropagation()}>
                                                <input
                                                    value={editQuestion}
                                                    onChange={e => setEditQuestion(e.target.value)}
                                                    className="w-full bg-black/40 border border-gold-500/30 rounded-lg p-2 text-white font-serif italic"
                                                    placeholder="Kérdés..."
                                                />
                                                <textarea
                                                    value={editNote}
                                                    onChange={e => setEditNote(e.target.value)}
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm h-24"
                                                    placeholder="Jegyzetek, megérzések..."
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setEditingId(null)} className="text-xs px-3 py-1 bg-white/10 rounded">Mégse</button>
                                                    <button onClick={() => saveEdit(r)} className="text-xs px-3 py-1 bg-gold-500 text-black font-bold rounded">Mentés</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="cursor-pointer" onClick={() => !isMultiSelectMode && setSelectedReadingForAnalysis(r)}>
                                                <div className="font-serif text-xl md:text-2xl italic text-white leading-tight mb-2">"{r.question || "Csendes elmélkedés..."}"</div>
                                                {r.notes && (
                                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-sm text-gray-300 italic line-clamp-2">
                                                        {r.notes}
                                                    </div>
                                                )}
                                            </div>
                                        )}
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
                                                                <div
                                                                    className={`relative aspect-[2/3] rounded-xl shadow-2xl cursor-zoom-in group/card ${c.isReversed ? 'rotate-180' : ''}`}
                                                                    onClick={(e) => { e.stopPropagation(); setSelectedReadingForAnalysis(r); }}
                                                                >
                                                                    <img src={getCardImage(c.cardId, activeDeckImageSource)} className="w-full h-full object-cover rounded-xl border border-white/20 group-hover/card:border-gold-500 transition-all" loading="lazy" />
                                                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/card:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white text-xs font-bold">Részletek 🔍</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 space-y-3">
                                                                <div className="text-lg font-serif font-bold text-gold-400">{card.name}</div>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    <div className="space-y-2">
                                                                        <div>
                                                                            <span className="text-[10px] font-bold text-white/30 uppercase block">Általános</span>
                                                                            <div className="text-[11px] text-gray-300 line-clamp-3"><MarkdownRenderer content={c.isReversed ? card.meaningReversed : card.meaningUpright} /></div>
                                                                        </div>
                                                                        {card.dailyMeaning && (
                                                                            <div>
                                                                                <span className="text-[10px] font-bold text-white/30 uppercase block">Napi</span>
                                                                                <div className="text-[11px] text-gray-400 italic line-clamp-2">{card.dailyMeaning}</div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        {card.loveMeaning && (
                                                                            <div>
                                                                                <span className="text-[10px] font-bold text-rose-400/50 uppercase block">Szerelem</span>
                                                                                <div className="text-[11px] text-gray-400 line-clamp-2">{card.loveMeaning}</div>
                                                                            </div>
                                                                        )}
                                                                        {card.careerMeaning && (
                                                                            <div>
                                                                                <span className="text-[10px] font-bold text-indigo-400/50 uppercase block">Hivatás</span>
                                                                                <div className="text-[11px] text-gray-400 line-clamp-2">{card.careerMeaning}</div>
                                                                            </div>
                                                                        )}
                                                                    </div>
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
                                                                <div
                                                                    className={`relative w-full aspect-[2/3] rounded-lg overflow-hidden border border-white/5 cursor-zoom-in group/cardsmall ${c.isReversed ? 'rotate-180' : ''}`}
                                                                    onClick={(e) => { e.stopPropagation(); setSelectedReadingForAnalysis(r); }}
                                                                >
                                                                    <img src={getCardImage(c.cardId, activeDeckImageSource)} className="w-full h-full object-cover group-hover/cardsmall:scale-110 transition-transform" loading="lazy" />
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
                                                <select
                                                    value={r.sequenceId || ""}
                                                    onChange={e => { e.stopPropagation(); updateReading({...r, sequenceId: e.target.value, tags: [e.target.value]}); }}
                                                    onClick={e => e.stopPropagation()}
                                                    className="bg-black/20 border border-white/10 rounded px-2 py-0.5 text-[10px] focus:outline-none focus:border-indigo-500"
                                                >
                                                    <option value="">Nincs</option>
                                                    {userFolders.map(f => <option key={f} value={f}>{f}</option>)}
                                                </select>
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
                        <h2 className="text-3xl font-serif font-bold text-gold-400 mb-4 border-b border-gold-500/20 pb-4">Lélek-Statisztika</h2>

                        <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl mb-8 border border-white/10">
                            <button onClick={() => handleStatsMonthChange(-1)} className="p-2 hover:bg-white/10 rounded-lg">◀</button>
                            <div className="text-center">
                                <div className="text-xs uppercase text-white/40 font-bold">Időszak</div>
                                <div className="text-xl font-serif font-bold text-gold-400">
                                    {new Date(statsYear, statsMonth).toLocaleDateString('hu-HU', { month: 'long', year: 'numeric' })}
                                </div>
                            </div>
                            <button onClick={() => handleStatsMonthChange(1)} className="p-2 hover:bg-white/10 rounded-lg">▶</button>
                        </div>

                        <div className="space-y-10">
                            {/* Év Kártyája (Gyakoriság alapján) */}
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4">A Te Időszakod Vezér-Íve</h3>
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

                            {/* Havi Gyakoriság */}
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4">Ebben a hónapban leggyakoribb</h3>
                                {stats.sortedMonthlyCards.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {stats.sortedMonthlyCards.slice(0, 4).map(([id, count]) => (
                                            <div key={id} className="flex items-center justify-between text-xs bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
                                                <span className="truncate">{deck.find(d => d.id === id)?.name}</span>
                                                <span className="font-bold text-indigo-400">{count}x</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : <div className="text-xs italic opacity-30">Még nincs húzás ebben a hónapban.</div>}
                            </div>

                            {/* Összesített kártya lista */}
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4">Leggyakoribb Lapok (Összesen)</h3>
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

            {/* Share as Image Modal (Mockup view for screenshotting) */}
            {sharingReading && (
                <div className="fixed inset-0 z-[110] bg-black flex items-center justify-center p-4 overflow-y-auto" onClick={() => setSharingReading(null)}>
                    <div className="bg-[#1a1a2e] w-full max-w-md rounded-3xl p-8 border-4 border-gold-500/30 shadow-[0_0_50px_rgba(251,191,36,0.2)] text-center relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSharingReading(null)} className="absolute top-4 right-4 text-white/30 hover:text-white">✕</button>

                        <div className="mb-6">
                            <h3 className="text-gold-400 font-serif text-3xl font-bold italic mb-2">Arkánum</h3>
                            <div className="h-px bg-gradient-to-r from-transparent via-gold-500/50 to-transparent w-full"></div>
                        </div>

                        <div className="mb-8">
                            <div className="text-[10px] text-white/40 uppercase tracking-[0.2em] mb-4">{new Date(sharingReading.date).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                            <div className="font-serif text-2xl text-white italic leading-tight">"{sharingReading.question || "Napi Üzenet"}"</div>
                        </div>

                        <div className="flex justify-center gap-4 mb-8">
                            {sharingReading.cards.map((c, i) => (
                                <div key={i} className={`relative w-24 aspect-[2/3] rounded-lg shadow-2xl border border-white/10 ${c.isReversed ? 'rotate-180' : ''}`}>
                                    <img src={getCardImage(c.cardId, activeDeckImageSource)} className="w-full h-full object-cover rounded-lg" />
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4">
                            {sharingReading.cards.length === 1 && (
                                <div className="text-gold-400 font-serif font-bold text-xl">
                                    {deck.find(d => d.id === sharingReading.cards[0].cardId)?.name}
                                </div>
                            )}
                            <div className="text-xs text-white/50 italic px-4">
                                {sharingReading.notes ? sharingReading.notes.slice(0, 150) + (sharingReading.notes.length > 150 ? "..." : "") : "A sors kereke sosem áll meg."}
                            </div>
                        </div>

                        <div className="mt-12 flex flex-col items-center gap-4 no-print">
                            <div className="text-[10px] text-gold-500/40 font-bold uppercase">Készíts képernyőképet a megosztáshoz!</div>
                            <button onClick={() => window.print()} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full text-sm font-bold border border-white/10 transition-all">🖨️ Nyomtatás / PDF mentés</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
