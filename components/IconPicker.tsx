
import React, { useState } from 'react';
import { GAME_ICONS } from '../constants/gameIcons';

interface IconPickerProps {
    onSelect: (iconKey: string) => void;
    onClose: () => void;
}

export const IconPicker = ({ onSelect, onClose }: IconPickerProps) => {
    const [search, setSearch] = useState("");

    const filtered = Object.entries(GAME_ICONS).filter(([key]) => key.includes(search.toLowerCase()));

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

                <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-5 gap-3 p-2">
                    {filtered.map(([key, path]) => (
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
                    ))}
                    {filtered.length === 0 && <div className="col-span-5 text-center text-white/30 text-xs py-4">Nincs találat.</div>}
                </div>
            </div>
        </div>
    );
};
