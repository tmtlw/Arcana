
import React, { useState, useEffect } from 'react';
import { Card } from '../types';
import { useTarot } from '../context/TarotContext';
import { getCardImage } from '../constants';
import { MarkdownRenderer, MarkdownEditor } from './MarkdownSupport';
import { CardImage } from './CardImage';
import { CompareView } from './CompareView';
import { IconPicker } from './IconPicker';
import { GAME_ICONS } from '../constants/gameIcons';

export const CardDetailView = ({ card, theme, onBack }: { card: Card, theme: any, onBack: () => void }) => {
    const { activeDeck, updateCardData, resetCardData } = useTarot();
    const [isEditing, setIsEditing] = useState(false);
    const [isDeckCompareMode, setIsDeckCompareMode] = useState(false);
    const [editedCard, setEditedCard] = useState<Card>(card);

    // Symbolism Editor State
    const [showIconPicker, setShowIconPicker] = useState<number | null>(null); // Index of symbol being edited

    useEffect(() => {
        setEditedCard(card);
    }, [card]);

    if (!card) return null;

    if (isDeckCompareMode) {
        return <CompareView cardIdToCompare={card.id} onBack={() => setIsDeckCompareMode(false)} />;
    }

    const hasCounselingInfo = card.generalMeaning || card.loveMeaning || card.advice;

    const handleSave = () => {
        const changes: Partial<Card> = {};
        let hasChanges = false;

        (Object.keys(editedCard) as Array<keyof Card>).forEach(key => {
            if (JSON.stringify(editedCard[key]) !== JSON.stringify(card[key])) {
                // @ts-ignore
                changes[key] = editedCard[key];
                hasChanges = true;
            }
        });

        if (hasChanges) {
            updateCardData(card.id, changes);
        }
        setIsEditing(false);
    };

    const handleReset = () => {
        if(confirm("Biztosan visszaállítod az eredeti, gyári szövegeket erre a kártyára?")) {
            resetCardData(card.id);
            setIsEditing(false);
        }
    };

    const handleInputChange = (field: keyof Card, value: string) => {
        setEditedCard(prev => ({ ...prev, [field]: value }));
    };

    const handleComparisonChange = (field: string, value: string) => {
        setEditedCard(prev => ({
            ...prev,
            comparison: {
                ...(prev.comparison || { title: '', text: '', relatedCardId: '' }),
                [field]: value
            }
        }));
    };

    const handleKeywordsChange = (value: string) => {
        const keywords = value.split(',').map(k => k.trim()).filter(k => k);
        setEditedCard(prev => ({ ...prev, keywords }));
    };

    const handleQuestionChange = (index: number, value: string) => {
        const newQuestions = [...(editedCard.questions || [])];
        newQuestions[index] = value;
        setEditedCard(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleAddQuestion = () => {
        setEditedCard(prev => ({ ...prev, questions: [...(prev.questions || []), ""] }));
    };

    const handleRemoveQuestion = (index: number) => {
        const newQuestions = [...(editedCard.questions || [])];
        newQuestions.splice(index, 1);
        setEditedCard(prev => ({ ...prev, questions: newQuestions }));
    };

    const togglePrimaryContext = (ctx: 'general' | 'love' | 'career' | 'advice' | 'daily' | 'yearly') => {
        setEditedCard(prev => {
            const current = prev.primaryContexts || [];
            if (current.includes(ctx)) {
                return { ...prev, primaryContexts: current.filter(c => c !== ctx) };
            } else {
                return { ...prev, primaryContexts: [...current, ctx] };
            }
        });
    };

    const ContextToggle = ({ ctx, label }: { ctx: any, label: string }) => {
        const isSelected = (editedCard.primaryContexts || []).includes(ctx);
        return (
            <button 
                onClick={() => togglePrimaryContext(ctx)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all border ${isSelected ? 'bg-gold-500 text-black border-gold-500' : 'bg-transparent text-white/40 border-white/20 hover:border-white/50'}`}
            >
                {isSelected ? '★' : '☆'} {label} Kiemelése
            </button>
        );
    };

    return (
        <div className="animate-fade-in pb-20">
            <div className="flex justify-between items-center mb-6">
                <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold opacity-70 hover:opacity-100 transition-opacity">
                    <span>&larr;</span> Vissza a könyvtárhoz
                </button>
                <div className="flex gap-2">
                    {!isEditing ? (
                        <>
                            <button
                                onClick={() => setIsDeckCompareMode(true)}
                                className="bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 px-4 py-2 rounded-lg text-sm font-bold border border-indigo-500/30 transition-colors"
                            >
                                🃏 Paklik Összevetése
                            </button>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-bold border border-white/20 transition-colors"
                            >
                                ✏️ Szerkesztés
                            </button>
                        </>
                    ) : (
                        <>
                            <button 
                                onClick={handleReset} 
                                className="bg-red-500/20 hover:bg-red-500/40 text-red-200 px-4 py-2 rounded-lg text-sm font-bold border border-red-500/30 transition-colors"
                            >
                                ↺ Visszaállítás
                            </button>
                            <button 
                                onClick={() => setIsEditing(false)} 
                                className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-bold border border-white/20 transition-colors"
                            >
                                Mégse
                            </button>
                            <button 
                                onClick={handleSave} 
                                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold border border-green-400/50 shadow-lg transition-colors"
                            >
                                💾 Mentés
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className={`rounded-3xl shadow-2xl overflow-hidden ${theme.cardBg} flex flex-col lg:flex-row border border-white/10 relative`}>
                
                {isEditing && (
                    <div className="absolute top-0 left-0 right-0 bg-gold-500 text-black text-center text-xs font-bold py-1 z-50 uppercase tracking-widest">
                        Szerkesztő Mód - Jelöld ki a fontos jelentéseket a ★ gombokkal!
                    </div>
                )}

                {/* Image Section */}
                <div className="lg:w-2/5 relative min-h-[500px] bg-black">
                    <img 
                        src={getCardImage(card.id, activeDeck)} 
                        alt={card.name} 
                        className="absolute inset-0 w-full h-full object-cover opacity-90" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                    
                    <div className="absolute bottom-0 left-0 right-0 p-8">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-gold-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                {card.arcana === 'Major' ? 'Nagy Árkánum' : `Kis Árkánum • ${card.suit}`}
                            </span>
                            {card.number !== undefined && <span className="bg-white/20 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20">{card.number}</span>}
                        </div>
                        {isEditing ? (
                            <input 
                                value={editedCard.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className="text-4xl font-serif font-bold text-white mb-2 leading-tight bg-white/10 border-b border-white/30 w-full p-1 rounded focus:outline-none focus:border-gold-500"
                            />
                        ) : (
                            <h1 className="text-5xl font-serif font-bold text-white mb-2 leading-tight">{card.name}</h1>
                        )}
                        <p className="text-white/60 font-serif italic">{card.nameEn}</p>
                    </div>
                </div>

                {/* Info Section */}
                <div className="flex-1 p-8 lg:p-12 overflow-y-auto max-h-[80vh] custom-scrollbar">
                    
                    {/* Short Description Chip - Centered above Affirmation */}
                    <div className="flex justify-center mb-4">
                        {isEditing ? (
                            <div className="w-full max-w-xs">
                                <label className="block text-[10px] text-center uppercase font-bold text-indigo-400 mb-1 opacity-50">Rövid Jellemző</label>
                                <input 
                                    value={editedCard.shortDesc || ''}
                                    onChange={(e) => handleInputChange('shortDesc', e.target.value)}
                                    className="w-full text-center bg-indigo-500/10 border border-indigo-500/30 rounded-full py-1 text-[10px] font-bold text-indigo-300 uppercase tracking-widest outline-none focus:border-indigo-400"
                                    placeholder="Pl. A Kezdet"
                                />
                            </div>
                        ) : (
                            card.shortDesc && (
                                <span className="bg-indigo-500/20 text-indigo-300 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                                    {card.shortDesc}
                                </span>
                            )
                        )}
                    </div>

                    {/* Affirmation */}
                    <div className="mb-8 text-center relative py-6">
                        {isEditing ? (
                            <div className="w-full">
                                <label className="block text-xs font-bold uppercase text-gold-400 mb-1 opacity-50">Megerősítés (Affirmáció)</label>
                                <input 
                                    value={editedCard.affirmation || ''}
                                    onChange={(e) => handleInputChange('affirmation', e.target.value)}
                                    className="w-full text-center text-xl font-serif bg-white/5 border border-white/10 rounded p-2 text-white focus:border-gold-500 outline-none"
                                />
                            </div>
                        ) : (
                            card.affirmation && (
                                <>
                                    <span className="absolute top-0 left-1/2 -translate-x-1/2 text-4xl text-gold-500 opacity-30">❝</span>
                                    <p className="text-2xl md:text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-white to-gold-400 leading-snug relative z-10">
                                        {card.affirmation}
                                    </p>
                                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-4xl text-gold-500 opacity-30 rotate-180">❝</span>
                                </>
                            )
                        )}
                    </div>

                    {/* Keywords Section */}
                    <div className="mb-10 text-center">
                        {isEditing ? (
                            <div>
                                <label className="block text-xs font-bold uppercase text-gold-400 mb-1 opacity-50">Kulcsszavak (vesszővel elválasztva)</label>
                                <input 
                                    value={editedCard.keywords.join(', ')}
                                    onChange={(e) => handleKeywordsChange(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded p-2 text-white text-sm focus:border-gold-500 outline-none"
                                />
                            </div>
                        ) : (
                            card.keywords && card.keywords.length > 0 && (
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {card.keywords.map((keyword, index) => (
                                        <span key={index} className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold text-gold-400 uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-colors cursor-default">
                                            {keyword}
                                        </span>
                                    ))}
                                </div>
                            )
                        )}
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-4 gap-4 mb-10 border-y border-white/10 py-6 opacity-60">
                        <div className="text-center p-2">
                            <div className="text-[10px] uppercase text-gold-400 font-bold tracking-widest mb-1">Elem</div>
                            {isEditing ? (
                                <input value={editedCard.element || ''} onChange={e => handleInputChange('element', e.target.value)} className="w-full bg-transparent border-b text-center font-serif" />
                            ) : (
                                <div className="font-serif text-lg">{card.element || '-'}</div>
                            )}
                        </div>
                        <div className="text-center p-2 border-l border-white/5">
                            <div className="text-[10px] uppercase text-gold-400 font-bold tracking-widest mb-1">Asztrológia</div>
                            {isEditing ? (
                                <input value={editedCard.astrology || ''} onChange={e => handleInputChange('astrology', e.target.value)} className="w-full bg-transparent border-b text-center font-serif" />
                            ) : (
                                <div className="font-serif text-lg">{card.astrology || '-'}</div>
                            )}
                        </div>
                        <div className="text-center p-2 border-l border-white/5">
                            <div className="text-[10px] uppercase text-gold-400 font-bold tracking-widest mb-1">Numerológia</div>
                            {isEditing ? (
                                <input value={editedCard.numerology || ''} onChange={e => handleInputChange('numerology', e.target.value)} className="w-full bg-transparent border-b text-center font-serif" />
                            ) : (
                                <div className="font-serif text-lg">{card.numerology || '-'}</div>
                            )}
                        </div>
                        <div className="text-center p-2 border-l border-white/5">
                            <div className="text-[10px] uppercase text-gold-400 font-bold tracking-widest mb-1">Döntés</div>
                            {isEditing ? (
                                <input value={editedCard.decision || ''} onChange={e => handleInputChange('decision', e.target.value)} className="w-full bg-transparent border-b text-center font-serif" />
                            ) : (
                                <div className="font-serif text-lg">{card.decision || '-'}</div>
                            )}
                        </div>
                    </div>

                    {/* Counseling Section */}
                    {(hasCounselingInfo || isEditing) && (
                        <div className="mb-12 space-y-6">
                            <h3 className="text-2xl font-serif font-bold text-gold-100 flex items-center gap-3 border-b border-white/10 pb-2">
                                <span>🕯️</span> Tanácsadó Értelmezés
                            </h3>
                            
                            {(card.generalMeaning || isEditing) && (
                                <div className={`p-5 rounded-xl border transition-all ${isEditing && (editedCard.primaryContexts?.includes('general')) ? 'border-gold-500 bg-gold-500/10' : 'bg-white/5 border-white/5'}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-bold text-gold-400 text-sm uppercase tracking-wider">Általános Jelentés</h4>
                                        {isEditing && <ContextToggle ctx="general" label="Általános" />}
                                    </div>
                                    {isEditing ? (
                                        <MarkdownEditor 
                                            value={editedCard.generalMeaning || ''}
                                            onChange={(val) => handleInputChange('generalMeaning', val)}
                                            height="h-32"
                                        />
                                    ) : (
                                        <MarkdownRenderer content={card.generalMeaning} className="text-gray-300 leading-relaxed text-sm" />
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(card.loveMeaning || isEditing) && (
                                    <div className={`p-5 rounded-xl border transition-all ${isEditing && (editedCard.primaryContexts?.includes('love')) ? 'border-gold-500 bg-gold-500/10' : 'bg-indigo-500/10 border-indigo-500/20'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-bold text-indigo-300 text-sm uppercase tracking-wider">❤️ Szerelem & Kapcsolat</h4>
                                            {isEditing && <ContextToggle ctx="love" label="Szerelem" />}
                                        </div>
                                        {isEditing ? (
                                            <MarkdownEditor 
                                                value={editedCard.loveMeaning || ''}
                                                onChange={(val) => handleInputChange('loveMeaning', val)}
                                                height="h-32"
                                            />
                                        ) : (
                                            <MarkdownRenderer content={card.loveMeaning} className="text-gray-300 leading-relaxed text-sm" />
                                        )}
                                    </div>
                                )}
                                {(card.careerMeaning || isEditing) && (
                                    <div className={`p-5 rounded-xl border transition-all ${isEditing && (editedCard.primaryContexts?.includes('career')) ? 'border-gold-500 bg-gold-500/10' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-bold text-emerald-300 text-sm uppercase tracking-wider">💼 Hivatás & Munka</h4>
                                            {isEditing && <ContextToggle ctx="career" label="Hivatás" />}
                                        </div>
                                        {isEditing ? (
                                            <MarkdownEditor 
                                                value={editedCard.careerMeaning || ''}
                                                onChange={(val) => handleInputChange('careerMeaning', val)}
                                                height="h-32"
                                            />
                                        ) : (
                                            <MarkdownRenderer content={card.careerMeaning} className="text-gray-300 leading-relaxed text-sm" />
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {(card.advice || isEditing) && (
                                    <div className={`p-4 rounded-xl border md:col-span-1 transition-all ${isEditing && (editedCard.primaryContexts?.includes('advice')) ? 'border-gold-500 bg-gold-500/10' : 'bg-gold-500/10 border-gold-500/20'}`}>
                                        <div className="flex flex-col gap-2 mb-2">
                                            <h4 className="font-bold text-gold-400 text-xs uppercase tracking-wider">💡 A Tarot Tanácsa</h4>
                                            {isEditing && <ContextToggle ctx="advice" label="Tanács" />}
                                        </div>
                                        {isEditing ? (
                                            <MarkdownEditor 
                                                value={editedCard.advice || ''}
                                                onChange={(val) => handleInputChange('advice', val)}
                                                height="h-24"
                                            />
                                        ) : (
                                            <MarkdownRenderer content={card.advice} className="text-gray-300 leading-relaxed text-xs" />
                                        )}
                                    </div>
                                )}
                                {(card.dailyMeaning || isEditing) && (
                                    <div className={`p-4 rounded-xl border md:col-span-1 transition-all ${isEditing && (editedCard.primaryContexts?.includes('daily')) ? 'border-gold-500 bg-gold-500/10' : 'bg-blue-500/10 border-blue-500/20'}`}>
                                        <div className="flex flex-col gap-2 mb-2">
                                            <h4 className="font-bold text-blue-300 text-xs uppercase tracking-wider">📅 Napi Kártya</h4>
                                            {isEditing && <ContextToggle ctx="daily" label="Napi" />}
                                        </div>
                                        {isEditing ? (
                                            <MarkdownEditor 
                                                value={editedCard.dailyMeaning || ''}
                                                onChange={(val) => handleInputChange('dailyMeaning', val)}
                                                height="h-24"
                                            />
                                        ) : (
                                            <MarkdownRenderer content={card.dailyMeaning} className="text-gray-300 leading-relaxed text-xs" />
                                        )}
                                    </div>
                                )}
                                {(card.yearlyMeaning || isEditing) && (
                                    <div className={`p-4 rounded-xl border md:col-span-1 transition-all ${isEditing && (editedCard.primaryContexts?.includes('yearly')) ? 'border-gold-500 bg-gold-500/10' : 'bg-purple-500/10 border-purple-500/20'}`}>
                                        <div className="flex flex-col gap-2 mb-2">
                                            <h4 className="font-bold text-purple-300 text-xs uppercase tracking-wider">🗓️ Éves Kártya</h4>
                                            {isEditing && <ContextToggle ctx="yearly" label="Éves" />}
                                        </div>
                                        {isEditing ? (
                                            <MarkdownEditor 
                                                value={editedCard.yearlyMeaning || ''}
                                                onChange={(val) => handleInputChange('yearlyMeaning', val)}
                                                height="h-24"
                                            />
                                        ) : (
                                            <MarkdownRenderer content={card.yearlyMeaning} className="text-gray-300 leading-relaxed text-xs" />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Original Meanings */}
                    <div className="space-y-8 mb-10">
                        <div className="bg-white/5 p-6 rounded-2xl border-l-4 border-gold-500">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gold-400 mb-3 flex items-center gap-2">
                                <span className="text-xl">☀️</span> Fénylátó (Egyenes)
                            </h3>
                            {isEditing ? (
                                <MarkdownEditor 
                                    value={editedCard.meaningUpright}
                                    onChange={(val) => handleInputChange('meaningUpright', val)}
                                    height="h-24"
                                />
                            ) : (
                                <MarkdownRenderer content={card.meaningUpright} className="text-lg leading-relaxed text-gray-200" />
                            )}
                        </div>
                        
                        <div className="bg-white/5 p-6 rounded-2xl border-l-4 border-indigo-500">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-400 mb-3 flex items-center gap-2">
                                <span className="text-xl">🌑</span> Árnylátó (Fordított)
                            </h3>
                            {isEditing ? (
                                <MarkdownEditor 
                                    value={editedCard.meaningReversed}
                                    onChange={(val) => handleInputChange('meaningReversed', val)}
                                    height="h-24"
                                />
                            ) : (
                                <MarkdownRenderer content={card.meaningReversed} className="text-lg leading-relaxed text-gray-300" />
                            )}
                        </div>
                    </div>

                    {/* History Section (Now Full Width if Symbolism moved or separate) */}
                    {(card.history || isEditing) && (
                        <div className="mb-10">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-3 flex items-center gap-2">
                                <span>📜</span> Történet & Eredet
                            </h3>
                            {isEditing ? (
                                <MarkdownEditor
                                    value={editedCard.history || ''}
                                    onChange={(val) => handleInputChange('history', val)}
                                    height="h-32"
                                />
                            ) : (
                                <MarkdownRenderer content={card.history} className="text-sm text-gray-400 leading-relaxed text-justify" />
                            )}
                        </div>
                    )}

                    {/* Colors Section (New, requested place of Symbolism, above extra data, below History) */}
                    {(card.colors?.length > 0 || isEditing) && (
                        <div className="mb-10 p-6 bg-black/20 rounded-2xl border border-white/5">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-4 flex items-center gap-2">
                                <span>🎨</span> Színek & Hangulat
                            </h3>
                            {isEditing ? (
                                <div className="space-y-2">
                                    {(editedCard.colors || []).map((col, idx) => (
                                        <div key={col.id} className="flex gap-3 items-center">
                                            <input
                                                type="color"
                                                value={col.colorCode}
                                                onChange={e => {
                                                    const newCols = [...(editedCard.colors || [])];
                                                    newCols[idx].colorCode = e.target.value;
                                                    setEditedCard({...editedCard, colors: newCols});
                                                }}
                                                className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
                                            />
                                            <input
                                                value={col.description}
                                                onChange={e => {
                                                    const newCols = [...(editedCard.colors || [])];
                                                    newCols[idx].description = e.target.value;
                                                    setEditedCard({...editedCard, colors: newCols});
                                                }}
                                                className="flex-1 bg-white/5 border border-white/10 rounded p-2 text-sm text-white"
                                                placeholder="Szín jelentése..."
                                            />
                                            <button
                                                onClick={() => {
                                                    const newCols = [...(editedCard.colors || [])];
                                                    newCols.splice(idx, 1);
                                                    setEditedCard({...editedCard, colors: newCols});
                                                }}
                                                className="text-red-400 px-2"
                                            >✕</button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setEditedCard({
                                            ...editedCard,
                                            colors: [...(editedCard.colors || []), { id: Date.now().toString(), colorCode: '#ffffff', description: '' }]
                                        })}
                                        className="text-xs font-bold uppercase text-gold-400 border border-gold-500/30 px-3 py-1 rounded"
                                    >
                                        + Új Szín
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-4">
                                    {card.colors!.map(col => (
                                        <div key={col.id} className="flex items-center gap-3 bg-white/5 pr-4 rounded-full border border-white/5">
                                            <div className="w-8 h-8 rounded-full border border-white/20 shadow-lg" style={{backgroundColor: col.colorCode}}></div>
                                            <span className="text-sm text-gray-300">{col.description}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Symbolism Section (Now Full Width in New Row) */}
                    {(card.symbolism || isEditing) && (
                        <div className="mb-10">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-3 flex items-center gap-2">
                                <span>👁️</span> Szimbolika
                            </h3>
                            {isEditing ? (
                                <div className="space-y-4">
                                    <MarkdownEditor
                                        value={editedCard.symbolism || ''}
                                        onChange={(val) => handleInputChange('symbolism', val)}
                                        height="h-32"
                                    />
                                    <div className="border-t border-white/10 pt-4">
                                        <label className="block text-[10px] uppercase font-bold text-white/40 mb-2">Szimbólum Lista</label>
                                        {(editedCard.symbols || []).map((sym, idx) => (
                                            <div key={sym.id} className="flex gap-2 items-center bg-black/20 p-2 rounded mb-2">
                                                <button
                                                    onClick={() => setShowIconPicker(idx)}
                                                    className="w-10 h-10 bg-white/5 border border-white/10 rounded flex items-center justify-center hover:bg-gold-500/20 hover:border-gold-500 transition-colors"
                                                >
                                                    {sym.icon && GAME_ICONS[sym.icon] ? (
                                                        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current text-gold-400"><path d={GAME_ICONS[sym.icon]} /></svg>
                                                    ) : (
                                                        <span className="text-xs text-white/30">?</span>
                                                    )}
                                                </button>
                                                <input
                                                    value={sym.description}
                                                    onChange={e => {
                                                        const newSyms = [...(editedCard.symbols || [])];
                                                        newSyms[idx].description = e.target.value;
                                                        setEditedCard({...editedCard, symbols: newSyms});
                                                    }}
                                                    className="flex-1 bg-transparent border-b border-white/10 p-2 text-sm text-white focus:border-gold-500 outline-none"
                                                    placeholder="Mit jelent ez a szimbólum?"
                                                />
                                                <button
                                                    onClick={() => {
                                                        const newSyms = [...(editedCard.symbols || [])];
                                                        newSyms.splice(idx, 1);
                                                        setEditedCard({...editedCard, symbols: newSyms});
                                                    }}
                                                    className="text-red-400 hover:text-red-500 px-2"
                                                >✕</button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => setEditedCard({
                                                ...editedCard,
                                                symbols: [...(editedCard.symbols || []), { id: Date.now().toString(), icon: '', description: '' }]
                                            })}
                                            className="text-xs font-bold uppercase tracking-widest text-gold-400 border border-gold-500/30 px-3 py-1.5 rounded hover:bg-gold-500/10"
                                        >
                                            + Szimbólum
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <MarkdownRenderer content={card.symbolism} className="text-sm text-gray-400 leading-relaxed text-justify mb-4" />
                                    {card.symbols && card.symbols.length > 0 && (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {card.symbols.map(sym => (
                                                <div key={sym.id} className="flex gap-3 items-center bg-white/5 p-2 rounded-lg border border-white/5 hover:border-gold-500/30 transition-colors">
                                                    <div className="w-8 h-8 flex-shrink-0 bg-black/40 rounded-full flex items-center justify-center">
                                                        {sym.icon && GAME_ICONS[sym.icon] && (
                                                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-gold-400"><path d={GAME_ICONS[sym.icon]} /></svg>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-300 font-serif leading-tight">{sym.description}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {showIconPicker !== null && (
                        <IconPicker
                            onSelect={(iconKey) => {
                                const newSyms = [...(editedCard.symbols || [])];
                                if (showIconPicker !== null && newSyms[showIconPicker]) {
                                    newSyms[showIconPicker].icon = iconKey;
                                    setEditedCard({...editedCard, symbols: newSyms});
                                }
                                setShowIconPicker(null);
                            }}
                            onClose={() => setShowIconPicker(null)}
                        />
                    )}

                    {/* Extended Data Section (Dynamic 3-col grid) */}
                    {(card.extendedData?.length > 0 || isEditing) && (
                        <div className="bg-black/20 p-8 rounded-3xl border border-white/10 mt-10 mb-10">
                            <h3 className="text-xl font-serif font-bold text-white mb-6 flex items-center gap-3">
                                <span>🧬</span> További Adatok
                            </h3>
                            {isEditing ? (
                                <div className="space-y-4">
                                    {(editedCard.extendedData || []).map((item, idx) => (
                                        <div key={item.id || idx} className="flex gap-2 items-center bg-white/5 p-2 rounded">
                                            <input
                                                value={item.label}
                                                onChange={e => {
                                                    const newData = [...(editedCard.extendedData || [])];
                                                    newData[idx].label = e.target.value;
                                                    setEditedCard({...editedCard, extendedData: newData});
                                                }}
                                                className="bg-black/30 border border-white/10 rounded p-2 text-gold-400 font-bold text-xs w-1/3"
                                                placeholder="Címke"
                                            />
                                            <input
                                                value={item.value}
                                                onChange={e => {
                                                    const newData = [...(editedCard.extendedData || [])];
                                                    newData[idx].value = e.target.value;
                                                    setEditedCard({...editedCard, extendedData: newData});
                                                }}
                                                className="bg-black/30 border border-white/10 rounded p-2 text-white text-sm flex-1"
                                                placeholder="Érték"
                                            />
                                            <button
                                                onClick={() => {
                                                    const newData = [...(editedCard.extendedData || [])];
                                                    newData.splice(idx, 1);
                                                    setEditedCard({...editedCard, extendedData: newData});
                                                }}
                                                className="text-red-400 hover:text-red-500 px-2"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => setEditedCard({
                                            ...editedCard,
                                            extendedData: [...(editedCard.extendedData || []), { id: Date.now().toString(), label: '', value: '' }]
                                        })}
                                        className="text-xs font-bold uppercase tracking-widest text-gold-400 border border-gold-500/30 px-4 py-2 rounded-full hover:bg-gold-500/10"
                                    >
                                        + Új Adatmező
                                    </button>
                                </div>
                            ) : (
                                <div className={`grid gap-6 grid-cols-1 ${card.extendedData!.length >= 2 ? 'md:grid-cols-2' : ''} ${card.extendedData!.length >= 3 ? 'lg:grid-cols-3' : ''}`}>
                                    {card.extendedData!.map((item, idx) => {
                                        // Logic: If total % 3 == 1 and this is the last item, span full width.
                                        const total = card.extendedData!.length;
                                        const isLast = idx === total - 1;
                                        const remainder = total % 3;
                                        // If we have 4 items: first 3 are cols, 4th is full width (remainder 1).
                                        // If we have 1 item: full width.
                                        const isFullWidth = (total === 1) || (total > 3 && remainder === 1 && isLast);

                                        return (
                                            <div
                                                key={item.id}
                                                className={`bg-white/5 border border-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors ${isFullWidth ? 'lg:col-span-3' : ''}`}
                                            >
                                                <div className="text-[10px] uppercase font-bold text-gold-500 tracking-widest mb-1 opacity-70">{item.label}</div>
                                                <div className="text-white text-sm font-serif leading-relaxed">{item.value}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Questions Section */}
                    {(card.questions?.length > 0 || isEditing) && (
                        <div className="bg-black/20 p-8 rounded-3xl border border-white/10 mt-10">
                            <h3 className="text-xl font-serif font-bold text-white mb-6 flex items-center gap-3">
                                <span>🔮</span> Reflexiós Kérdések
                            </h3>
                            
                            {isEditing ? (
                                <div className="space-y-3">
                                    {(editedCard.questions || []).map((q, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <span className="text-gold-500 font-serif italic pt-2">{idx + 1}.</span>
                                            <textarea
                                                value={q}
                                                onChange={(e) => handleQuestionChange(idx, e.target.value)}
                                                className="flex-1 bg-white/5 border border-white/10 rounded p-2 text-gray-300 text-sm focus:border-gold-500 outline-none resize-none h-16"
                                            />
                                            <button 
                                                onClick={() => handleRemoveQuestion(idx)}
                                                className="text-red-400 hover:text-red-500 px-2"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                    <button 
                                        onClick={handleAddQuestion}
                                        className="mt-2 text-xs font-bold uppercase tracking-widest text-gold-400 hover:text-white border border-gold-500/30 hover:bg-gold-500/20 px-4 py-2 rounded-full transition-colors"
                                    >
                                        + Új Kérdés
                                    </button>
                                </div>
                            ) : (
                                <ul className="space-y-4">
                                    {card.questions.map((q, idx) => (
                                        <li key={idx} className="flex gap-4 items-start group">
                                            <span className="text-gold-500 font-serif italic opacity-50 group-hover:opacity-100 transition-opacity">{idx + 1}.</span>
                                            <p className="text-gray-300 italic leading-relaxed">{q}</p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* Comparison Section - Separate Box Below Questions */}
                    <div className="mt-12">
                        {isEditing ? (
                            <div className="space-y-4 bg-white/5 p-6 rounded-3xl border border-white/10">
                                <h4 className="text-sm font-bold text-gold-400 uppercase tracking-widest mb-4">Összehasonlítás Szerkesztése</h4>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">Összehasonlító Cím</label>
                                    <input 
                                        value={editedCard.comparison?.title || ''}
                                        onChange={e => handleComparisonChange('title', e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white text-sm"
                                        placeholder="Pl. Érmék Ásza vs. Botok Ásza"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">Összehasonlító Szöveg</label>
                                    <textarea 
                                        value={editedCard.comparison?.text || ''}
                                        onChange={e => handleComparisonChange('text', e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white text-sm h-32 resize-none"
                                        placeholder="Írd le a különbségeket vagy hasonlóságokat..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-white/40 mb-1">Kapcsolódó Kártya ID</label>
                                    <input 
                                        value={editedCard.comparison?.relatedCardId || ''}
                                        onChange={e => handleComparisonChange('relatedCardId', e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white text-sm font-mono"
                                        placeholder="Pl. wands-1"
                                    />
                                </div>
                            </div>
                        ) : (
                            card.comparison && (
                                <div className="animate-fade-in">
                                    <h3 className="text-xl font-serif font-bold text-white mb-6 flex items-center gap-3">
                                        <span>⚖️</span> {card.comparison.title}
                                    </h3>
                                    <div className="flex flex-col md:flex-row gap-8 items-stretch bg-white/5 p-8 rounded-3xl border border-white/10 shadow-xl overflow-hidden relative group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-gold-500/10 transition-colors"></div>
                                        
                                        {/* Left Col: Text */}
                                        <div className="flex-1 text-gray-300 leading-relaxed italic border-l-4 border-gold-500/30 pl-6 flex items-center">
                                            <div className="text-lg md:text-xl font-serif">
                                                <MarkdownRenderer content={card.comparison.text} />
                                            </div>
                                        </div>

                                        {/* Right Col: Card Image */}
                                        <div className="w-full md:w-48 flex-shrink-0 flex flex-col items-center justify-center gap-3">
                                            <div className="w-full aspect-[2/3] rounded-xl overflow-hidden shadow-2xl border border-white/10 group/comp transition-all duration-500 hover:shadow-gold-500/20 hover:border-gold-500/30">
                                                <CardImage cardId={card.comparison.relatedCardId} className="w-full h-full object-cover transition-transform duration-500 group-hover/comp:scale-110" />
                                            </div>
                                            <div className="text-[10px] text-center font-bold uppercase text-gold-500/60 tracking-[0.2em]">Összevetett Lap</div>
                                        </div>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
