
import React, { useState, useMemo } from 'react';
import { useTarot } from '../context/TarotContext';
import { SHOP_ITEMS, ShopItem } from '../constants/shopItems';
import { t } from '../services/i18nService';

export const MarketplaceView = ({ onBack }: { onBack: () => void }) => {
    const { currentUser, language, updateUser, showToast } = useTarot();
    const [filter, setFilter] = useState<'all' | 'deck' | 'background' | 'cover'>('all');
    const [buyingId, setBuyingId] = useState<string | null>(null);

    const inventory = currentUser?.inventory || [];
    const balance = currentUser?.currency ?? currentUser?.xp ?? 0;

    const filteredItems = useMemo(() => {
        return SHOP_ITEMS.filter(item => filter === 'all' || item.type === filter);
    }, [filter]);

    const handleBuy = async (item: ShopItem) => {
        if (!currentUser) return;
        if (inventory.includes(item.id)) return;
        if (balance < item.cost) {
            showToast("Nincs elég pontod!", "error");
            return;
        }

        if (!confirm(`Megveszed ezt: ${item.name} (${item.cost} pont)?`)) return;

        setBuyingId(item.id);
        try {
            const newInventory = [...inventory, item.id];
            const newBalance = balance - item.cost;

            await updateUser({
                ...currentUser,
                currency: newBalance,
                inventory: newInventory
            });

            showToast("Sikeres vásárlás!", "success");
        } catch (e) {
            console.error(e);
            showToast("Hiba a vásárláskor.", "error");
        } finally {
            setBuyingId(null);
        }
    };

    const ItemCard = ({ item }: { item: ShopItem }) => {
        const owned = inventory.includes(item.id) || item.cost === 0;
        const canAfford = balance >= item.cost;

        return (
            <div className={`glass-panel rounded-xl overflow-hidden border transition-all duration-300 group hover:scale-[1.02] ${owned ? 'border-green-500/30' : 'border-white/10 hover:border-gold-500'}`}>
                {/* Preview Area */}
                <div className="h-32 bg-black/40 relative overflow-hidden flex items-center justify-center">
                    {item.previewUrl?.startsWith('url') || item.previewUrl?.startsWith('linear') ? (
                        <div className="w-full h-full" style={{ background: item.previewUrl }}></div>
                    ) : item.previewUrl ? (
                         <img src={item.previewUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-4xl opacity-20">
                            {item.type === 'deck' ? '🎴' : item.type === 'background' ? '🖼️' : '🎨'}
                        </div>
                    )}

                    {item.isPremium && (
                        <div className="absolute top-2 right-2 bg-gold-500 text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-lg">
                            Premium
                        </div>
                    )}
                </div>

                <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="text-[10px] uppercase font-bold text-white/40 tracking-wider mb-1">{item.type}</div>
                            <h3 className="font-bold text-white leading-tight">{item.name}</h3>
                        </div>
                    </div>
                    <p className="text-xs text-white/60 mb-4 h-8 line-clamp-2">{item.description}</p>

                    <div className="flex justify-between items-center mt-auto">
                        <div className="font-mono text-gold-400 font-bold">
                            {item.cost === 0 ? 'INGYENES' : `${item.cost} pont`}
                        </div>

                        {owned ? (
                            <div className="flex items-center gap-1 text-green-400 text-xs font-bold uppercase">
                                <span>✓</span> Megvan
                            </div>
                        ) : (
                            <button
                                onClick={() => handleBuy(item)}
                                disabled={!canAfford || buyingId !== null}
                                className={`px-4 py-1.5 rounded text-xs font-bold uppercase transition-all ${
                                    canAfford
                                    ? 'bg-gold-500 hover:bg-gold-400 text-black shadow-lg hover:shadow-gold-500/20'
                                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                                }`}
                            >
                                {buyingId === item.id ? '...' : 'Megveszem'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (!currentUser) return null;

    return (
        <div className="animate-fade-in max-w-6xl mx-auto pb-20">
             {/* Header */}
             <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 bg-gradient-to-r from-[#1e1e2e] to-transparent p-6 rounded-2xl border border-white/5">
                <div>
                    <h2 className="text-3xl font-serif font-bold text-white mb-2 flex items-center gap-3">
                        <span>🏷️</span> Misztikus Piactér
                    </h2>
                    <p className="text-white/50 text-sm">Váltsd be a kihívásokért kapott pontjaidat különleges tartalmakra.</p>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-gold-400 tracking-widest">Egyenleg</div>
                        <div className="text-3xl font-mono font-bold text-white text-shadow-glow">{balance} <span className="text-sm align-top opacity-50">XP/Pont</span></div>
                    </div>
                    <button onClick={onBack} className="bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors">
                        ✕
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-4 custom-scrollbar">
                {[
                    { id: 'all', label: 'Minden' },
                    { id: 'deck', label: 'Paklik' },
                    { id: 'background', label: 'Hátterek' },
                    { id: 'cover', label: 'Hátlapok' },
                ].map(f => (
                    <button
                        key={f.id}
                        onClick={() => setFilter(f.id as any)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border ${
                            filter === f.id
                            ? 'bg-gold-500 border-gold-500 text-black'
                            : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/30'
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredItems.map(item => (
                    <ItemCard key={item.id} item={item} />
                ))}
            </div>

            {filteredItems.length === 0 && (
                <div className="text-center py-20 opacity-30">
                    <div className="text-6xl mb-4">🔍</div>
                    <p>Nincs találat ebben a kategóriában.</p>
                </div>
            )}
        </div>
    );
};
