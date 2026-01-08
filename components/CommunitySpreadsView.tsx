
import React, { useEffect, useState } from 'react';
import { CommunityService } from '../services/communityService';
import { Spread, Comment } from '../types';
import { useTarot } from '../context/TarotContext';
import { RatingSystem } from './RatingSystem';
import { CommentSection } from './CommentSection';

export const CommunitySpreadsView = ({ onBack }: { onBack: () => void }) => {
    const { addCustomSpread, showToast, customSpreads, currentUser } = useTarot();
    const [spreads, setSpreads] = useState<Spread[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedSpreadId, setExpandedSpreadId] = useState<string | null>(null);
    const [ratings, setRatings] = useState<Record<string, { avg: number, count: number, userVote?: number }>>({});
    const [comments, setComments] = useState<Record<string, Comment[]>>({});

    useEffect(() => {
        loadSpreads();
    }, []);

    const loadSpreads = async () => {
        setLoading(true);
        const data = await CommunityService.getPublicSpreads();
        // Sort by downloads descending by default
        data.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
        setSpreads(data);

        // Load aggregate ratings for all displayed items
        const ratingMap: Record<string, { avg: number, count: number, userVote?: number }> = {};
        for (const s of data) {
            const r = await CommunityService.getItemRatings('public_spreads', s.id, currentUser?.id);
            ratingMap[s.id] = r;
        }
        setRatings(ratingMap);

        setLoading(false);
    };

    const handleExpand = async (spreadId: string) => {
        if (expandedSpreadId === spreadId) {
            setExpandedSpreadId(null);
            return;
        }
        setExpandedSpreadId(spreadId);
        // Load comments if not already loaded (or refresh)
        // Note: In a real app we might paginate comments. Here we rely on the main doc's comment array or fetch if subcollection (but our implementation uses main doc array for now in 'communityService.ts' logic for Readings... wait.
        // Correction: I implemented `addItemComment` and `deleteItemComment` which modify `comments` array on the main doc.
        // However, `getPublicSpreads` fetches the documents. So `comments` are already in `spread` object IF they are stored there.
        // Let's check `types.ts`. `Spread` interface doesn't have `comments` array explicitly defined in the standard type, but Firestore stores it.
        // I should probably extend the type locally or cast it.
    };

    const handleDownload = async (spread: Spread) => {
        if (customSpreads.some(s => s.name === spread.name)) {
            if(!confirm(`Már van "${spread.name}" nevű kirakásod. Szeretnéd duplikálni?`)) return;
        }

        const newLocalSpread: Spread = {
            ...spread,
            id: `downloaded_${Date.now()}_${Math.floor(Math.random()*1000)}`,
            isCustom: true,
            isPublic: false
        };

        addCustomSpread(newLocalSpread);
        await CommunityService.downloadSpread(spread.id);
        
        setSpreads(prev => prev.map(s => s.id === spread.id ? { ...s, downloads: (s.downloads || 0) + 1 } : s));
        showToast(`"${spread.name}" hozzáadva a kirakásaidhoz!`, "success");
    };

    const handleAdminDelete = async (id: string) => {
        if(!confirm("ADMIN: Biztosan törlöd ezt a kirakást?")) return;
        try {
            await CommunityService.deletePublicSpread(id);
            setSpreads(prev => prev.filter(s => s.id !== id));
            showToast("Kirakás törölve!", "success");
        } catch (e) {
            showToast("Hiba a törléskor (Jogosultság?)", "info");
        }
    };

    const handleVote = async (spreadId: string, value: number) => {
        if (!currentUser) {
            showToast("Jelentkezz be a szavazáshoz!", "info");
            return false;
        }
        const success = await CommunityService.rateItem('public_spreads', spreadId, currentUser.id, value);
        if (success) {
            // Update local state
            setRatings(prev => {
                const current = prev[spreadId] || { avg: 0, count: 0, userVote: undefined };
                const newTotal = (current.avg * current.count) + value;
                const newCount = current.count + 1;
                return {
                    ...prev,
                    [spreadId]: {
                        avg: newTotal / newCount,
                        count: newCount,
                        userVote: value
                    }
                };
            });
            showToast("Szavazat rögzítve!", "success");
        }
        return success;
    };

    const handleAddComment = async (spreadId: string, text: string) => {
        if (!currentUser) return false;
        const newComment: Comment = {
            id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            userId: currentUser.id,
            userName: currentUser.name || "Névtelen",
            text: text,
            date: new Date().toISOString(),
            userAvatar: currentUser.avatarId // Simple avatar handling
        };

        const success = await CommunityService.addItemComment('public_spreads', spreadId, newComment);
        if (success) {
            // Update local state by finding the spread and adding the comment
            setSpreads(prev => prev.map(s => {
                if (s.id === spreadId) {
                    // Type assertion for extended property
                    const sAny = s as any;
                    return { ...s, comments: [...(sAny.comments || []), newComment] };
                }
                return s;
            }));
            return true;
        }
        return false;
    };

    const handleDeleteComment = async (spreadId: string, comment: Comment) => {
        if (!currentUser) return false;
        const success = await CommunityService.deleteItemComment('public_spreads', spreadId, comment);
        if (success) {
            setSpreads(prev => prev.map(s => {
                if (s.id === spreadId) {
                    const sAny = s as any;
                    return { ...s, comments: (sAny.comments || []).filter((c: Comment) => c.id !== comment.id) };
                }
                return s;
            }));
            return true;
        }
        return false;
    };

    const SpreadPreview = ({ spread }: { spread: Spread }) => {
        const isFreeform = !!spread.backgroundImage || spread.positions.some(p => p.x > 15 || p.y > 15);
        if (isFreeform) {
            return (
                <div className="w-full h-32 bg-black/40 rounded-xl relative mb-4 border border-white/5 overflow-hidden">
                    {spread.backgroundImage && (
                        <div className="absolute inset-0 bg-cover bg-center opacity-30 blur-[1px]" style={{ backgroundImage: `url(${spread.backgroundImage})` }}></div>
                    )}
                    {spread.positions.map(p => (
                        <div key={p.id} className="absolute bg-white/20 border border-white/40 rounded-sm"
                            style={{ width: '8%', height: '18%', left: `${p.x}%`, top: `${p.y}%`, transform: `translate(-50%, -50%) rotate(${p.rotation || 0}deg)` }} />
                    ))}
                    <div className="absolute bottom-2 right-2 text-[10px] text-white/30 font-mono bg-black/50 px-1 rounded">{spread.positions.length} Lap (Szabad)</div>
                </div>
            );
        }
        const maxX = Math.max(...spread.positions.map(p => p.x));
        const maxY = Math.max(...spread.positions.map(p => p.y));
        const scale = Math.min(100 / maxX, 120 / maxY);
        return (
            <div className="w-full h-32 bg-black/40 rounded-xl relative mb-4 border border-white/5 overflow-hidden flex items-center justify-center">
                <div className="relative" style={{ width: maxX * 20, height: maxY * 30, transform: `scale(${Math.min(1, scale / 25)})` }}>
                    {spread.positions.map(p => (
                        <div key={p.id} className="absolute bg-white/20 border border-white/40 rounded-sm"
                            style={{ width: 18, height: 28, left: (p.x - 1) * 22, top: (p.y - 1) * 32, transform: p.rotation ? 'rotate(90deg)' : 'none' }} />
                    ))}
                </div>
                <div className="absolute bottom-2 right-2 text-[10px] text-white/30 font-mono">{spread.positions.length} Lap</div>
            </div>
        );
    };

    return (
        <div className="animate-fade-in max-w-5xl mx-auto pb-20">
            <div className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="flex items-center gap-2 text-white/60 hover:text-white font-bold transition-colors">
                    &larr; Vissza
                </button>
                <div className="flex gap-2">
                    {currentUser?.isAdmin && <span className="bg-red-500/20 text-red-200 px-3 py-1 rounded-full text-xs font-bold border border-red-500/50">ADMIN MÓD</span>}
                    <button onClick={loadSpreads} className="text-xs bg-white/5 hover:bg-white/10 px-3 py-1 rounded-full border border-white/10 transition-colors">
                        Frissítés ↻
                    </button>
                </div>
            </div>

            <div className="text-center mb-10">
                <h2 className="text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-white to-purple-400">
                    Kirakások Piactere
                </h2>
                <p className="text-white/60 mt-2 text-sm">Találj új elrendezéseket a közösségtől.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin text-4xl">💠</div></div>
            ) : spreads.length === 0 ? (
                <div className="text-center py-20 opacity-50">Még nincsenek feltöltött kirakások.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {spreads.map(spread => {
                        const r = ratings[spread.id] || { avg: 0, count: 0 };
                        const isExpanded = expandedSpreadId === spread.id;
                        // Cast to any to access dynamic 'comments' field
                        const sComments = (spread as any).comments || [];

                        return (
                            <div key={spread.id} className="glass-panel p-5 rounded-2xl flex flex-col hover:bg-white/5 transition-colors border border-white/10 group relative">
                                <SpreadPreview spread={spread} />

                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-serif font-bold text-lg text-white truncate pr-2" title={spread.name}>{spread.name}</h3>
                                    <div className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded border border-purple-500/30 font-mono">
                                        ⬇ {spread.downloads || 0}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mb-2">
                                    <div className="text-xs text-gold-400 font-bold opacity-80">
                                        Szerző: {spread.author || 'Ismeretlen'}
                                    </div>
                                    <RatingSystem
                                        id={spread.id}
                                        initialRating={r.avg}
                                        voteCount={r.count}
                                        userVote={r.userVote}
                                        onVote={(val) => handleVote(spread.id, val)}
                                    />
                                </div>

                                <p className="text-xs text-gray-400 mb-6 flex-1 line-clamp-3 leading-relaxed">
                                    {spread.description || "Nincs leírás."}
                                </p>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleDownload(spread)}
                                        className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-white text-sm border border-white/20 transition-all flex items-center justify-center gap-2 group-hover:bg-gold-500 group-hover:text-black group-hover:border-gold-500"
                                    >
                                        <span>📥</span> Másolás
                                    </button>
                                    <button 
                                        onClick={() => handleExpand(spread.id)}
                                        className={`px-4 py-2 rounded-xl font-bold text-sm border transition-all ${isExpanded ? 'bg-white/20 text-white border-white/40' : 'bg-black/30 text-gray-400 border-white/10 hover:text-white'}`}
                                    >
                                        💬 {sComments.length}
                                    </button>
                                    {currentUser?.isAdmin && (
                                        <button
                                            onClick={() => handleAdminDelete(spread.id)}
                                            className="py-2 px-3 bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white rounded-xl font-bold transition-all border border-red-500/30"
                                            title="Admin Törlés"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>

                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-white/10 animate-fade-in">
                                        <CommentSection
                                            itemId={spread.id}
                                            comments={sComments}
                                            currentUser={currentUser}
                                            onAddComment={(txt) => handleAddComment(spread.id, txt)}
                                            onDeleteComment={(c) => handleDeleteComment(spread.id, c)}
                                        />
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
