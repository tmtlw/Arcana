
import React, { useEffect, useState } from 'react';
import { DeckService } from '../services/deckService';
import { CommunityService } from '../services/communityService';
import { DeckMeta, Comment } from '../types';
import { useTarot } from '../context/TarotContext';
import { RatingSystem } from './RatingSystem';
import { CommentSection } from './CommentSection';

export const CommunityDecksView = ({ onBack }: { onBack: () => void }) => {
    const { showToast, currentUser, toggleDeckInCollection } = useTarot();
    const [decks, setDecks] = useState<DeckMeta[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedDeckId, setExpandedDeckId] = useState<string | null>(null);
    const [ratings, setRatings] = useState<Record<string, { avg: number, count: number, userVote?: number }>>({});

    const collectedIds = currentUser?.deckCollection || [];

    useEffect(() => {
        loadDecks();
    }, []);

    const loadDecks = async () => {
        setLoading(true);
        const data = await DeckService.getPublicDecks();
        setDecks(data);

        // Load aggregate ratings
        const ratingMap: Record<string, { avg: number, count: number, userVote?: number }> = {};
        for (const d of data) {
            const r = await CommunityService.getItemRatings('public_decks', d.id, currentUser?.id);
            ratingMap[d.id] = r;
        }
        setRatings(ratingMap);

        setLoading(false);
    };

    const handleToggleCollection = async (deck: DeckMeta) => {
        await toggleDeckInCollection(deck.id);
        // Optimistic update handled by context usually, but here we might want to refresh to ensure sync?
        // Context updates 'currentUser', so 'collectedIds' should update if we depend on it properly.
    };

    const handleAdminDelete = async (id: string) => {
        if(!confirm("ADMIN: Biztosan törlöd ezt a paklit? Ez minden felhasználó gyűjteményéből el fog tűnni!")) return;
        try {
            await DeckService.deletePublicDeck(id);
            setDecks(prev => prev.filter(d => d.id !== id));
            showToast("Pakli törölve a központi adatbázisból!", "success");
        } catch (e) {
            showToast("Hiba a törléskor (Jogosultság?)", "info");
        }
    };

    const handleVote = async (deckId: string, value: number) => {
        if (!currentUser) {
            showToast("Jelentkezz be a szavazáshoz!", "info");
            return false;
        }
        const success = await CommunityService.rateItem('public_decks', deckId, currentUser.id, value);
        if (success) {
            setRatings(prev => {
                const current = prev[deckId] || { avg: 0, count: 0, userVote: undefined };
                const newTotal = (current.avg * current.count) + value;
                const newCount = current.count + 1;
                return {
                    ...prev,
                    [deckId]: {
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

    const handleAddComment = async (deckId: string, text: string) => {
        if (!currentUser) return false;
        const newComment: Comment = {
            id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            userId: currentUser.id,
            userName: currentUser.name || "Névtelen",
            text: text,
            date: new Date().toISOString(),
            userAvatar: currentUser.avatarId
        };

        const success = await CommunityService.addItemComment('public_decks', deckId, newComment);
        if (success) {
            setDecks(prev => prev.map(d => {
                if (d.id === deckId) {
                    const dAny = d as any;
                    return { ...d, comments: [...(dAny.comments || []), newComment] };
                }
                return d;
            }));
            return true;
        }
        return false;
    };

    const handleDeleteComment = async (deckId: string, comment: Comment) => {
        if (!currentUser) return false;
        const success = await CommunityService.deleteItemComment('public_decks', deckId, comment);
        if (success) {
            setDecks(prev => prev.map(d => {
                if (d.id === deckId) {
                    const dAny = d as any;
                    return { ...d, comments: (dAny.comments || []).filter((c: Comment) => c.id !== comment.id) };
                }
                return d;
            }));
            return true;
        }
        return false;
    };

    const handleExpand = (deckId: string) => {
        setExpandedDeckId(expandedDeckId === deckId ? null : deckId);
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto pb-20">
            <div className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="flex items-center gap-2 font-bold text-white/60 hover:text-gold-400">&larr; Vissza</button>
                {currentUser?.isAdmin && <span className="bg-red-500/20 text-red-200 px-3 py-1 rounded-full text-xs font-bold border border-red-500/50">ADMIN MÓD</span>}
            </div>
            
            <div className="text-center mb-10">
                <h2 className="text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-white to-gold-400">
                    Pakli Piactér
                </h2>
                <p className="text-white/60 mt-2">Fedezd fel más látnokok alkotásait.</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin text-4xl">🎨</div></div>
            ) : decks.length === 0 ? (
                <div className="text-center py-20 opacity-50">Még nincsenek feltöltött paklik.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {decks.map(deck => {
                        const isCollected = collectedIds.includes(deck.id);
                        const r = ratings[deck.id] || { avg: 0, count: 0 };
                        const isExpanded = expandedDeckId === deck.id;
                        const dComments = (deck as any).comments || [];

                        return (
                            <div key={deck.id} className={`glass-panel p-6 rounded-2xl flex flex-col transition-colors border ${isCollected ? 'border-gold-500/50 bg-gold-500/5' : 'border-white/10 hover:bg-white/5'} relative`}>
                                {currentUser?.isAdmin && (
                                    <button 
                                        onClick={() => handleAdminDelete(deck.id)}
                                        className="absolute top-4 right-4 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500 p-2 rounded-lg transition-colors z-10"
                                        title="Admin Törlés"
                                    >
                                        🗑️
                                    </button>
                                )}

                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{deck.name}</h3>
                                        <p className="text-sm text-gold-400">Készítette: {deck.author || 'Ismeretlen'}</p>
                                    </div>
                                    <div className="text-xs bg-white/10 px-2 py-1 rounded">
                                        ⬇️ {deck.downloads || 0}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <RatingSystem
                                        id={deck.id}
                                        initialRating={r.avg}
                                        voteCount={r.count}
                                        userVote={r.userVote}
                                        onVote={(val) => handleVote(deck.id, val)}
                                    />
                                </div>

                                <p className="text-sm text-gray-400 mb-6 flex-1">{deck.description}</p>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleToggleCollection(deck)}
                                        className={`flex-1 py-3 rounded-xl font-bold text-sm shadow-lg transition-all ${isCollected ? 'bg-red-500/20 text-red-200 border border-red-500/30' : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:scale-105'}`}
                                    >
                                        {isCollected ? 'Eltávolítás' : 'Hozzáadás'}
                                    </button>
                                    <button
                                        onClick={() => handleExpand(deck.id)}
                                        className={`px-4 py-2 rounded-xl font-bold text-sm border transition-all ${isExpanded ? 'bg-white/20 text-white border-white/40' : 'bg-black/30 text-gray-400 border-white/10 hover:text-white'}`}
                                    >
                                        💬 {dComments.length}
                                    </button>
                                </div>

                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t border-white/10 animate-fade-in">
                                        <CommentSection
                                            itemId={deck.id}
                                            comments={dComments}
                                            currentUser={currentUser}
                                            onAddComment={(txt) => handleAddComment(deck.id, txt)}
                                            onDeleteComment={(c) => handleDeleteComment(deck.id, c)}
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
