import React, { useState } from 'react';
import { GAME_ICONS, GAME_ICONS_CATEGORIES } from '../constants/gameIcons';

interface IconPickerProps {
    onSelect: (iconKey: string) => void;
    onClose: () => void;
}

export const IconPicker = ({ onSelect, onClose }: IconPickerProps) => {
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Filter logic:
    // If searching, show all matches across all icons.
    // If not searching but category selected, show only that category.
    // If neither, show all grouped by category (or just all flat list, let's do grouped or category list).

    // User requested "Jump to categories". A list of categories at the top is good.

    const renderIcons = () => {
        if (search) {
             const filtered = Object.entries(GAME_ICONS).filter(([key]) => key.includes(search.toLowerCase()));
             return (
                 <div className="grid grid-cols-5 gap-3 p-2">
                     {filtered.map(([key, path]) => renderIconBtn(key, path))}
                     {filtered.length === 0 && <div className="col-span-5 text-center text-white/30 text-xs py-4">Nincs találat.</div>}
                 </div>
             );
        }

        if (selectedCategory) {
            const keys = GAME_ICONS_CATEGORIES[selectedCategory] || [];
            return (
                <div className="grid grid-cols-5 gap-3 p-2">
                    {keys.map(key => renderIconBtn(key, GAME_ICONS[key]))}
                </div>
            );
        }

        // Default view: Show all, maybe grouped with headers? Or just all.
        // User asked to "jump to categories", so maybe just showing all with headers is nice?
        // Let's default to the first category or 'All'.
        // Let's show all categories with headers.
        return (
            <div className="flex flex-col gap-4 p-2">
                {Object.entries(GAME_ICONS_CATEGORIES).map(([catName, keys]) => (
                    <div key={catName}>
                        <h4 className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2 ml-1" id={`cat-${catName}`}>{catName}</h4>
                        <div className="grid grid-cols-5 gap-3">
                            {keys.map(key => renderIconBtn(key, GAME_ICONS[key]))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderIconBtn = (key: string, path: string) => (
        <button
            key={key}
            onClick={() => { onSelect(key); onClose(); }}
            className="aspect-square bg-white/5 hover:bg-gold-500/20 hover:border-gold-500 border border-white/5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all group"
            title={key}
        >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-gray-400 group-hover:text-gold-400">
                <path d={path} />
            </svg>
        </button>
    );

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-[#1e1e2e] w-full max-w-md rounded-2xl p-6 border border-white/10 shadow-2xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">Válassz Ikon-t</h3>
                    <button onClick={onClose} className="text-white/50 hover:text-white text-2xl">✕</button>
                </div>

                <input
                    autoFocus
                    placeholder="Keresés..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white mb-4 focus:border-gold-500 outline-none"
                />

                {/* Category Chips */}
                {!search && (
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-2 custom-scrollbar">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${selectedCategory === null ? 'bg-gold-500 text-black font-bold' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        >
                            Összes
                        </button>
                        {Object.keys(GAME_ICONS_CATEGORIES).map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${selectedCategory === cat ? 'bg-gold-500 text-black font-bold' : 'bg-white/10 text-white hover:bg-white/20'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {renderIcons()}
                </div>
            </div>
        </div>
    );
};
