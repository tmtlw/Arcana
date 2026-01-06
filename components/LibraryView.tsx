
import React, { useState } from 'react';
import { Card } from '../types';
import { useTarot } from '../context/TarotContext';
import { CardImage } from './CardImage';

type FilterType = 'All' | 'Major' | 'Botok' | 'Kelyhek' | 'Kardok' | 'Érmék' | 'Favorites';

export const LibraryView = ({ deck, theme, onSelectCard }: any) => {
    const { currentUser, toggleFavoriteCard } = useTarot();
    const [filter, setFilter] = useState<FilterType>('All');
    const [search, setSearch] = useState("");

    const filtered = deck.filter((c: Card) => {
        // 1. Search Logic (Name OR Keywords)
        if (search) {
            const term = search.toLowerCase();
            const matchesName = c.name.toLowerCase().includes(term);
            // Check if ANY keyword matches the search term
            const matchesKeyword = c.keywords.some(k => k.toLowerCase().includes(term));
            
            if (!matchesName && !matchesKeyword) return false;
        }
        
        // 2. Category Filter Logic
        if (filter === 'All') return true;
        if (filter === 'Favorites') return (currentUser?.favoriteCards || []).includes(c.id);
        if (filter === 'Major') return c.arcana === 'Major';
        // Filter by specific suit
        return c.suit === filter;
    });

    const filters: {id: FilterType, label: string}[] = [
        { id: 'All', label: 'Mind' },
        { id: 'Favorites', label: '★ Kedvencek' },
        { id: 'Major', label: 'Nagy Árkánum' },
        { id: 'Botok', label: 'Botok' },
        { id: 'Kelyhek', label: 'Kelyhek' },
        { id: 'Kardok', label: 'Kardok' },
        { id: 'Érmék', label: 'Érmék' }
    ];

    const handleToggleFav = (e: React.MouseEvent, cardId: string) => {
        e.stopPropagation();
        toggleFavoriteCard(cardId);
    };

    return (
        <div className="animate-fade-in pb-20">
            <h2 className="text-4xl font-serif font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-white to-gold-400">
                Arkánum Galéria
            </h2>
            
            <div className="glass-panel p-4 rounded-2xl mb-8 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-24 z-30 shadow-xl border border-white/10">
                <input 
                    type="text" 
                    placeholder="Keresés név vagy kulcsszó alapján..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="p-2 bg-transparent border-b border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-gold-500 w-full md:w-64 transition-colors"
                />
                
                {/* Scrollable Filter Buttons */}
                <div className="flex gap-2 p-1 bg-black/30 rounded-full overflow-x-auto max-w-full custom-scrollbar pb-2 md:pb-1">
                    {filters.map(f => (
                        <button 
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap flex-shrink-0 ${filter === f.id ? 'bg-white text-black shadow-lg transform scale-105' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filtered.map((card: Card) => {
                    const isFav = (currentUser?.favoriteCards || []).includes(card.id);
                    return (
                        <div 
                            key={card.id} 
                            onClick={() => onSelectCard(card)}
                            className={`group relative aspect-[2/3] rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all duration-500`}
                        >
                            <CardImage 
                                cardId={card.id} 
                                alt={card.name} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                            
                            <button 
                                onClick={(e) => handleToggleFav(e, card.id)}
                                className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center z-20 transition-all ${isFav ? 'bg-gold-500 text-black' : 'bg-black/40 text-white/30 hover:bg-white/20 hover:text-white'}`}
                            >
                                ★
                            </button>

                            <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                <h3 className="font-serif font-bold text-lg text-white group-hover:text-gold-400 transition-colors drop-shadow-md">{card.name}</h3>
                                <div className="h-0 group-hover:h-auto overflow-hidden transition-all duration-500">
                                    <p className="text-[10px] text-gray-300 mt-1 opacity-0 group-hover:opacity-100 uppercase tracking-widest">
                                        {card.keywords[0]}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {filtered.length === 0 && (
                <div className="text-center py-20 text-white/40 italic font-serif">
                    Nincs találat a kiválasztott szűrésre.
                </div>
            )}
        </div>
    );
};
