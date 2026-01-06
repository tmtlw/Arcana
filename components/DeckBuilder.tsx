
import React, { useState } from 'react';
import { useTarot } from '../context/TarotContext';
import { DeckMeta } from '../types';
import { FULL_DECK } from '../constants';
import { DeckService } from '../services/deckService';
import { DeckImportWizard } from './DeckImportWizard';

export const DeckBuilder = ({ onBack }: { onBack: () => void }) => {
    const { availableDecks, showToast, currentUser } = useTarot(); // Added currentUser
    const [mode, setMode] = useState<'build' | 'import'>('build');
    const [deckName, setDeckName] = useState("");
    const [authorName, setAuthorName] = useState("");
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

    const handleSave = async () => {
        if (!deckName) return alert("Adj nevet a paklinak!");
        setIsSaving(true);
        
        const deckId = `custom_${Date.now()}`;
        const newDeck: DeckMeta = {
            id: deckId,
            name: deckName,
            author: authorName || 'Én',
            description: 'Saját készítésű pakli',
            basePath: 'indexeddb', // Marker for IDB
            extension: 'base64',
            isCustomLocal: true
        };

        try {
            // Pass currentUser.id to enable cloud sync
            await DeckService.saveCustomDeck(newDeck, customImages, currentUser?.id);
            showToast("Pakli sikeresen mentve az adatbázisba (Felhő + Helyi)!", "success");
            setTimeout(() => window.location.reload(), 1000); 
        } catch (e) {
            alert("Hiba a mentéskor: " + e);
        } finally {
            setIsSaving(false);
        }
    };

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
                    <div className="text-xs bg-white/10 px-3 py-1 rounded text-white/50">Helyi adatbázisba mentés</div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-xs font-bold uppercase text-white/50 mb-2">Pakli Neve</label>
                        <input value={deckName} onChange={e => setDeckName(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-gold-500 outline-none" placeholder="Pl. Égi Fény Tarot" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-white/50 mb-2">Alkotó</label>
                        <input value={authorName} onChange={e => setAuthorName(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-gold-500 outline-none" placeholder="A Te neved" />
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

                <div className="mt-8 flex justify-end gap-4">
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="w-full md:w-auto bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-all transform hover:scale-105 disabled:opacity-50"
                    >
                        {isSaving ? 'Mentés...' : 'Pakli Mentése'}
                    </button>
                </div>
                <div className="mt-4 text-center text-xs text-white/30">
                    Mentés után a "Beállítások" menüben választhatod ki az új paklit.
                </div>
            </div>
        </div>
    );
};
