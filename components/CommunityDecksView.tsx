
import React, { useEffect, useState } from 'react';
import { DeckService } from '../services/deckService';
import { DeckMeta } from '../types';
import { useTarot } from '../context/TarotContext';

export const CommunityDecksView = ({ onBack }: { onBack: () => void }) => {
    const { showToast, currentUser, toggleDeckInCollection } = useTarot();
    const [decks, setDecks] = useState<DeckMeta[]>([]);
    const [loading, setLoading] = useState(true);

    const collectedIds = currentUser?.deckCollection || [];

    useEffect(() => {
        loadDecks();
    }, []);

    const loadDecks = async () => {
        setLoading(true);
        const data = await DeckService.getPublicDecks();
        setDecks(data);
        setLoading(false);
    };

    const handleToggleCollection = async (deck: DeckMeta) => {
        await toggleDeckInCollection(deck.id);
        // Refresh local view if needed or handle via context
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

                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{deck.name}</h3>
                                        <p className="text-sm text-gold-400">Készítette: {deck.author || 'Ismeretlen'}</p>
                                    </div>
                                    <div className="text-xs bg-white/10 px-2 py-1 rounded">
                                        ⬇️ {deck.downloads || 0}
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400 mb-6 flex-1">{deck.description}</p>
                                <button 
                                    onClick={() => handleToggleCollection(deck)}
                                    className={`w-full py-3 rounded-xl font-bold text-sm shadow-lg transition-all ${isCollected ? 'bg-red-500/20 text-red-200 border border-red-500/30' : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:scale-105'}`}
                                >
                                    {isCollected ? 'Eltávolítás a Gyűjteményből' : 'Hozzáadás a Gyűjteményhez'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
