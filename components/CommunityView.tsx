
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { CommunityService } from '../services/communityService';
import { Reading, Comment } from '../types';
import { useTarot } from '../context/TarotContext';
import { CardImage } from './CardImage';
import { FULL_DECK, MOODS, getAvatarUrl } from '../constants';

// Custom Mystic Spark Icon
const MysticSparkIcon = ({ filled, className }: { filled: boolean, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2Z" />
    </svg>
);

// --- Továbbfejlesztett Vizuális Beviteli Mező Kurzor-kezeléssel ---
const VisualMentionInput = ({ value, onChange, onSearch, placeholder, className, id }: any) => {
    const inputRef = useRef<HTMLDivElement>(null);
    const lastValueRef = useRef(value);

    // Szöveg konvertálása HTML-lé (Chips-ekkel)
    const getHTML = (text: string) => {
        if (!text) return "";
        return text.replace(/@\[([^\]]+):([^\]]+)\]/g, (match, id, name) => {
            return `<span class="inline-flex items-center px-2 py-0.5 rounded-lg bg-gold-500/20 text-gold-400 text-[11px] font-bold border border-gold-500/30 mx-0.5" contenteditable="false" data-id="${id}">@${name}</span>&nbsp;`;
        });
    };

    // HTML konvertálása nyers szöveggé a mentéshez
    const getText = (html: string) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html.replace(/&nbsp;/g, ' ');
        const spans = tmp.querySelectorAll('span[data-id]');
        spans.forEach(span => {
            const id = span.getAttribute('data-id');
            const name = span.textContent?.replace('@', '').trim();
            span.outerHTML = `@[${id}:${name}]`;
        });
        return tmp.innerText || tmp.textContent || "";
    };

    // Kurzor végére helyezése
    const moveCursorToEnd = () => {
        if (!inputRef.current) return;
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(inputRef.current);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
        inputRef.current.focus();
    };

    useEffect(() => {
        // Csak akkor frissítünk HTML-t, ha a kinti állapot (prop) eltér a legutóbbi belsőtől 
        // (pl. válasz gombnál vagy törlésnél, nem gépelésnél)
        if (inputRef.current && value !== lastValueRef.current) {
            inputRef.current.innerHTML = getHTML(value);
            lastValueRef.current = value;
            // Ha külső forrásból jött a váltás (pl. válasz), tegyük a kurzort a végére
            moveCursorToEnd();
        }
    }, [value]);

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        const html = e.currentTarget.innerHTML;
        const rawText = getText(html);
        lastValueRef.current = rawText; // Elmentjük, hogy ne triggereljen useEffect-et
        onChange(rawText);

        // Keresés figyelése (@ jel után)
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const textBeforeCaret = range.startContainer.textContent?.substring(0, range.startOffset) || "";
            const words = textBeforeCaret.split(/\s/);
            const lastWord = words[words.length - 1];
            
            if (lastWord.startsWith("@")) {
                onSearch(lastWord.substring(1));
            } else {
                onSearch(null);
            }
        }
    };

    return (
        <div
            id={id}
            ref={inputRef}
            contentEditable
            onInput={handleInput}
            placeholder={placeholder}
            className={`w-full min-h-[80px] bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-gold-500 outline-none overflow-y-auto empty:before:content-[attr(placeholder)] empty:before:text-white/20 ${className}`}
        />
    );
};

