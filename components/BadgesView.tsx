
import React, { useState, useEffect, useMemo } from 'react';
import { useTarot } from '../context/TarotContext';
import { BADGES } from '../constants/badges';
import { CommunityService } from '../services/communityService';
import { CommunityBadge, Reading, Badge, BadgeRequest } from '../types';
import { FULL_DECK } from '../constants';

const ZODIAC_SIGNS = ["Kos", "Bika", "Ikrek", "Rák", "Oroszlán", "Szűz", "Mérleg", "Skorpió", "Nyilas", "Bak", "Vízöntő", "Halak"];
const SABBATS = ["Yule", "Imbolc", "Ostara", "Beltane", "Litha", "Lughnasadh", "Mabon", "Samhain"];
const MOON_PHASES = ["Újhold", "Növő Hold", "Telihold", "Fogyó Hold"];
const MONTHS = ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"];

const BadgeCard: React.FC<{ badge: any, locked?: boolean, onClaim?: () => void, isClaimed?: boolean, isPending?: boolean }> = ({ badge, locked, onClaim, isClaimed, isPending }) => (
    <div className={`glass-panel p-6 rounded-2xl border transition-all flex flex-col items-center text-center relative group ${locked ? 'opacity-40 border-white/5 grayscale' : 'border-gold-500/30 bg-gold-500/5 shadow-lg shadow-gold-500/5'}`}>
        <div className={`text-5xl mb-4 transition-transform group-hover:scale-110 ${locked ? '' : 'animate-float'}`}>{badge.icon}</div>
        <h3 className="font-serif font-bold text-white text-lg mb-1">{badge.name}</h3>
        <p className="text-xs text-white/50 leading-relaxed mb-2">{badge.description}</p>
        
        {badge.requirements && badge.isManual && (
            <div className="text-[10px] bg-black/40 border border-white/10 p-2 rounded-lg mb-4 text-gray-300 italic">
                {badge.requirements}
            </div>
        )}

        {badge.conditionType && !badge.isManual && (
            <div className="text-[10px] bg-black/40 border border-white/10 p-2 rounded-lg mb-4 text-gray-300 text-left w-full space-y-1">
                <div className="font-bold text-gold-500 uppercase border-b border-white/10 pb-1 mb-1">Automata Feltételek</div>
                <div>🎯 Típus: {badge.conditionType} (x{badge.target})</div>
                {badge.filterCardType !== 'any' && badge.filterCardType && <div>🃏 Kártya: {badge.filterCardType} {badge.filterCardIds?.length ? `(${badge.filterCardIds.length} db)` : ''}</div>}
                {badge.timeUnit && <div>⏱ Idő: {badge.timeUnit} {badge.timeRangeStart && `(${badge.timeRangeStart})`}</div>}
                {badge.filterZodiac && <div>♈ Jegy: {badge.filterZodiac}</div>}
                {badge.targetSpreadId && <div>💠 Kirakás: Konkrét</div>}
            </div>
        )}

        <div className="flex flex-wrap justify-center gap-2 mt-auto">
            {badge.tier && (
                <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${badge.tier === 'gold' ? 'border-yellow-500 text-yellow-500' : badge.tier === 'silver' ? 'border-gray-300 text-gray-300' : 'border-orange-400 text-orange-400'}`}>
                    {badge.tier}
                </span>
            )}
            {badge.isManual && (
                <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border border-indigo-500 text-indigo-300">
                    Manuális
                </span>
            )}
            {badge.conditionType && !badge.isManual && (
                <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border border-green-500 text-green-300">
                    Auto
                </span>
            )}
        </div>

        {onClaim && !isClaimed && !isPending && (
            <button 
                onClick={(e) => { e.stopPropagation(); onClaim(); }}
                className="mt-4 w-full py-2 bg-gold-500 hover:bg-gold-400 text-black text-xs font-bold rounded-lg transition-all"
            >
                Megszerzés kérelmezése
            </button>
        )}
        {isPending && (
            <div className="mt-4 w-full py-2 bg-white/5 text-white/50 text-xs font-bold rounded-lg border border-white/10 italic">
                Függőben...
            </div>
        )}
        {isClaimed && (
            <div className="mt-4 w-full py-2 bg-green-500/20 text-green-400 text-xs font-bold rounded-lg border border-green-500/30 flex items-center justify-center gap-1">
                <span>✓</span> Birtoklod
            </div>
        )}

        {locked && !onClaim && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs font-bold text-white bg-black/60 px-3 py-1 rounded-full border border-white/20">Még zárolva 🔒</span>
            </div>
        )}
    </div>
);

export const BadgesView = ({ onBack }: { onBack: () => void }) => {
    const { currentUser, readings, showToast, requestCommunityBadge, approveCommunityBadgeRequest, rejectCommunityBadgeRequest, allSpreads } = useTarot();
    const [activeTab, setActiveTab] = useState<'earned' | 'all' | 'community' | 'requests'>('earned');
    const [communityBadges, setCommunityBadges] = useState<CommunityBadge[]>([]);
    const [myRequests, setMyRequests] = useState<BadgeRequest[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Badge Builder State
    const [isBuilding, setIsBuilding] = useState(false);
    const [newBadge, setNewBadge] = useState<Partial<CommunityBadge>>({
        name: '',
        description: '',
        icon: '✨',
        requirements: '',
        isManual: true,

        conditionType: 'reading_count',
        target: 1,
        filterCardType: 'any',
        filterLogic: 'OR',
        filterCardIds: [],
        timeUnit: undefined,
        timeRangeStart: '',
        timeRangeEnd: '',
        filterZodiac: '',
        targetSpreadId: ''
    });

    const [cardSearch, setCardSearch] = useState('');

    const myEarnedIds = currentUser?.badges || [];

    useEffect(() => {
        if (activeTab === 'community') loadCommunityBadges();
        if (activeTab === 'requests') loadRequests();
    }, [activeTab]);

    const loadCommunityBadges = async () => {
        setLoading(true);
        const data = await CommunityService.getCommunityBadges();
        setCommunityBadges(data);
        setLoading(false);
    };

    const loadRequests = async () => {
        if (!currentUser) return;
        setLoading(true);
        const data = await CommunityService.getBadgeRequestsForCreator(currentUser.id);
        setMyRequests(data);
        setLoading(false);
    };

    const handleCreateBadge = async () => {
        if (!newBadge.name || !newBadge.description || !currentUser) return showToast("Hiányzó adatok!", "info");

        const badge: CommunityBadge = {
            id: `cb_${Date.now()}`,
            ...newBadge as CommunityBadge,
            userId: currentUser.id,
            authorName: currentUser.name,
            createdAt: new Date().toISOString(),
            likes: 0,
            likedBy: [],
            issuedCount: 0
        };
        const success = await CommunityService.publishCommunityBadge(badge);
        if (success) {
            showToast("Jelvény publikálva a közösségnek!", "success");
            setNewBadge({
                name: '', description: '', icon: '✨', requirements: '', isManual: true,
                conditionType: 'reading_count', target: 1, filterCardType: 'any', filterLogic: 'OR',
                filterCardIds: [], timeUnit: undefined, timeRangeStart: '', timeRangeEnd: '', filterZodiac: '', targetSpreadId: ''
            });
            setIsBuilding(false);
            loadCommunityBadges();
        }
    };

    const handleClaim = async (badge: CommunityBadge) => {
        if (badge.isManual) {
            const msg = prompt("Írj egy rövid üzenetet a készítőnek (pl. miért gondolod, hogy teljesítetted a feltételt):");
            if (msg === null) return;
            await requestCommunityBadge(badge, msg);
        } else {
            // Auto check should happen on server or action, but here we can trigger a manual check or just claim if logic permits
            // For now, treat community badges as manual claim in UI flow, or auto assigned by system.
            // If user clicks claim on auto badge, maybe re-verify?
            showToast("Ez a jelvény automatikusan kerül kiosztásra, ha teljesíted a feltételeket!", "info");
        }
    };

    const handleResolveRequest = async (req: BadgeRequest, status: 'approved' | 'rejected') => {
        if (status === 'approved') {
            await approveCommunityBadgeRequest(req.id, req.requesterId, req.badgeId, req.badgeName, req.badgeIcon);
        } else {
            await rejectCommunityBadgeRequest(req.id, req.requesterId, req.badgeName);
        }
        loadRequests();
    };

    const filteredCards = FULL_DECK.filter(c => c.name.toLowerCase().includes(cardSearch.toLowerCase()));

    const availableSpreads = useMemo(() => {
        if (!allSpreads) return [];
        return allSpreads.filter(s => s.isCustom === false || s.userId === currentUser?.id || s.isPublic);
    }, [allSpreads, currentUser]);

    const toggleCardId = (id: string) => {
        const currentIds = newBadge.filterCardIds || [];
        if (currentIds.includes(id)) {
            setNewBadge({ ...newBadge, filterCardIds: currentIds.filter(cid => cid !== id) });
        } else {
            setNewBadge({ ...newBadge, filterCardIds: [...currentIds, id] });
        }
    };

    return (
        <div className="animate-fade-in max-w-6xl mx-auto pb-24">
            <div className="flex justify-between items-center mb-8 overflow-x-auto custom-scrollbar pb-2">
                <button onClick={onBack} className="flex items-center gap-2 font-bold text-white/60 hover:text-gold-400 transition-colors mr-4">
                    &larr; Vissza
                </button>
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 whitespace-nowrap">
                    <button onClick={() => setActiveTab('earned')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'earned' ? 'bg-gold-500 text-black' : 'text-white/40'}`}>Megszerzett</button>
                    <button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'all' ? 'bg-gold-500 text-black' : 'text-white/40'}`}>Rendszer</button>
                    <button onClick={() => setActiveTab('community')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'community' ? 'bg-gold-500 text-black' : 'text-white/40'}`}>Közösségi</button>
                    <button onClick={() => setActiveTab('requests')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'requests' ? 'bg-gold-500 text-black' : 'text-white/40'}`}>
                        Kérelmek
                        {myRequests.length > 0 && <span className="bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">{myRequests.length}</span>}
                    </button>
                </div>
            </div>

            <div className="text-center mb-12">
                <h2 className="text-4xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-white to-gold-400">
                    {activeTab === 'requests' ? 'Beérkező Kérelmek' : 'Dicsőség Csarnoka'}
                </h2>
                <p className="text-white/60 mt-2 text-sm italic">
                    {activeTab === 'requests' ? 'Hagyd jóvá vagy utasítsd el a jelvényeidre érkező igényeket.' : 'Gyűjtsd össze az összes szakrális jelvényt.'}
                </p>
            </div>

            {activeTab === 'earned' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {BADGES.filter(b => myEarnedIds.includes(b.id)).map(b => <BadgeCard key={b.id} badge={b} isClaimed />)}
                    {communityBadges.filter(cb => myEarnedIds.includes(cb.id)).map(cb => <BadgeCard key={cb.id} badge={cb} isClaimed />)}
                    {(myEarnedIds.length === 0) && <div className="col-span-full py-20 text-center opacity-30 italic">Még nem szereztél jelvényt. Tarts egy szeánszot!</div>}
                </div>
            )}

            {activeTab === 'all' && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {BADGES.map(b => (
                        <BadgeCard key={b.id} badge={b} locked={!myEarnedIds.includes(b.id)} isClaimed={myEarnedIds.includes(b.id)} />
                    ))}
                </div>
            )}

            {activeTab === 'community' && (
                <div className="space-y-10">
                    <div className="flex justify-center">
                        <button onClick={() => setIsBuilding(!isBuilding)} className="bg-white/10 hover:bg-white/20 border border-white/20 px-6 py-2 rounded-full font-bold text-sm text-gold-400">
                            {isBuilding ? 'Mégse' : '➕ Új Közösségi Jelvény Tervezése'}
                        </button>
                    </div>

                    {isBuilding && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in max-w-6xl mx-auto">
                            {/* Builder Form (Quest Style) */}
                            <div className="glass-panel p-8 rounded-3xl border border-gold-500/30 bg-black/40 shadow-2xl">
                                <h3 className="text-xl font-serif font-bold text-white mb-6 text-center">Jelvény Tervező</h3>
                                <div className="space-y-4">

                                    {/* Icon Input (Emoji Only) */}
                                    <div className="flex justify-center mb-4">
                                        <div className="relative group text-center">
                                            <label className="block text-[10px] uppercase font-bold text-white/30 mb-2">Ikon (Emoji)</label>
                                            <input
                                                type="text"
                                                value={newBadge.icon || ''}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    const emojiRegex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u;
                                                    if (val === '' || emojiRegex.test(val)) {
                                                        const match = val.match(emojiRegex);
                                                        setNewBadge({...newBadge, icon: match ? match[0] : val});
                                                    }
                                                }}
                                                className="w-24 h-24 text-center text-6xl bg-black/40 border border-white/20 rounded-2xl focus:border-gold-500 outline-none transition-all placeholder:opacity-20"
                                                placeholder="🏆"
                                                maxLength={2}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gold-500/60 mb-1 ml-1">Megnevezés</label>
                                        <input value={newBadge.name} onChange={e => setNewBadge({...newBadge, name: e.target.value})} placeholder="Pl. Hajnali Látó" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-gold-500" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gold-500/60 mb-1 ml-1">Leírás</label>
                                        <textarea value={newBadge.description} onChange={e => setNewBadge({...newBadge, description: e.target.value})} placeholder="Mit jelképez ez a rang?" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-gold-500 h-20 resize-none" />
                                    </div>

                                    {/* Auto Check Logic Switch */}
                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 mt-4">
                                        <div className="ml-2">
                                            <div className="text-sm font-bold text-white">Automatikus Ellenőrzés?</div>
                                            <div className="text-[10px] text-white/50">A rendszer figyeli a húzásokat</div>
                                        </div>
                                        <button 
                                            onClick={() => setNewBadge({...newBadge, isManual: !newBadge.isManual})}
                                            className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${!newBadge.isManual ? 'bg-green-500 text-black' : 'bg-white/10 text-white/40'}`}
                                        >
                                            {!newBadge.isManual ? 'IGEN (Auto)' : 'NEM (Manuális)'}
                                        </button>
                                    </div>

                                    {/* Ha Manuális, akkor csak szöveges feltétel */}
                                    {newBadge.isManual ? (
                                        <div className="animate-fade-in">
                                            <label className="block text-[10px] uppercase font-bold text-gold-500/60 mb-1 ml-1">Megszerzés Feltétele (Szöveg)</label>
                                            <input value={newBadge.requirements} onChange={e => setNewBadge({...newBadge, requirements: e.target.value})} placeholder="Pl. Oszd meg 10 húzásodat..." className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-gold-500" />
                                        </div>
                                    ) : (
                                        <div className="animate-fade-in space-y-4 pt-2">
                                            {/* Auto Filters (Quest Style) */}
                                            <div>
                                                <label className="block text-[10px] uppercase font-bold text-white/50 mb-1">Cél Típusa</label>
                                                <select value={newBadge.conditionType} onChange={e => setNewBadge({...newBadge, conditionType: e.target.value as any})} className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-xs">
                                                    <option value="reading_count">Húzás (Darabszám)</option>
                                                    <option value="card_draw">Kártya Megtalálása</option>
                                                    <option value="specific_spread">Konkrét Kirakás</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] uppercase font-bold text-white/50 mb-1">Cél Mennyiség</label>
                                                <input type="number" value={newBadge.target} onChange={e => setNewBadge({...newBadge, target: Number(e.target.value)})} className="w-full bg-black/30 border border-white/10 rounded p-2 text-white" min="1" />
                                            </div>

                                            {/* Kártya Feltételek */}
                                            {newBadge.conditionType === 'card_draw' && (
                                                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                                    <h4 className="text-xs font-bold text-gold-400 uppercase mb-3">Kártyák</h4>
                                                    <div className="space-y-3">
                                                        <select value={newBadge.filterCardType} onChange={e => setNewBadge({...newBadge, filterCardType: e.target.value as any})} className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-xs">
                                                            <option value="any">Bármelyik lap</option>
                                                            <option value="major">Csak Nagy Árkánum</option>
                                                            <option value="minor">Csak Kis Árkánum</option>
                                                            <option value="suit">Adott Szín</option>
                                                            <option value="specific">Konkrét Kártya(k)</option>
                                                        </select>

                                                        {newBadge.filterCardType === 'suit' && (
                                                            <select value={newBadge.filterSuit} onChange={e => setNewBadge({...newBadge, filterSuit: e.target.value as any})} className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-xs">
                                                                <option value="Kelyhek">Kelyhek 🏆</option>
                                                                <option value="Botok">Botok 🌿</option>
                                                                <option value="Kardok">Kardok 🗡️</option>
                                                                <option value="Érmék">Érmék 🪙</option>
                                                            </select>
                                                        )}

                                                        {newBadge.filterCardType === 'specific' && (
                                                            <div>
                                                                <input
                                                                    placeholder="Keress kártyát..."
                                                                    value={cardSearch}
                                                                    onChange={e => setCardSearch(e.target.value)}
                                                                    className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-xs mb-2"
                                                                />
                                                                <div className="h-40 overflow-y-auto custom-scrollbar bg-black/20 rounded border border-white/5 p-2 grid grid-cols-2 gap-2">
                                                                    {filteredCards.map(c => {
                                                                        const isSelected = newBadge.filterCardIds?.includes(c.id);
                                                                        return (
                                                                            <button
                                                                                key={c.id}
                                                                                onClick={() => toggleCardId(c.id)}
                                                                                className={`flex items-center gap-2 text-left px-2 py-1.5 rounded text-[10px] transition-colors border ${isSelected ? 'bg-gold-500/20 border-gold-500 text-gold-300' : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'}`}
                                                                            >
                                                                                {isSelected && <span>✓</span>} {c.name}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Kirakás Feltétel */}
                                            {newBadge.conditionType === 'specific_spread' && (
                                                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                                    <h4 className="text-xs font-bold text-green-400 uppercase mb-3">Kirakás</h4>
                                                    <select value={newBadge.targetSpreadId} onChange={e => setNewBadge({...newBadge, targetSpreadId: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-xs">
                                                        <option value="">-- Válassz --</option>
                                                        {availableSpreads.map(s => <option key={s.id} value={s.id}>{s.name} ({s.isCustom ? 'Saját' : 'System'})</option>)}
                                                    </select>
                                                </div>
                                            )}

                                            {/* Idő & Horoszkóp */}
                                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                                <h4 className="text-xs font-bold text-blue-300 uppercase mb-3">Időzítés & Asztrológia</h4>
                                                <div className="space-y-3">
                                                    <select value={newBadge.timeUnit || ''} onChange={e => setNewBadge({...newBadge, timeUnit: e.target.value as any || undefined, timeRangeStart: ''})} className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-xs">
                                                        <option value="">Bármikor</option>
                                                        <option value="sabbat">Sabbat</option>
                                                        <option value="moonphase">Holdállás</option>
                                                        <option value="day">Nap</option>
                                                        <option value="hour">Óra</option>
                                                    </select>

                                                    {newBadge.timeUnit === 'sabbat' && (
                                                        <select value={newBadge.timeRangeStart} onChange={e => setNewBadge({...newBadge, timeRangeStart: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-xs">
                                                            <option value="">-- Sabbat --</option>
                                                            {SABBATS.map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    )}

                                                    {/* Egyéb idő inputok hasonlóan QuestView-hoz (egyszerűsítve) */}

                                                    <div className="pt-2 border-t border-white/5">
                                                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                                                            <input type="checkbox" checked={!!newBadge.filterZodiac} onChange={e => setNewBadge({...newBadge, filterZodiac: e.target.checked ? ZODIAC_SIGNS[0] : ''})} className="w-4 h-4 bg-black/50 border-white/20 rounded accent-gold-500" />
                                                            <span className="text-xs font-bold text-white">Csak Csillagjegy?</span>
                                                        </label>
                                                        {newBadge.filterZodiac && (
                                                            <select value={newBadge.filterZodiac} onChange={e => setNewBadge({...newBadge, filterZodiac: e.target.value})} className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-xs">
                                                                {ZODIAC_SIGNS.map(z => <option key={z} value={z}>{z}</option>)}
                                                            </select>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <button onClick={handleCreateBadge} className="w-full py-4 bg-gold-500 text-black font-bold rounded-xl shadow-lg transform hover:scale-105 transition-transform mt-4">
                                        Publikálás a Piactérre
                                    </button>
                                </div>
                            </div>

                            {/* Preview / Guide */}
                            <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-indigo-950/20 flex flex-col justify-center items-center text-center">
                                <h3 className="text-xl font-serif font-bold text-gold-400 mb-6">Előnézet</h3>
                                <BadgeCard
                                    badge={{
                                        ...newBadge,
                                        tier: 'community',
                                        requirements: newBadge.isManual ? newBadge.requirements : `Automata: ${newBadge.conditionType} (${newBadge.target}x)`
                                    }}
                                    locked={false}
                                    isClaimed={false}
                                />
                                <p className="text-xs text-white/40 mt-6 max-w-sm">
                                    {newBadge.isManual
                                        ? "Ez egy manuális jelvény. A felhasználóknak kérelmezniük kell, és neked jóváhagyni."
                                        : "Ez egy automatikus jelvény. A rendszer figyeli a feltételeket és automatikusan kiosztja."
                                    }
                                </p>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-20 animate-spin text-4xl">🔮</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {communityBadges.map(cb => {
                                const isOwned = myEarnedIds.includes(cb.id);
                                const isMyBadge = cb.userId === currentUser?.id;
                                return (
                                    <BadgeCard 
                                        key={cb.id} 
                                        badge={cb} 
                                        isClaimed={isOwned}
                                        onClaim={!isOwned && !isMyBadge ? () => handleClaim(cb) : undefined}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'requests' && (
                <div className="max-w-3xl mx-auto space-y-6">
                    {loading ? (
                        <div className="text-center py-20 animate-spin text-4xl">🔮</div>
                    ) : myRequests.length === 0 ? (
                        <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10 opacity-50">
                            <p className="font-serif italic">Nincsenek függőben lévő kérelmeid.</p>
                        </div>
                    ) : (
                        myRequests.map(req => (
                            <div key={req.id} className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row gap-6 items-center">
                                <div className="flex-shrink-0 text-center">
                                    <div className="text-5xl mb-2">{req.badgeIcon}</div>
                                    <div className="text-[10px] uppercase font-bold text-gold-500">{req.badgeName}</div>
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                        <img src={req.requesterAvatar || ""} className="w-8 h-8 rounded-full border border-white/20" />
                                        <span className="font-bold text-white">{req.requesterName}</span>
                                        <span className="text-[9px] text-white/30">{new Date(req.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-sm text-gray-400 italic bg-black/30 p-3 rounded-lg border border-white/5">
                                        "{req.message || 'Nem írt üzenetet.'}"
                                    </p>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <button onClick={() => handleResolveRequest(req, 'rejected')} className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-red-500/20 text-red-300 text-xs font-bold border border-red-500/30 hover:bg-red-500/40 transition-all">Elutasítás</button>
                                    <button onClick={() => handleResolveRequest(req, 'approved')} className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-green-600 text-white text-xs font-bold shadow-lg hover:bg-green-500 transition-all">Jóváhagyás</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
