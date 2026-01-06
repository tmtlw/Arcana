
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/firebase';
import { doc, setDoc, onSnapshot, getDoc, collection, addDoc, query, orderBy, serverTimestamp, where, getDocs, deleteDoc, writeBatch, updateDoc } from 'firebase/firestore';
import { useTarot } from '../context/TarotContext';
import { CardImage } from './CardImage';
import { FULL_DECK } from '../constants';
import { Spread, SpreadPosition } from '../types';

interface SessionData {
    hostId: string;
    hostName: string;
    guestName?: string;
    status: 'waiting' | 'active';
    drawnCards: { cardId: string, reversed: boolean, positionId: number }[];
    spreadId: string;
    spreadName: string;
    spreadPositions: SpreadPosition[]; 
}

interface ChatMessage {
    id: string;
    sender: string;
    text: string;
    timestamp: any;
}

export const MultiplayerSession = ({ onBack }: { onBack: () => void }) => {
    const { currentUser, allSpreads, deck, showToast, playSound } = useTarot();
    
    // Navigation & Data State
    const [mode, setMode] = useState<'menu' | 'spreadSelect' | 'room' | 'resolve_session'>('menu');
    const [roomId, setRoomId] = useState("");
    const [inputRoomId, setInputRoomId] = useState("");
    const [session, setSession] = useState<SessionData | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [pendingSession, setPendingSession] = useState<{id: string, spreadName: string, date: any} | null>(null);
    
    // UI State
    const [isCardPickerOpen, setIsCardPickerOpen] = useState(false);
    const [activePositionId, setActivePositionId] = useState<number | null>(null);
    const [cardSearch, setCardSearch] = useState("");
    const [isReversedSelection, setIsReversedSelection] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [isChatOpen, setIsChatOpen] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    const chatEndRef = useRef<HTMLDivElement>(null);

    // --- SETUP FLOW ---

    const handleHostStart = async () => {
        if (!currentUser || !db) return;
        
        try {
            const q = query(collection(db, 'sessions'), where('hostId', '==', currentUser.id));
            const snap = await getDocs(q);
            
            if (!snap.empty) {
                const existingDoc = snap.docs[0];
                const data = existingDoc.data();
                setPendingSession({ 
                    id: existingDoc.id, 
                    spreadName: data.spreadName || 'Ismeretlen',
                    date: data.createdAt
                });
                setMode('resolve_session');
            } else {
                setMode('spreadSelect');
            }
        } catch (e) {
            console.error("Hiba az ellenőrzéskor:", e);
            alert("Hiba történt a kapcsolatban.");
        }
    };

    const handleResumeSession = () => {
        if (pendingSession) {
            setRoomId(pendingSession.id);
            setMode('room');
        }
    };

    const deleteSessionFully = async (sid: string) => {
        if (!db) return;
        try {
            // 1. Delete all messages in subcollection first (Firestore requirement)
            const msgsQ = collection(db, 'sessions', sid, 'messages');
            const msgsSnap = await getDocs(msgsQ);
            
            const batch = writeBatch(db);
            msgsSnap.forEach((doc) => {
                batch.delete(doc.ref);
            });
            
            // 2. Delete the session document itself
            const sessionRef = doc(db, 'sessions', sid);
            batch.delete(sessionRef);
            
            await batch.commit();
        } catch (e) {
            console.error("Teljes törlési hiba:", e);
            throw e;
        }
    };

    const handleDeleteAndNew = async () => {
        if (pendingSession && db) {
            try {
                await deleteSessionFully(pendingSession.id);
                setPendingSession(null);
                setMode('spreadSelect');
            } catch (e) {
                console.error("Törlési hiba:", e);
                alert("Nem sikerült lezárni a régi szobát.");
            }
        }
    };

    const createRoom = async (spread: Spread) => {
        if (!currentUser || !db) return;
        try {
            const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
            
            await setDoc(doc(db, 'sessions', newRoomId), {
                hostId: currentUser.id,
                hostName: currentUser.name,
                status: 'waiting',
                drawnCards: [],
                spreadId: spread.id,
                spreadName: spread.name,
                spreadPositions: spread.positions,
                createdAt: serverTimestamp()
            });
            
            setRoomId(newRoomId);
            setMode('room');
        } catch (error: any) {
            console.error("Hiba:", error);
            alert("Nem sikerült létrehozni a szobát: " + error.message);
        }
    };

    const joinRoom = async () => {
        if (!currentUser || !db || !inputRoomId) return;
        try {
            const roomRef = doc(db, 'sessions', inputRoomId);
            const snap = await getDoc(roomRef);
            
            if (snap.exists()) {
                await setDoc(roomRef, { 
                    ...snap.data(), 
                    guestName: currentUser.name,
                    status: 'active' 
                }, { merge: true });
                setRoomId(inputRoomId);
                setMode('room');
            } else {
                alert("Nem található ilyen szoba!");
            }
        } catch (error: any) {
            alert("Csatlakozási hiba: " + error.message);
        }
    };

    // --- CLEANUP & EXIT LOGIC ---

    const handleExitRoom = async () => {
        if (!db || !roomId) return;

        const isHost = session?.hostId === currentUser?.id;

        if (isHost) {
            if (confirm("Jós vagy: Ha kilépsz, a szoba és az összes chat üzenet végleg törlődik. Biztosan bezárod?")) {
                try {
                    await deleteSessionFully(roomId);
                    setMode('menu');
                    setSession(null);
                    setRoomId("");
                    setMessages([]);
                } catch (e) {
                    console.error("Hiba kilépéskor:", e);
                }
            }
        } else {
            // Guest exit: Remove self from session
            if (confirm("Biztosan kilépsz a szobából?")) {
                try {
                    await updateDoc(doc(db, 'sessions', roomId), {
                        guestName: null,
                        status: 'waiting'
                    });
                    setMode('menu');
                    setSession(null);
                    setRoomId("");
                    setMessages([]);
                } catch(e) {
                    console.error("Guest exit error", e);
                    // Force exit locally even if DB fails
                    setMode('menu');
                }
            }
        }
    };

    // --- SYNC LOGIC ---

    useEffect(() => {
        if (mode === 'room' && roomId && db) {
            // 1. Session Data Sync
            const unsubSession = onSnapshot(doc(db, 'sessions', roomId), 
                (docSnapshot) => {
                    if (docSnapshot.exists()) {
                        setSession(docSnapshot.data() as SessionData);
                    } else {
                        // Document deleted (Host left)
                        if (mode === 'room') { 
                            alert("A szeánsz véget ért (a szoba bezárult).");
                            setMode('menu');
                            setSession(null);
                            setRoomId("");
                            setMessages([]);
                        }
                    }
                },
                (err) => console.error("Session sync error:", err)
            );

            // 2. Chat Sync
            const q = query(collection(db, 'sessions', roomId, 'messages'), orderBy('timestamp', 'asc'));
            const unsubChat = onSnapshot(q, (snapshot) => {
                const msgs: ChatMessage[] = [];
                let hasNewMessageFromOthers = false;

                snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        const data = change.doc.data() as ChatMessage;
                        if (data.sender !== currentUser?.name) {
                            hasNewMessageFromOthers = true;
                        }
                    }
                });

                snapshot.forEach(d => msgs.push({ id: d.id, ...d.data() } as ChatMessage));
                setMessages(msgs);
                
                // Notifications
                if (hasNewMessageFromOthers) {
                    playSound('success'); // Notification sound
                    if (!isChatOpen) {
                        setUnreadCount(prev => prev + 1);
                        showToast(`Új üzenet a szeánszon!`, 'info');
                    }
                }

                setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            });

            return () => {
                unsubSession();
                unsubChat();
            };
        }
    }, [mode, roomId, isChatOpen]); // isChatOpen dependency helps reset unread logic if needed

    useEffect(() => {
        if (isChatOpen) setUnreadCount(0);
    }, [isChatOpen]);

    // --- ACTIONS ---

    const sendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!chatInput.trim() || !currentUser || !db) return;

        try {
            await addDoc(collection(db, 'sessions', roomId, 'messages'), {
                sender: currentUser.name,
                text: chatInput.trim(),
                timestamp: serverTimestamp()
            });
            setChatInput("");
        } catch (err) {
            console.error(err);
        }
    };

    const handleSlotClick = (posId: number) => {
        if (session?.hostId !== currentUser?.id) return;
        setActivePositionId(posId);
        setCardSearch("");
        setIsReversedSelection(false);
        setIsCardPickerOpen(true);
    };

    const selectCard = async (cardId: string) => {
        if (!session || activePositionId === null || !db) return;

        const newDrawn = [
            ...session.drawnCards.filter(c => c.positionId !== activePositionId),
            { cardId, reversed: isReversedSelection, positionId: activePositionId }
        ];

        try {
            await setDoc(doc(db, 'sessions', roomId), { drawnCards: newDrawn }, { merge: true });
            setIsCardPickerOpen(false);
            setActivePositionId(null);
        } catch (err) {
            console.error(err);
        }
    };

    const removeCard = async (e: React.MouseEvent, posId: number) => {
        e.stopPropagation();
        if (!session || session.hostId !== currentUser?.id || !db) return;

        const newDrawn = session.drawnCards.filter(c => c.positionId !== posId);
        await setDoc(doc(db, 'sessions', roomId), { drawnCards: newDrawn }, { merge: true });
    };

    // --- VIEWS ---

    const filteredDeck = deck.filter(c => c.name.toLowerCase().includes(cardSearch.toLowerCase()));

    if (mode === 'resolve_session') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-fade-in max-w-md mx-auto">
                <div className="text-5xl mb-4">⚠️</div>
                <h2 className="text-2xl font-serif font-bold mb-4 text-white">Nyitott szobád van!</h2>
                <div className="bg-white/10 p-4 rounded-xl border border-white/20 mb-6 w-full">
                    <div className="text-xs uppercase text-white/50 font-bold tracking-widest">Szoba Kód</div>
                    <div className="text-3xl font-mono font-bold text-gold-400 mb-2">{pendingSession?.id}</div>
                    <div className="text-sm text-white">{pendingSession?.spreadName}</div>
                </div>
                <p className="text-white/60 mb-8 text-sm">
                    Nem nyithatsz új szobát, amíg az előzőt be nem fejezted. Mit szeretnél tenni?
                </p>
                <div className="grid gap-3 w-full">
                    <button onClick={handleResumeSession} className="bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-bold text-white shadow-lg">
                        Visszatérés a szobába
                    </button>
                    <button onClick={handleDeleteAndNew} className="bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 py-3 rounded-xl font-bold text-red-200">
                        Lezárás és Új szoba
                    </button>
                    <button onClick={() => { setPendingSession(null); setMode('menu'); }} className="text-white/40 text-sm mt-2 hover:text-white">
                        Vissza a menübe
                    </button>
                </div>
            </div>
        );
    }

    if (mode === 'spreadSelect') {
        return (
            <div className="max-w-5xl mx-auto animate-fade-in pb-20">
                <button onClick={() => setMode('menu')} className="mb-6 text-white/50 hover:text-white">&larr; Vissza</button>
                <h2 className="text-3xl font-serif font-bold text-center mb-8 text-gold-400">Válassz Kirakást a Szeánszhoz</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allSpreads.map(s => (
                        <div key={s.id} onClick={() => createRoom(s)} className="glass-panel p-6 rounded-2xl cursor-pointer hover:border-gold-500/50 hover:bg-white/10 transition-all group">
                            <h3 className="font-bold text-lg text-white mb-2">{s.name}</h3>
                            <p className="text-xs text-gray-400 mb-4 h-10 line-clamp-2">{s.description}</p>
                            <div className="text-xs font-bold text-gold-500 uppercase tracking-widest text-right group-hover:underline">Kiválasztás &rarr;</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (mode === 'menu') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-fade-in">
                <button onClick={onBack} className="absolute top-24 left-4 text-white/50 hover:text-white">&larr; Vissza</button>
                <h2 className="text-3xl font-serif font-bold mb-8">Közös Szeánsz (Távjóslás)</h2>
                <div className="grid gap-4 w-full max-w-md">
                    <button onClick={handleHostStart} className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-2xl font-bold text-xl shadow-lg hover:scale-105 transition-transform">
                        Szoba Létrehozása (Jós)
                    </button>
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <input 
                            value={inputRoomId}
                            onChange={e => setInputRoomId(e.target.value.toUpperCase())}
                            placeholder="SZOBA KÓD"
                            className="w-full bg-black/30 p-3 rounded-xl text-center text-xl font-mono mb-4 text-white uppercase border border-white/10 focus:border-gold-500 outline-none"
                        />
                        <button onClick={joinRoom} className="w-full bg-white/10 hover:bg-white/20 p-3 rounded-xl font-bold transition-colors">
                            Csatlakozás (Kérdező)
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (mode === 'room' && session) {
        const isHost = session.hostId === currentUser?.id;
        const positions = session.spreadPositions || [];
        
        // Grid logic
        const isFreeform = positions.some(p => p.x > 15 || p.y > 15);
        const maxX = isFreeform ? 0 : Math.max(...positions.map(p => p.x));
        const maxY = isFreeform ? 0 : Math.max(...positions.map(p => p.y));

        return (
            <div className="h-[calc(100vh-100px)] flex flex-col animate-fade-in relative">
                {/* Header */}
                <div className="flex justify-between items-center mb-4 px-2">
                    <button onClick={handleExitRoom} className="text-white/70 hover:text-red-400 text-sm font-bold flex items-center gap-1 bg-white/5 px-3 py-1 rounded-lg border border-white/10 transition-colors hover:bg-white/10">
                        <span>{isHost ? '🛑 Szoba Bezárása' : '🚪 Kilépés'}</span>
                    </button>
                    <div className="flex flex-col items-center">
                        <div className="bg-white/10 px-4 py-1 rounded-full font-mono font-bold text-gold-400 text-lg tracking-widest cursor-pointer hover:bg-white/20" onClick={() => {navigator.clipboard.writeText(roomId); alert('Kód másolva!')}}>
                            {roomId} 📋
                        </div>
                        <div className="text-[10px] uppercase text-white/40 mt-1">{session.spreadName}</div>
                    </div>
                    <button onClick={() => setIsChatOpen(!isChatOpen)} className={`md:hidden px-3 py-1 rounded relative ${isChatOpen ? 'bg-white/20' : 'bg-white/5'}`}>
                        💬
                        {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">{unreadCount}</span>}
                    </button>
                </div>

                <div className="flex flex-col md:flex-row flex-1 overflow-hidden gap-4 pb-20">
                    
                    {/* TABLE AREA */}
                    <div className="flex-1 bg-black/40 rounded-2xl border border-white/10 relative overflow-auto custom-scrollbar flex items-center justify-center p-8">
                        {isHost && <div className="absolute top-4 left-4 text-xs text-white/30 italic pointer-events-none">Kattints a helyre a kártya kiválasztásához</div>}
                        
                        {!isFreeform ? (
                            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${maxX}, 100px)`, gridTemplateRows: `repeat(${maxY}, 150px)` }}>
                                {positions.map(pos => {
                                    const drawn = session.drawnCards.find(c => c.positionId === pos.id);
                                    const cardData = drawn ? deck.find(c => c.id === drawn.cardId) : null;

                                    return (
                                        <div 
                                            key={pos.id} 
                                            onClick={() => handleSlotClick(pos.id)}
                                            style={{ gridColumn: pos.x, gridRow: pos.y, transform: `rotate(${pos.rotation || 0}deg)` }}
                                            className={`relative rounded-lg border-2 flex items-center justify-center transition-all ${isHost ? 'cursor-pointer hover:border-white/50' : ''} ${drawn ? 'border-transparent' : 'border-white/10 bg-white/5'}`}
                                        >
                                            {!drawn && (
                                                <div className="text-center p-2 pointer-events-none">
                                                    <div className="text-gold-500 font-bold text-sm mb-1">{pos.id}</div>
                                                    <div className="text-[9px] text-white/50 leading-tight">{pos.name}</div>
                                                </div>
                                            )}
                                            {drawn && cardData && (
                                                <div className="w-full h-full relative group">
                                                    <CardImage cardId={cardData.id} className={`w-full h-full object-cover rounded-lg shadow-xl ${drawn.reversed ? 'rotate-180' : ''}`} />
                                                    {isHost && (
                                                        <button 
                                                            onClick={(e) => removeCard(e, pos.id)}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            // Freeform support
                            <div className="relative w-full h-full min-w-[600px] min-h-[600px]">
                                {positions.map(pos => {
                                    const drawn = session.drawnCards.find(c => c.positionId === pos.id);
                                    const cardData = drawn ? deck.find(c => c.id === drawn.cardId) : null;
                                    return (
                                        <div 
                                            key={pos.id}
                                            onClick={() => handleSlotClick(pos.id)}
                                            className={`absolute w-[120px] h-[180px] rounded-lg border-2 flex items-center justify-center transition-all ${isHost ? 'cursor-pointer hover:border-white/50' : ''} ${drawn ? 'border-transparent' : 'border-white/10 bg-white/5'}`}
                                            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: `translate(-50%, -50%) rotate(${pos.rotation || 0}deg)` }}
                                        >
                                            {!drawn && (
                                                <div className="text-center pointer-events-none">
                                                    <div className="text-gold-500 font-bold">{pos.id}</div>
                                                    <div className="text-[10px] text-white/50">{pos.name}</div>
                                                </div>
                                            )}
                                            {drawn && cardData && (
                                                <div className="w-full h-full relative group">
                                                    <CardImage cardId={cardData.id} className={`w-full h-full object-cover rounded-lg shadow-xl ${drawn.reversed ? 'rotate-180' : ''}`} />
                                                    {isHost && (
                                                        <button onClick={(e) => removeCard(e, pos.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 z-10 opacity-0 group-hover:opacity-100">✕</button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* CHAT AREA */}
                    <div className={`
                        fixed inset-0 z-40 bg-[#0f172a] md:static md:w-80 md:bg-transparent md:flex flex-col 
                        glass-panel-dark md:border border-white/10 rounded-2xl overflow-hidden transition-transform duration-300
                        ${isChatOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0 hidden'}
                    `}>
                        <div className="p-3 bg-white/5 border-b border-white/10 flex justify-between items-center">
                            <span className="font-bold text-sm text-gold-400">Élő Csevegés</span>
                            <button onClick={() => setIsChatOpen(false)} className="md:hidden text-white/50">✕</button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-black/20">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex flex-col ${msg.sender === currentUser?.name ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${msg.sender === currentUser?.name ? 'bg-indigo-600 text-white' : 'bg-white/10 text-gray-200'}`}>
                                        {msg.text}
                                    </div>
                                    <span className="text-[9px] text-white/30 mt-1 px-1">{msg.sender}</span>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        <form onSubmit={sendMessage} className="p-3 border-t border-white/10 flex gap-2 bg-black/40">
                            <input 
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-gold-500 outline-none"
                                placeholder="Üzenet..."
                            />
                            <button type="submit" className="bg-gold-500 text-black px-3 py-2 rounded-lg font-bold text-xs hover:bg-gold-400">Küldés</button>
                        </form>
                    </div>
                </div>

                {/* CARD PICKER MODAL */}
                {isCardPickerOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setIsCardPickerOpen(false)}>
                        <div className="glass-panel-dark w-full max-w-4xl h-[80vh] rounded-3xl flex flex-col overflow-hidden border border-gold-500/30 shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="p-4 border-b border-white/10 flex flex-col md:flex-row gap-4 bg-white/5">
                                <input 
                                    autoFocus
                                    placeholder="Keresés kártya nevére..." 
                                    className="flex-1 bg-black/40 border border-white/20 rounded-xl p-3 text-white focus:border-gold-500 outline-none"
                                    value={cardSearch}
                                    onChange={e => setCardSearch(e.target.value)}
                                />
                                <label className={`flex items-center gap-3 px-4 py-2 rounded-xl cursor-pointer border ${isReversedSelection ? 'bg-red-900/40 border-red-500' : 'bg-white/5 border-white/10'}`}>
                                    <input type="checkbox" checked={isReversedSelection} onChange={e => setIsReversedSelection(e.target.checked)} className="accent-red-500" />
                                    <span className="text-sm font-bold text-white">Fordított</span>
                                </label>
                                <button onClick={() => setIsCardPickerOpen(false)} className="text-white/50 hover:text-white px-4">Bezárás</button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                    {filteredDeck.map(card => (
                                        <div key={card.id} onClick={() => selectCard(card.id)} className="cursor-pointer group">
                                            <div className="relative aspect-[2/3] rounded-lg overflow-hidden border border-white/10 group-hover:border-gold-500 transition-colors">
                                                <CardImage cardId={card.id} className={`w-full h-full object-cover transition-transform ${isReversedSelection ? 'rotate-180' : ''}`} />
                                            </div>
                                            <div className="text-center text-[10px] mt-1 text-gray-400 group-hover:text-white truncate">{card.name}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return <div className="p-10 text-center">Betöltés...</div>;
};
