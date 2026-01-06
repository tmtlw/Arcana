
import React, { useState, useEffect, useMemo } from 'react';
import { useTarot } from '../context/TarotContext';
import { BADGES } from '../constants/badges';
import { CommunityService } from '../services/communityService';
import { CommunityBadge, Reading, Badge, BadgeRequest } from '../types';

const BadgeCard: React.FC<{ badge: any, locked?: boolean, onClaim?: () => void, isClaimed?: boolean, isPending?: boolean }> = ({ badge, locked, onClaim, isClaimed, isPending }) => (
    <div className={`glass-panel p-6 rounded-2xl border transition-all flex flex-col items-center text-center relative group ${locked ? 'opacity-40 border-white/5 grayscale' : 'border-gold-500/30 bg-gold-500/5 shadow-lg shadow-gold-500/5'}`}>
        <div className={`text-5xl mb-4 transition-transform group-hover:scale-110 ${locked ? '' : 'animate-float'}`}>{badge.icon}</div>
        <h3 className="font-serif font-bold text-white text-lg mb-1">{badge.name}</h3>
        <p className="text-xs text-white/50 leading-relaxed mb-2">{badge.description}</p>
        
        {badge.requirements && (
            <div className="text-[10px] bg-black/40 border border-white/10 p-2 rounded-lg mb-4 text-gray-300 italic">
                Feltétel: {badge.requirements}
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
    const { currentUser, readings, showToast, requestCommunityBadge, approveCommunityBadgeRequest, rejectCommunityBadgeRequest } = useTarot();
    const [activeTab, setActiveTab] = useState<'earned' | 'all' | 'community' | 'requests'>('earned');
    const [communityBadges, setCommunityBadges] = useState<CommunityBadge[]>([]);
    const [myRequests, setMyRequests] = useState<BadgeRequest[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Badge Builder State
    const [isBuilding, setIsBuilding] = useState(false);
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newIcon, setNewIcon] = useState("✨");
    const [newReq, setNewReq] = useState("");
    const [isManual, setIsManual] = useState(true);

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
        if (!newName || !newDesc || !currentUser) return;
        const badge: CommunityBadge = {
            id: `cb_${Date.now()}`,
            name: newName,
            description: newDesc,
            icon: newIcon,
            userId: currentUser.id,
            authorName: currentUser.name,
            createdAt: new Date().toISOString(),
            likes: 0,
            likedBy: [],
            requirements: newReq,
            isManual: isManual,
            issuedCount: 0
        };
        const success = await CommunityService.publishCommunityBadge(badge);
        if (success) {
            showToast("Jelvény publikálva a közösségnek!", "success");
            setNewName(""); setNewDesc(""); setNewReq(""); setIsBuilding(false);
            loadCommunityBadges();
        }
    };

    const handleClaim = async (badge: CommunityBadge) => {
        const msg = prompt("Írj egy rövid üzenetet a készítőnek (pl. miért gondolod, hogy teljesítetted a feltételt):");
        if (msg === null) return; // Cancel
        await requestCommunityBadge(badge, msg);
    };

    const handleResolveRequest = async (req: BadgeRequest, status: 'approved' | 'rejected') => {
        if (status === 'approved') {
            await approveCommunityBadgeRequest(req.id, req.requesterId, req.badgeId, req.badgeName, req.badgeIcon);
        } else {
            await rejectCommunityBadgeRequest(req.id, req.requesterId, req.badgeName);
        }
        loadRequests();
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
                    {/* Add Community badges that I earned too */}
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
                            {/* Builder Form */}
                            <div className="glass-panel p-8 rounded-3xl border border-gold-500/30 bg-black/40 shadow-2xl">
                                <h3 className="text-xl font-serif font-bold text-white mb-6 text-center">Jelvény Tervező</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-center mb-4">
                                        <input 
                                            type="text" value={newIcon} onChange={e => setNewIcon(e.target.value)} 
                                            className="text-6xl bg-transparent text-center w-24 focus:outline-none" 
                                            maxLength={2}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gold-500/60 mb-1 ml-1">Megnevezés</label>
                                        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Pl. Hajnali Látó" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-gold-500" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gold-500/60 mb-1 ml-1">Jelentés / Leírás</label>
                                        <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Mit jelképez ez a rang?" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-gold-500 h-20 resize-none" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gold-500/60 mb-1 ml-1">Megszerzés Feltétele</label>
                                        <input value={newReq} onChange={e => setNewReq(e.target.value)} placeholder="Pl. Legalább 10 hajnali húzás" className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-gold-500" />
                                    </div>
                                    
                                    <div className="flex items-center justify-between p-2 bg-white/5 rounded-xl border border-white/10">
                                        <div className="text-xs font-bold text-white/70 ml-2">Manuális jóváhagyás szükséges?</div>
                                        <button 
                                            onClick={() => setIsManual(!isManual)}
                                            className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${isManual ? 'bg-gold-500 text-black' : 'bg-white/10 text-white/40'}`}
                                        >
                                            {isManual ? 'IGEN' : 'NEM'}
                                        </button>
                                    </div>

                                    <button onClick={handleCreateBadge} className="w-full py-4 bg-gold-500 text-black font-bold rounded-xl shadow-lg transform hover:scale-105 transition-transform mt-4">
                                        Publikálás a Piactérre
                                    </button>
                                </div>
                            </div>

                            {/* System Guide - UPDATED DESCRIPTION */}
                            <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-indigo-950/20 flex flex-col justify-center">
                                <h3 className="text-xl font-serif font-bold text-gold-400 mb-6 flex items-center gap-2">
                                    <span>🕯️</span> Hogyan tervezz jó próbát?
                                </h3>
                                
                                <div className="space-y-6 text-sm leading-relaxed text-gray-300">
                                    <p className="italic text-white/60">
                                        A közösségi jelvények a <span className="text-gold-500 font-bold">"Bizonyíték alapú elismerésre"</span> épülnek. Ez nem csak egy statisztika, hanem egy közösségi rituálé, ahol te döntöd el, ki méltó a rangra.
                                    </p>
                                    
                                    <div>
                                        <h4 className="font-bold text-white mb-2 uppercase tracking-widest text-[10px]">1. A Törvény (Feltételek)</h4>
                                        <p>Írd le világosan a követelményeket a megfelelő mezőbe. Példa: <span className="text-indigo-300 italic">"Legyél a Nap gyermeke: Oszd meg legalább 5 olyan publikus húzásodat, ahol a Nap kártya szerepel!"</span></p>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-white mb-2 uppercase tracking-widest text-[10px]">2. A Próbatétel (Kérelem)</h4>
                                        <p>A többi látnok látja a jelvényt a Piactéren. Ha úgy érzik, teljesítették a kihívást, a <span className="font-bold text-gold-500">"Megszerzés kérelmezése"</span> gombbal jelentkezhetnek. Ekkor egy rövid üzenetben bizonyíthatják igazukat neked.</p>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-white mb-2 uppercase tracking-widest text-[10px]">3. A Lovaggá ütés (Jóváhagyás)</h4>
                                        <p>Te mint készítő kapsz egy értesítést. A <span className="font-bold text-white">"Kérelmek"</span> fül alatt ellenőrizheted a jelentkezőt (megnézheted a faliújság posztjait), és véglegesen odaítélheted a rangot.</p>
                                    </div>

                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-xs text-gold-400/80 italic">
                                        Tipp: Használd a 'Manuális' opciót a különleges, egyedi elbírálást igénylő rangokhoz!
                                    </div>
                                </div>
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
                                    <button 
                                        onClick={() => handleResolveRequest(req, 'rejected')}
                                        className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-red-500/20 text-red-300 text-xs font-bold border border-red-500/30 hover:bg-red-500/40 transition-all"
                                    >
                                        Elutasítás
                                    </button>
                                    <button 
                                        onClick={() => handleResolveRequest(req, 'approved')}
                                        className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-green-600 text-white text-xs font-bold shadow-lg hover:bg-green-500 transition-all"
                                    >
                                        Jóváhagyás
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
