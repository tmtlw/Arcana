import React, { useState } from 'react';
import { useTarot } from '../context/TarotContext';

// Icons
const Icons = {
  Bell: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
};

export const NotificationCenter = ({ navigateTo }: { navigateTo: (v: string, param?: string) => void }) => {
    const { notifications, unreadCount, markNotificationRead, markAllNotificationsRead } = useTarot();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-xl transition-all border relative ${isOpen ? 'bg-white/10 border-white/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
            >
                <Icons.Bell />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-pulse border border-black/50">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 mt-3 w-80 md:w-96 glass-panel-dark backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl z-[70] overflow-hidden animate-fade-in origin-top-right">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gold-400">Értesítések</h3>
                            {unreadCount > 0 && (
                                <button onClick={markAllNotificationsRead} className="text-[10px] text-white/40 hover:text-white underline">Összes olvasott</button>
                            )}
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-10 text-center text-white/20 italic text-sm">Nincsenek értesítéseid.</div>
                            ) : (
                                notifications.map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => { markNotificationRead(n.id); setIsOpen(false); if(n.type.includes('badge')) navigateTo('badges'); }}
                                        className={`p-4 border-b border-white/5 cursor-pointer transition-colors hover:bg-white/5 relative ${!n.isRead ? 'bg-gold-500/5' : ''}`}
                                    >
                                        {!n.isRead && <div className="absolute top-4 left-2 w-1.5 h-1.5 bg-gold-500 rounded-full"></div>}
                                        <div className="flex gap-3">
                                            <span className="text-xl">
                                                {n.type === 'badge_approved' ? '✨' : n.type === 'badge_rejected' ? '❌' : n.type === 'new_comment' ? '💬' : '🔔'}
                                            </span>
                                            <div>
                                                <div className="text-sm font-bold text-white mb-0.5">{n.title}</div>
                                                <p className="text-xs text-white/60 leading-relaxed">{n.message}</p>
                                                <div className="text-[9px] text-white/20 mt-2 font-mono">{new Date(n.createdAt).toLocaleString()}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-3 bg-black/20 text-center">
                            <button onClick={() => setIsOpen(false)} className="text-[10px] uppercase font-bold text-white/30 hover:text-white">Bezárás</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