export const CommunityView = ({ onBack, onNavigate }: { onBack: () => void, onNavigate?: (view: string, param?: string) => void }) => {
    const { allSpreads, currentUser, showToast } = useTarot();
    const [publicReadings, setPublicReadings] = useState<Reading[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [expandedCommentsId, setExpandedCommentsId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'latest' | 'top'>('latest');
    
    const [animatingLikes, setAnimatingLikes] = useState<Record<string, boolean>>({});

    // Comment States
    const [newCommentText, setNewCommentText] = useState("");
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState("");

    // --- @Mention Autocomplete States ---
    const [showMentionList, setShowMentionList] = useState(false);
    const [mentionFilter, setMentionFilter] = useState("");

    useEffect(() => {
        loadReadings();
    }, []);

    const loadReadings = async () => {
        setLoading(true);
        const data = await CommunityService.getPublicReadings(30);
        setPublicReadings(data);
        setLoading(false);
    };

    const mentionableUsers = useMemo(() => {
        const usersMap = new Map<string, { id: string, name: string, avatar?: string }>();
        
        publicReadings.forEach(r => {
            if (r.userId && r.authorName) {
                usersMap.set(r.userId, { id: r.userId, name: r.authorName, avatar: r.authorAvatar });
            }
            (r.comments || []).forEach(c => {
                if (c.userId && c.userName) {
                    usersMap.set(c.userId, { id: c.userId, name: c.userName, avatar: c.userAvatar });
                }
            });
        });

        if (currentUser) usersMap.delete(currentUser.id);

        const list = Array.from(usersMap.values());
        if (!mentionFilter) return list;
        return list.filter(u => u.name.toLowerCase().includes(mentionFilter.toLowerCase()));
    }, [publicReadings, mentionFilter, currentUser]);

    const renderWithMentions = (text: string) => {
        if (!text) return null;
        const parts = text.split(/(@\[[^\]]+:[^\]]+\])/g);
        return parts.map((part, i) => {
            const match = part.match(/^@\[([^\]]+):([^\]]+)\]$/);
            if (match) {
                const [, id, name] = match;
                return (
                    <span 
                        key={i} 
                        onClick={(e) => { e.stopPropagation(); if(onNavigate) onNavigate('profile', id); }}
                        className="inline-flex items-center px-2 py-0.5 rounded-lg bg-gold-500/20 text-gold-400 text-[11px] font-bold border border-gold-500/30 cursor-pointer hover:bg-gold-500/40 transition-colors mx-0.5"
                    >
                        @{name}
                    </span>
                );
            }
            return part;
        });
    };

    const handleMentionSearch = (filter: string | null) => {
        if (filter !== null) {
            setMentionFilter(filter);
            setShowMentionList(true);
        } else {
            setShowMentionList(false);
        }
    };

    const insertMention = (user: { id: string, name: string }, isEditing: boolean = false) => {
        const currentVal = isEditing ? editingText : newCommentText;
        const words = currentVal.split(/\s/);
        words.pop(); 
        const prefix = words.join(" ");
        const mention = `@[${user.id}:${user.name}] `;
        const result = (prefix ? prefix + " " : "") + mention;
        
        if (isEditing) setEditingText(result);
        else setNewCommentText(result);
        
        setShowMentionList(false);
        setMentionFilter("");
    };

    const handleReply = (comment: Comment) => {
        const mention = `@[${comment.userId}:${comment.userName}] `;
        setNewCommentText(mention);
        setExpandedCommentsId(expandedCommentsId === null ? expandedCommentsId : expandedCommentsId); 
        setTimeout(() => {
            const inputEl = document.getElementById('comment-input');
            if (inputEl) inputEl.focus();
        }, 100);
    };

    const handleLike = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser) return;

        setAnimatingLikes(prev => ({ ...prev, [id]: true }));
        setTimeout(() => setAnimatingLikes(prev => ({ ...prev, [id]: false })), 500);

        const result = await CommunityService.toggleLike(id, currentUser.id);
        
        if (result) {
            setPublicReadings(prev => prev.map(r => {
                if (r.id === id) {
                    const likedBy = r.likedBy ? [...r.likedBy] : [];
                    if (result === 'added') {
                        if(!likedBy.includes(currentUser.id)) likedBy.push(currentUser.id);
                        return { ...r, likes: (r.likes || 0) + 1, likedBy };
                    } else {
                        return { ...r, likes: Math.max(0, (r.likes || 0) - 1), likedBy: likedBy.filter(uid => uid !== currentUser.id) };
                    }
                }
                return r;
            }));
        } else {
            showToast("Hiba: Nem sikerült a kedvelés.", "info");
        }
    };

    const handleAddComment = async (readingId: string) => {
        if (!newCommentText.trim() || !currentUser) return;
        
        const newComment: Comment = {
            id: Math.random().toString(36).substring(2),
            userId: currentUser.id,
            userName: currentUser.name,
            userAvatar: getAvatarUrl(currentUser),
            text: newCommentText.trim(),
            date: new Date().toISOString()
        };

        const success = await CommunityService.addComment(readingId, newComment);
        if (success) {
            setPublicReadings(prev => prev.map(r => r.id === readingId ? { ...r, comments: [...(r.comments || []), newComment] } : r));
            setNewCommentText("");
            showToast("Komment elküldve!", "success");
        } else {
            showToast("Hiba történt a küldéskor.", "info");
        }
    };

    const handleDeleteComment = async (readingId: string, comment: Comment) => {
        if (!confirm("Biztosan törlöd ezt a hozzászólást?")) return;
        const success = await CommunityService.deleteComment(readingId, comment);
        if (success) {
            setPublicReadings(prev => prev.map(r => 
                r.id === readingId 
                ? { ...r, comments: (r.comments || []).filter(c => c.id !== comment.id) } 
                : r
            ));
            showToast("Komment törölve.", "success");
        } else {
            showToast("Hiba törléskor.", "info");
        }
    };

    const handleUpdateComment = async (readingId: string) => {
        if (!editingCommentId || !editingText.trim()) return;
        const success = await CommunityService.updateComment(readingId, editingCommentId, editingText.trim());
        if (success) {
            setPublicReadings(prev => prev.map(r => 
                r.id === readingId 
                ? { ...r, comments: (r.comments || []).map(c => c.id === editingCommentId ? { ...c, text: editingText.trim(), isEdited: true } : c) } 
                : r
            ));
            setEditingCommentId(null);
            showToast("Komment módosítva.", "success");
        } else {
            showToast("Hiba módosításkor.", "info");
        }
    };

    const startEditingComment = (comment: Comment) => {
        setEditingCommentId(comment.id);
        setEditingText(comment.text);
    };

    const handleAdminDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if(!confirm("ADMIN: Biztosan törlöd ezt a bejegyzést?")) return;
        const success = await CommunityService.deletePublicReading(id);
        if (success) {
            setPublicReadings(prev => prev.filter(r => r.id !== id));
            showToast("Bejegyzés törölve!", "success");
        } else {
            showToast("Hiba a törléskor (Jogosultság?)", "info");
        }
    };

    const handleAuthorClick = (userId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (onNavigate) onNavigate('profile', userId);
    };

    const sortedReadings = useMemo(() => {
        const list = [...publicReadings];
        if (filter === 'top') {
            return list.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        }
        return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [publicReadings, filter]);

    const getReadingStats = (reading: Reading) => {
        const cards = reading.cards.map(c => FULL_DECK.find(f => f.id === c.cardId)).filter(Boolean);
        const elements: Record<string, number> = { 'Tűz': 0, 'Víz': 0, 'Levegő': 0, 'Föld': 0 };
        let majorCount = 0;
        
        cards.forEach(c => {
            if (c?.element) elements[c.element]++;
            if (c?.arcana === 'Major') majorCount++;
        });

        const domElement = Object.entries(elements).sort((a,b) => b[1] - a[1])[0];
        const moodItem = MOODS.find(m => m.id === reading.mood);

        return {
            domElement: domElement[1] > 0 ? domElement[0] : 'Vegyes',
            majorRatio: Math.round((majorCount / cards.length) * 100),
            moodIcon: moodItem?.icon || '😐',
            moodLabel: moodItem?.label || '',
            topCards: cards.slice(0, 3).map(c => c?.name).join(', ')
        };
    };

    const VisualReadingLayout = ({ reading }: { reading: Reading }) => {
        const spread = allSpreads.find(s => s.id === reading.spreadId);
        if (!spread) return <div className="text-center p-4">A kirakás nem jeleníthető meg vizuálisan.</div>;

        const maxX = Math.max(...spread.positions.map(p => p.x));
        const maxY = Math.max(...spread.positions.map(p => p.y));
        
        const gridStyle = {
            display: 'grid',
            gridTemplateColumns: `repeat(${maxX}, 1fr)`,
            gridTemplateRows: `repeat(${maxY}, auto)`,
            gap: '10px',
            maxWidth: '100%',
            width: `${maxX * 100}px` 
        };

        return (
            <div className="w-full overflow-x-auto p-4 custom-scrollbar flex justify-center bg-black/40 rounded-xl mt-4">
                <div style={gridStyle} className="min-w-[300px]">
                    {spread.positions.map(pos => {
                        const drawn = reading.cards.find(c => c.positionId === pos.id);
                        const card = drawn ? FULL_DECK.find(c => c.id === drawn.cardId) : null;
                        
                        return (
                            <div 
                                key={pos.id}
                                style={{ 
                                    gridColumn: pos.x, 
                                    gridRow: pos.y,
                                    transform: pos.rotation ? 'rotate(90deg)' : 'none'
                                }}
                                className="relative flex flex-col items-center group"
                            >
                                <div className={`relative w-full aspect-[2/3] rounded-lg overflow-hidden shadow-lg border border-white/20 bg-black/50 transition-transform duration-300 hover:z-50 hover:scale-125 hover:shadow-2xl ${drawn?.isReversed ? 'rotate-180' : ''}`}>
                                    {card ? (
                                        <CardImage cardId={card.id} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-white/5 text-xs">?</div>
                                    )}
                                </div>
                                {card && (
                                    <div className="absolute top-full mt-2 bg-black/90 p-2 rounded text-xs text-white z-50 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/20 pointer-events-none">
                                        <div className="font-bold text-gold-400">{pos.name}</div>
                                        <div>{card.name} {drawn?.isReversed ? '(Ford.)' : ''}</div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="animate-fade-in max-w-3xl mx-auto pb-24">
            
            {/* Admin Header */}
            {currentUser?.isAdmin && (
                <div className="mb-6 bg-red-500/10 border border-red-500/40 rounded-xl p-4 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🔧</span>
                        <div>
                            <div className="font-bold text-red-200 text-sm uppercase tracking-widest">Adminisztrátor Mód Aktív</div>
                            <div className="text-xs text-red-200/60">Minden bejegyzés törölhető.</div>
                        </div>
                    </div>
                    {onNavigate && (
                        <button 
                            onClick={() => onNavigate('admin')}
                            className="bg-red-500/20 hover:bg-red-500/40 text-red-100 px-4 py-2 rounded-lg font-bold text-xs transition-colors border border-red-500/30"
                        >
                            Admin Pult &rarr;
                        </button>
                    )}
                </div>
            )}

            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white font-bold transition-colors self-start">
                    &larr; Vissza
                </button>
                
                <div className="flex bg-white/5 p-1 rounded-lg">
                    <button 
                        onClick={() => setFilter('latest')}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filter === 'latest' ? 'bg-gold-500 text-black' : 'text-white/50 hover:text-white'}`}
                    >
                        Legújabb
                    </button>
                    <button 
                        onClick={() => setFilter('top')}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${filter === 'top' ? 'bg-gold-500 text-black' : 'text-white/50 hover:text-white'}`}
                    >
                        Népszerű
                    </button>
                </div>

                <div className="flex gap-2">
                    <button onClick={loadReadings} className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1 rounded-full border border-white/10 transition-colors" title="Frissítés">
                        ↻
                    </button>
                </div>
            </div>

            <div className="text-center mb-10">
                <h2 className="text-4xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-white to-gold-400 drop-shadow-sm">
                    Közösségi Tér
                </h2>
                <p className="text-white/60 mt-2 text-sm italic">
                    "Ahogy fenn, úgy lenn." - Fedezd fel mások útját.
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin text-4xl">🔮</div>
                </div>
            ) : sortedReadings.length === 0 ? (
                <div className="text-center py-20 opacity-50 bg-white/5 rounded-2xl border border-dashed border-white/10">
                    <p className="font-serif">Még nincsenek publikus húzások. Oszd meg a tiédet!</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {sortedReadings.map(reading => {
                        const spreadName = allSpreads.find(s => s.id === reading.spreadId)?.name || 'Ismeretlen';
                        const isExpanded = expandedId === reading.id;
                        const isCommentsOpen = expandedCommentsId === reading.id;
                        const stats = getReadingStats(reading);
                        const isLiked = reading.likedBy?.includes(currentUser?.id || '');
                        const commentCount = (reading.comments || []).length;
                        const isAnimating = animatingLikes[reading.id];

                        return (
                            <div 
                                key={reading.id} 
                                className={`glass-panel rounded-2xl border transition-all duration-300 relative overflow-hidden ${isExpanded ? 'bg-black/60 border-gold-500/30 ring-1 ring-gold-500/20' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}`}
                            >
                                {/* Admin Delete */}
                                {currentUser?.isAdmin && (
                                    <button 
                                        onClick={(e) => handleAdminDelete(reading.id, e)}
                                        className="absolute top-4 right-4 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 p-2 rounded-full transition-colors z-20"
                                        title="Törlés (Admin)"
                                    >
                                        🗑️
                                    </button>
                                )}

                                {/* Main Content */}
                                <div className="p-6 cursor-pointer" onClick={() => setExpandedId(expandedId === reading.id ? null : reading.id)}>
                                    
                                    {/* Top Metadata Row */}
                                    <div className="flex flex-wrap gap-3 mb-4 text-[10px] uppercase font-bold tracking-widest text-white/40">
                                        <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/5">
                                            📅 {new Date(reading.date).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/5 text-gold-200">
                                            💠 {spreadName}
                                        </span>
                                        {reading.astrology && (
                                            <>
                                                <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/5 text-blue-200" title={`Holdfázis: ${reading.astrology.moonPhase}`}>
                                                    {reading.astrology.icon} {reading.astrology.moonPhase} ({reading.astrology.moonSign})
                                                </span>
                                                <span className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/5 text-orange-200" title={`Napjegy: ${reading.astrology.sunSign}`}>
                                                    ☀️ {reading.astrology.sunSign}
                                                </span>
                                            </>
                                        )}
                                        {/* Show Deck Name if saved (assuming deck metadata might be available in future or extended Reading type, currently we simulate or check if field exists) */}
                                        {/* Assuming 'deckId' or similar might exist, or we can look up preference if user is known, but better to rely on saved reading data if it had it.
                                            For now, we can show generic info or if ExtendedReading has it.
                                            Since Reading type doesn't explicitly store deckName, we'll skip unless we add it,
                                            but let's display what we have nicely.
                                        */}
                                    </div>

                                    {/* Author & Question */}
                                    <div className="flex gap-4 mb-4">
                                        <div onClick={(e) => handleAuthorClick(reading.userId, e)} className="flex-shrink-0 cursor-pointer group/avatar">
                                            <img 
                                                src={reading.authorAvatar || 'https://api.dicebear.com/7.x/lorelei/svg?seed=Guest'} 
                                                className="w-12 h-12 rounded-full border-2 border-white/10 group-hover/avatar:border-gold-500 transition-colors bg-black/50 object-cover" 
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div 
                                                className="font-bold text-white text-sm hover:text-gold-400 cursor-pointer transition-colors w-fit"
                                                onClick={(e) => handleAuthorClick(reading.userId, e)}
                                            >
                                                {reading.authorName || 'Ismeretlen Látnok'}
                                            </div>
                                            <h3 className="font-serif text-lg md:text-xl text-white/90 italic leading-snug mt-1 break-words">
                                                "{reading.question || 'Csendes meditáció...'}"
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Insights Bar */}
                                    <div className="flex flex-wrap gap-4 items-center bg-black/30 p-3 rounded-xl border border-white/5 mb-4 text-xs text-gray-300">
                                        <div className="flex items-center gap-2" title="Hangulat">
                                            <span className="text-lg">{stats.moodIcon}</span>
                                            <span>{stats.moodLabel}</span>
                                        </div>
                                        <div className="w-px h-4 bg-white/10"></div>
                                        <div className="flex items-center gap-2" title="Domináns Elem">
                                            <span className={`w-2 h-2 rounded-full ${stats.domElement === 'Tűz' ? 'bg-red-500' : stats.domElement === 'Víz' ? 'bg-blue-500' : stats.domElement === 'Levegő' ? 'bg-yellow-200' : 'bg-green-500'}`}></span>
                                            <span>{stats.domElement} Dominancia</span>
                                        </div>
                                        <div className="w-px h-4 bg-white/10"></div>
                                        <div title="Nagy Árkánum Arány">
                                            <span className="text-purple-300 font-bold">{stats.majorRatio}%</span> Sorsszerű
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    {reading.tags && reading.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {reading.tags.map(t => (
                                                <span key={t} className="text-[9px] px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded uppercase font-bold tracking-wider">
                                                    #{t}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Mini Preview / Action Bar */}
                                    <div className="flex items-center justify-between border-t border-white/5 pt-4">
                                        <div className="flex-1 text-xs text-white/40 truncate pr-4">
                                            <span className="font-bold text-white/60">Lapok:</span> {stats.topCards}...
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setExpandedCommentsId(isCommentsOpen ? null : reading.id); }}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all border ${isCommentsOpen ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                                            >
                                                <span>💬</span>
                                                <span className="text-xs font-bold text-white">{commentCount}</span>
                                            </button>

                                            <button 
                                                onClick={(e) => handleLike(reading.id, e)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all border group/like ${isLiked ? 'bg-gold-500/20 border-gold-500 text-gold-400' : 'bg-white/5 border-white/5 hover:border-gold-500/30 hover:text-gold-400 text-white'}`}
                                            >
                                                <MysticSparkIcon 
                                                    filled={!!isLiked} 
                                                    className={`w-4 h-4 transition-transform duration-300 ${isAnimating ? 'scale-[1.8]' : 'group-hover/like:scale-125'}`} 
                                                />
                                                <span className="text-xs font-bold">{reading.likes || 0}</span>
                                            </button>
                                            
                                            <div className="text-xs font-bold text-white/30 ml-2">
                                                {isExpanded ? '▲' : '▼'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Visuals */}
                                {isExpanded && (
                                    <div className="border-t border-white/10 bg-black/30 animate-fade-in p-4">
                                        <VisualReadingLayout reading={reading} />
                                    </div>
                                )}

                                {/* Comment Section */}
                                {isCommentsOpen && (
                                    <div className="bg-black/50 border-t border-white/10 p-4 animate-fade-in relative">
                                        <h4 className="text-xs font-bold uppercase text-white/50 mb-4 tracking-widest">Hozzászólások</h4>
                                        
                                        {/* Comment List */}
                                        <div className="space-y-4 mb-6 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                            {(reading.comments || []).length === 0 ? (
                                                <div className="text-center text-xs text-white/30 italic">Még nincsenek hozzászólások. Légy te az első!</div>
                                            ) : (
                                                (reading.comments || []).map(comment => {
                                                    const isOwner = currentUser?.id === comment.userId;
                                                    const canEdit = isOwner || currentUser?.isAdmin;

                                                    return (
                                                        <div key={comment.id} className="flex gap-3 group/comment">
                                                            <img src={comment.userAvatar || getAvatarUrl({} as any)} className="w-8 h-8 rounded-full bg-white/5 border border-white/10" />
                                                            <div className="flex-1">
                                                                <div className="bg-white/5 p-3 rounded-xl rounded-tl-none border border-white/5">
                                                                    <div className="flex justify-between items-start mb-1">
                                                                        <span className="text-xs font-bold text-gold-400">{comment.userName}</span>
                                                                        <span className="text-[9px] text-white/30">{new Date(comment.date).toLocaleDateString()}</span>
                                                                    </div>
                                                                    
                                                                    {editingCommentId === comment.id ? (
                                                                        <div className="flex flex-col gap-2">
                                                                            <VisualMentionInput 
                                                                                value={editingText}
                                                                                onChange={setEditingText}
                                                                                onSearch={handleMentionSearch}
                                                                                placeholder="Módosítsd a hozzászólást..."
                                                                                className="min-h-[60px]"
                                                                            />
                                                                            <div className="flex gap-2 justify-end">
                                                                                <button onClick={() => setEditingCommentId(null)} className="text-[10px] text-white/50 hover:text-white">Mégse</button>
                                                                                <button onClick={() => handleUpdateComment(reading.id)} className="text-[10px] bg-gold-500 text-black px-2 py-0.5 rounded font-bold">Frissítés</button>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                                                            {renderWithMentions(comment.text)} 
                                                                            {comment.isEdited && <span className="text-[9px] opacity-50 italic"> (szerkesztve)</span>}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                
                                                                <div className="flex gap-3 mt-1 ml-2 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                                                                    <button onClick={() => handleReply(comment)} className="text-[10px] text-indigo-300 hover:text-indigo-200 font-bold">Válasz</button>
                                                                    {isOwner && !editingCommentId && (
                                                                        <button onClick={() => startEditingComment(comment)} className="text-[10px] text-white/40 hover:text-white font-bold">Szerkesztés</button>
                                                                    )}
                                                                    {canEdit && !editingCommentId && (
                                                                        <button onClick={() => handleDeleteComment(reading.id, comment)} className="text-[10px] text-red-400/50 hover:text-red-400 font-bold">Törlés {currentUser?.isAdmin && !isOwner ? '(Admin)' : ''}</button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>

                                        {/* Add Comment Input */}
                                        <div className="flex gap-3 items-start relative">
                                            <img src={getAvatarUrl(currentUser!)} className="w-8 h-8 rounded-full border border-white/20" />
                                            <div className="flex-1 relative">
                                                {/* Autocomplete Dropdown */}
                                                {showMentionList && mentionableUsers.length > 0 && (
                                                    <div className="absolute bottom-full left-0 mb-2 w-64 glass-panel-dark border border-gold-500/30 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto custom-scrollbar overflow-hidden">
                                                        <div className="p-2 border-b border-white/10 bg-white/5 text-[10px] font-bold uppercase text-gold-400 tracking-widest">Látnokok keresése...</div>
                                                        {mentionableUsers.map(u => (
                                                            <button 
                                                                key={u.id}
                                                                onClick={() => insertMention(u, editingCommentId !== null)}
                                                                className="w-full flex items-center gap-3 p-3 hover:bg-gold-500/20 transition-colors text-left border-b border-white/5 last:border-0"
                                                            >
                                                                <img src={u.avatar || getAvatarUrl({} as any)} className="w-6 h-6 rounded-full border border-white/10" />
                                                                <span className="text-sm font-bold text-white">{u.name}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                <VisualMentionInput 
                                                    id="comment-input"
                                                    value={editingCommentId ? editingText : newCommentText}
                                                    onChange={editingCommentId ? setEditingText : setNewCommentText}
                                                    onSearch={handleMentionSearch}
                                                    placeholder="Írj egy hozzászólást... (Használd a @ jelet a megjelöléshez)"
                                                />
                                                
                                                {!editingCommentId && (
                                                    <button 
                                                        onClick={() => handleAddComment(reading.id)}
                                                        disabled={!newCommentText.trim()}
                                                        className="absolute bottom-2 right-2 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg transition-transform hover:scale-105"
                                                    >
                                                        Küldés
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
