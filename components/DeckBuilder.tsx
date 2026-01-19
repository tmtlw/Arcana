
import React, { useState } from 'react';
import { useTarot } from '../context/TarotContext';
import { DeckMeta } from '../types';
import { FULL_DECK } from '../constants/deckConstants';
import { DeckService } from '../services/deckService';
import { DeckImportWizard } from './DeckImportWizard';
import { CommunityService } from '../services/communityService'; // For publishing logic later if integrated, but DeckService handles publish

export const DeckBuilder = ({ onBack }: { onBack: () => void }) => {
    const { availableDecks, showToast, currentUser } = useTarot();
    const [mode, setMode] = useState<'build' | 'import'>('build');
    const [deckName, setDeckName] = useState("");
    const [authorName, setAuthorName] = useState("");
    const [price, setPrice] = useState<number>(0); // Added Price
    const [customImages, setCustomImages] = useState<Record<string, string>>({});
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    if (mode === 'import') {
        return <DeckImportWizard onBack={() => setMode('build')} />;
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && selectedCardId) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    setCustomImages(prev => ({
                        ...prev,
                        [selectedCardId]: ev.target!.result as string
                    }));
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSave = async (publish: boolean = false) => {
        if (!deckName) return alert("Adj nevet a paklinak!");
        setIsSaving(true);
        
        const deckId = `custom_${Date.now()}`;
        const newDeck: DeckMeta = {
            id: deckId,
            name: deckName,
            author: authorName || 'Én',
            description: 'Saját készítésű pakli',
            basePath: 'indexeddb',
            extension: 'base64',
            isCustomLocal: true,
            price: price // Store price locally even if not used yet
        };

        try {
            // 1. Save locally/personal cloud
            await DeckService.saveCustomDeck(newDeck, customImages, currentUser?.id);

            // 2. If publishing requested
            if (publish && currentUser) {
                if(Object.keys(customImages).length < 78) {
                    if(!confirm("A pakli hiányos (nincs 78 kártya). Biztosan közzéteszed?")) {
                        setIsSaving(false);
                        return;
                    }
                }

                // Using the just-created deck meta but ensuring ID allows publishing logic if needed.
                // Usually we publish an existing deck.
                // But here we do it in one flow or ask to publish separately?
                // The UI is "Save".
                // Let's keep it simple: Save = Personal. Publish is a separate action in most UIs,
                // but user wants to "Create for Marketplace".
                // I'll add a separate "Mentés és Közzététel" button.
            }

            showToast("Pakli sikeresen mentve!", "success");
            setTimeout(() => window.location.reload(), 1000); 
        } catch (e) {
            alert("Hiba a mentéskor: " + e);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePublish = async () => {
         if (!deckName) return alert("Adj nevet a paklinak!");
         if (!currentUser) return alert("Jelentkezz be a közzétételhez!");

         setIsSaving(true);
         const deckId = `custom_${Date.now()}`;
         const newDeck: DeckMeta = {
            id: deckId,
            name: deckName,
            author: authorName || currentUser.displayName || 'Névtelen',
            description: 'Saját készítésű pakli',
            basePath: 'indexeddb',
            extension: 'base64',
            isCustomLocal: true,
            price: price
        };

        try {
            // First save local copy
            await DeckService.saveCustomDeck(newDeck, customImages, currentUser.id);
            // Then publish
            await DeckService.publishDeck(newDeck, currentUser.id, price);
            showToast("Pakli sikeresen közzétéve a Piactéren!", "success");
             setTimeout(() => window.location.reload(), 1000);
        } catch (e) {
            showToast("Hiba: " + e, "error");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="animate-fade-in pb-20">
            <div className="flex justify-between items-center mb-6">
                <button onClick={onBack} className="flex items-center gap-2 font-bold text-white/60 hover:text-gold-400">&larr; Vissza</button>
                <button onClick={() => setMode('import')} className="bg-white/10 px-4 py-2 rounded-lg text-xs font-bold hover:bg-white/20">
                    📂 Importálás CSV-ből
                </button>
            </div>
            
            <div className="glass-panel p-4 md:p-8 rounded-3xl mb-8">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-2">
                    <h2 className="text-2xl md:text-3xl font-serif font-bold text-gold-400">Pakli Műhely</h2>
                    <div className="text-xs bg-white/10 px-3 py-1 rounded text-white/50">Helyi mentés + Közzététel</div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div>
                        <label className="block text-xs font-bold uppercase text-white/50 mb-2">Pakli Neve</label>
                        <input value={deckName} onChange={e => setDeckName(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-gold-500 outline-none" placeholder="Pl. Égi Fény Tarot" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-white/50 mb-2">Alkotó</label>
                        <input value={authorName} onChange={e => setAuthorName(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-gold-500 outline-none" placeholder="A Te neved" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-gold-400 mb-2">Ár (Pont)</label>
                        <input
                            type="number"
                            min="0"
                            value={price}
                            onChange={e => setPrice(parseInt(e.target.value) || 0)}
                            className="w-full bg-black/30 border border-gold-500/50 rounded-xl p-3 text-white focus:border-gold-500 outline-none font-mono"
                        />
                        <div className="text-[10px] text-white/30 mt-1">0 = Ingyenes.</div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 h-auto md:h-[600px]">
                    {/* List */}
                    <div className="w-full md:w-1/3 overflow-y-auto custom-scrollbar bg-white/5 rounded-xl p-2 h-[200px] md:h-full">
                        {FULL_DECK.map(c => (
                            <div 
                                key={c.id} 
                                onClick={() => setSelectedCardId(c.id)}
                                className={`p-3 rounded-lg cursor-pointer mb-2 flex items-center gap-2 text-sm transition-colors ${selectedCardId === c.id ? 'bg-gold-500 text-black font-bold' : 'hover:bg-white/10 text-gray-300'}`}
                            >
                                <span className="w-2 h-2 rounded-full" style={{background: customImages[c.id] ? '#4ade80' : '#333'}}></span>
                                {c.name}
                            </div>
                        ))}
                    </div>

                    {/* Editor */}
                    <div className="flex-1 bg-black/40 rounded-xl p-8 flex flex-col items-center justify-center border-2 border-dashed border-white/10 relative min-h-[400px]">
                        {selectedCardId ? (
                            <>
                                <h3 className="text-xl font-serif font-bold mb-4">{FULL_DECK.find(c => c.id === selectedCardId)?.name}</h3>
                                
                                <div className="w-64 h-96 bg-gray-900 rounded-xl overflow-hidden mb-6 relative shadow-2xl group">
                                    {customImages[selectedCardId] ? (
                                        <img src={customImages[selectedCardId]} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/20 text-4xl">?</div>
                                    )}
                                    
                                    <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <span className="text-3xl mb-2">📷</span>
                                        <span className="text-xs font-bold uppercase">Kép Feltöltése</span>
                                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                    </label>
                                </div>
                            </>
                        ) : (
                            <div className="text-white/30 text-center">
                                <div className="text-4xl mb-4">👈</div>
                                Válassz egy kártyát a szerkesztéshez
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8 flex flex-col md:flex-row justify-end gap-4">
                    <button 
                        onClick={() => handleSave(false)}
                        disabled={isSaving}
                        className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                    >
                        {isSaving ? '...' : 'Mentés (Privát)'}
                    </button>

                    <button
                        onClick={handlePublish}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-gold-600 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-black px-8 py-3 rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 flex items-center gap-2"
                    >
                        <span>📢</span> {isSaving ? 'Közzététel...' : 'Mentés és Közzététel a Piactéren'}
                    </button>
                </div>
            </div>
        </div>
    );
};
