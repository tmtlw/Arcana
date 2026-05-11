import React, { useState, useMemo, useEffect } from 'react';
import { useTarot } from '../context/TarotContext';
import { THEMES, BADGES, AVATAR_GALLERY, CARD_BACKS, QUICK_ACTION_OPTIONS, MOODS, getAvatarUrl } from '../constants';
import { CardImage } from './CardImage'; 
import { ThemeType, CardBackType, Reading, User } from '../types';
import { t } from '../services/i18nService';
import { CommunityService } from '../services/communityService';
import { ReadingAnalysis } from './ReadingAnalysis';

interface ProfileViewProps {
    onBack: () => void;
    targetUserId?: string;
    onNavigate?: (view: string, param?: string) => void;
}

interface ThemeButtonProps {
    t: ThemeType;
    selected: boolean;
    onClick: () => void;
}

const ThemeButton: React.FC<ThemeButtonProps> = ({ t, selected, onClick }) => (
    <button 
        onClick={onClick}
        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${selected ? 'border-gold-500 bg-gold-500/10 shadow-lg scale-105' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
    >
        <div className={`w-full h-8 rounded-lg shadow-inner theme-preview-${t} bg-gray-800 relative overflow-hidden`}>
            {/* Simple preview logic */}
            <div className={`absolute inset-0 ${THEMES[t]?.bg || 'bg-slate-800'}`}></div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-white capitalize">{t}</span>
    </button>
);

export const ProfileView = ({ onBack, targetUserId }: ProfileViewProps) => {
    const { currentUser, updateUser, exportData, importData, availableDecks, language, setLanguage, logout, activeThemeKey, isDay, allSpreads, readings } = useTarot();
    const theme = THEMES[activeThemeKey] || THEMES['mystic']; 
    
    // State
    const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'appearance' | 'account'>('overview');
    const [viewedUser, setViewedUser] = useState<User | null>(null);
    const [publicReadings, setPublicReadings] = useState<Reading[]>([]);
    const [selectedReading, setSelectedReading] = useState<Reading | null>(null); // For detailed view
    
    // Local Edit States
    const [localName, setLocalName] = useState("");
    const [localRealName, setLocalRealName] = useState("");
    const [localBirthDate, setLocalBirthDate] = useState("");
    const [localBirthTime, setLocalBirthTime] = useState("");
    const [localBio, setLocalBio] = useState("");

    const isOwnProfile = !targetUserId || (currentUser && targetUserId === currentUser.id);

    useEffect(() => {
        if (isOwnProfile && currentUser) {
            setViewedUser(currentUser);
            setLocalName(currentUser.name);
            setLocalRealName(currentUser.realName || "");
            setLocalBirthDate(currentUser.birthDate || "");
            setLocalBirthTime(currentUser.birthTime || "12:00");
            setLocalBio(currentUser.bio || "");
            loadPublicReadings(currentUser.id);
        } else if (targetUserId) {
            loadPublicReadings(targetUserId);
            // Simulate user object or fetch if available in context/community service
            // For now minimal data is simulated if not fully loaded
            setViewedUser({ 
                id: targetUserId, name: "Látnok", themePreference: 'mystic', deckPreference: 'rider-waite', 
                avatarId: AVATAR_GALLERY[0], language: 'hu', badges: [], xp: 0, level: 1, soundEnabled: true, fontSize: 'normal' 
            });
        }
    }, [targetUserId, currentUser, isOwnProfile]);

    const loadPublicReadings = async (uid: string) => {
        const allPublic = await CommunityService.getPublicReadings(50);
        const userReadings = allPublic.filter(r => r.userId === uid);
        setPublicReadings(userReadings);
        
        if (!isOwnProfile && userReadings.length > 0) {
            setViewedUser(prev => prev ? {
                ...prev,
                name: userReadings[0].authorName || "Látnok",
                avatarId: userReadings[0].authorAvatar || AVATAR_GALLERY[0]
            } : null);
        }
    };

    const displayReadings = useMemo(() => {
        if (isOwnProfile) {
            // For owner, combine local readings (which include private)
            // We prioritize local 'readings' from context as it has everything for the user
            return readings.filter(r => r.userId === currentUser?.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        } else {
            return publicReadings;
        }
    }, [isOwnProfile, readings, publicReadings, currentUser]);

    const handleSaveProfile = () => {
        if (currentUser) {
            updateUser({
                ...currentUser,
                name: localName,
                realName: localRealName,
                birthDate: localBirthDate,
                birthTime: localBirthTime,
                bio: localBio
            });
            alert(t('profile.saved', language));
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (confirm("A betöltés felülírja a jelenlegi adataidat. Biztosan folytatod?")) {
                const success = await importData(file);
                if (success) {
                    alert("Sikeres betöltés! Az oldal újratöltődik.");
                    window.location.reload();
                } else {
                    alert("Hiba történt a betöltéskor.");
                }
            }
        }
    };

    const updateSetting = (key: keyof User, value: any) => {
        if (currentUser) updateUser({ ...currentUser, [key]: value });
    };

    const toggleQuickAction = (actionId: string) => {
        if (!currentUser) return;
        // Migration: Ensure 'stats' is converted to 'analysis' and invalid ones are filtered
        const raw = currentUser.quickActions || ['community', 'customSpread', 'astro', 'numerology', 'analysis', 'history'];
        const current = raw.map(id => id === 'stats' ? 'analysis' : id).filter(id => QUICK_ACTION_OPTIONS.some(opt => opt.id === id));

        let newActions;
        
        if (current.includes(actionId)) {
            newActions = current.filter(id => id !== actionId);
        } else {
            if (current.length >= 6) {
                alert("Maximum 6 menüpontot választhatsz ki!");
                return;
            }
            newActions = [...current, actionId];
        }
        updateSetting('quickActions', newActions);
    };

    const moveQuickAction = (index: number, direction: 'up' | 'down') => {
        if (!currentUser) return;
        const raw = currentUser.quickActions || ['community', 'customSpread', 'astro', 'numerology', 'analysis', 'history'];
        const current = raw.map(id => id === 'stats' ? 'analysis' : id).filter(id => QUICK_ACTION_OPTIONS.some(opt => opt.id === id));

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        
        if (newIndex >= 0 && newIndex < current.length) {
            const temp = current[index];
            current[index] = current[newIndex];
            current[newIndex] = temp;
            updateSetting('quickActions', current);
        }
    };

    const getTierColor = (tier?: string) => {
        switch(tier) {
            case 'gold': return 'border-yellow-400 bg-yellow-400/10 text-yellow-200';
            case 'silver': return 'border-gray-400 bg-gray-400/10 text-gray-200';
            case 'bronze': return 'border-orange-700 bg-orange-700/10 text-orange-200';
            default: return 'border-white/10 bg-white/5 text-gray-400';
        }
    };

    // Helper for Theme Options
    const themeOptions = (['mystic', 'nature', 'minimal', 'dark', 'retro', 'galaxy', 'ocean', 'royal', 'rose'] as ThemeType[]);

    if (!viewedUser) return <div className="p-10 text-center">Betöltés...</div>;

    const currentActions = (currentUser?.quickActions || ['community', 'customSpread', 'astro', 'numerology', 'analysis', 'history'])
        .map(id => id === 'stats' ? 'analysis' : id)
        .filter(id => QUICK_ACTION_OPTIONS.some(opt => opt.id === id));

    return (
        <div className="animate-fade-in max-w-6xl mx-auto pb-20 relative">
            <div className="flex justify-between items-center mb-6">
                <button onClick={onBack} className="flex items-center gap-2 font-bold text-white/60 hover:text-gold-400 transition-colors">
                    <span>&larr;</span> {t('profile.back', language)}
                </button>
            </div>

            {/* HERO SECTION */}
            <div className={`relative rounded-3xl shadow-2xl border border-white/10 ${theme.cardBg} mb-8 overflow-hidden`}>
                {/* Cover Background */}
                <div className={`absolute inset-0 h-40 ${THEMES[viewedUser.themePreference || 'mystic'].bg} opacity-80`}></div>
                <div className="absolute inset-0 h-40 bg-gradient-to-b from-transparent to-black/90"></div>
                
                <div className="relative z-10 px-8 pb-8 pt-20 flex flex-col md:flex-row items-end gap-6">
                    <div className="relative">
                        <img 
                            src={getAvatarUrl(viewedUser)} 
                            className="w-32 h-32 rounded-full bg-black mx-auto border-4 border-gold-500 shadow-2xl object-cover" 
                        />
                        <div className="absolute bottom-0 right-0 bg-gold-500 text-black font-bold text-xs px-2 py-1 rounded-full border-2 border-black">
                            Lvl {viewedUser.level || 1}
                        </div>
                    </div>
                    
                    <div className="flex-1 text-center md:text-left mb-2">
                        <h2 className="text-4xl font-serif font-bold text-white mb-2 shadow-black drop-shadow-md">{viewedUser.name}</h2>
                        {viewedUser.bio && <p className="text-white/80 italic max-w-lg text-sm">{viewedUser.bio}</p>}
                    </div>

                    <div className="flex gap-4">
                        <div className="text-center bg-black/40 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                            <div className="text-xl font-bold text-blue-300">{viewedUser.xp || 0}</div>
                            <div className="text-[10px] uppercase text-white/50 font-bold">XP</div>
                        </div>
                        <div className="text-center bg-black/40 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                            <div className="text-xl font-bold text-gold-400">{publicReadings.length}</div>
                            <div className="text-[10px] uppercase text-white/50 font-bold">Publikus</div>
                        </div>
                    </div>
                </div>
            </div>

            {isOwnProfile && (
                <div className="flex justify-center mb-8">
                    <div className="flex bg-black/30 p-1 rounded-xl border border-white/10 overflow-x-auto max-w-full">
                        {[
                            { id: 'overview', icon: '👤', label: 'Áttekintés' },
                            { id: 'settings', icon: '⚙️', label: 'Adatok' },
                            { id: 'appearance', icon: '🎨', label: 'Megjelenés' },
                            { id: 'account', icon: '💾', label: 'Fiók' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white/10 text-white shadow-lg border border-white/10' : 'text-white/40 hover:text-white'}`}
                            >
                                <span>{tab.icon}</span> <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="min-h-[400px]">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                        
                        {/* LEFT COLUMN: Badges only now */}
                        <div className="space-y-6">

                            <div className="glass-panel p-6 rounded-2xl border border-white/5">
                                <h3 className="font-bold text-white/60 text-xs uppercase tracking-widest mb-4">Megszerzett Jelvények</h3>
                                <div className="grid grid-cols-4 gap-3">
                                    {BADGES.filter(b => viewedUser.badges.includes(b.id)).map(b => (
                                        <div key={b.id} className={`aspect-square rounded-xl flex items-center justify-center text-3xl border shadow-lg ${getTierColor(b.tier)}`} title={b.name}>
                                            {b.icon}
                                        </div>
                                    ))}
                                    {viewedUser.badges.length === 0 && <div className="col-span-4 text-xs opacity-50 italic text-center py-4">Még nincsenek jelvények.</div>}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Readings Grid */}
                        <div className="lg:col-span-2">
                            <h3 className="font-serif font-bold text-xl text-white mb-6 flex items-center gap-2">
                                <span>📜</span> {isOwnProfile ? 'Összes Húzás' : 'Publikus Húzások'}
                            </h3>
                            {displayReadings.length === 0 ? (
                                <div className="text-center py-12 opacity-50 bg-white/5 rounded-2xl border border-dashed border-white/10">
                                    <div className="text-5xl mb-4">🎴</div>
                                    <p className="font-serif text-lg">Nincsenek megjeleníthető bejegyzések.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {displayReadings.map(reading => {
                                        const spread = allSpreads.find(s => s.id === reading.spreadId);
                                        return (
                                            <div
                                                key={reading.id}
                                                onClick={() => setSelectedReading(reading)}
                                                className="glass-panel rounded-2xl overflow-hidden border border-white/10 hover:border-gold-500/30 transition-all hover:shadow-xl group flex flex-col cursor-pointer"
                                            >
                                                {/* Header */}
                                                <div className="p-4 bg-black/20 border-b border-white/5 relative">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gold-500 bg-gold-500/10 px-2 py-1 rounded">
                                                            {spread?.name || 'Ismeretlen Kirakás'}
                                                        </span>
                                                        <span className="text-xs text-white/40">{new Date(reading.date).toLocaleDateString()}</span>
                                                    </div>
                                                    <h4 className="font-serif font-bold text-white text-lg leading-tight line-clamp-2 italic">
                                                        "{reading.question || 'Csendes húzás...'}"
                                                    </h4>
                                                    {isOwnProfile && !reading.isPublic && (
                                                        <div className="absolute top-2 right-2 text-xs" title="Privát">🔒</div>
                                                    )}
                                                </div>

                                                {/* Visual Preview of Cards */}
                                                <div className="p-4 flex-1 bg-gradient-to-b from-transparent to-black/20">
                                                    <div className="flex gap-2 justify-center items-end h-24 mb-2">
                                                        {reading.cards.slice(0, 3).map((c, i) => {
                                                            return (
                                                                <div key={i} className={`relative w-16 transition-transform hover:z-10 hover:scale-110 shadow-lg ${i===1 ? '-mb-2 z-10 scale-110' : 'opacity-80'}`} style={{ transform: c.isReversed ? 'rotate(180deg)' : 'none' }}>
                                                                    <div className="aspect-[2/3] rounded-lg overflow-hidden border border-white/20">
                                                                        <CardImage cardId={c.cardId} className="w-full h-full object-cover" />
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                        {reading.cards.length > 3 && (
                                                            <div className="text-xs text-white/40 ml-2 font-bold">+{reading.cards.length - 3}</div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Footer */}
                                                <div className="p-3 border-t border-white/5 flex justify-between items-center bg-black/40">
                                                    <div className="flex gap-2">
                                                        {reading.mood && (
                                                            <span className="text-lg" title={MOODS.find(m => m.id === reading.mood)?.label}>
                                                                {MOODS.find(m => m.id === reading.mood)?.icon || reading.mood}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gold-500 font-bold text-sm">✨ {reading.likes || 0}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && isOwnProfile && (
                    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
                        {/* PERSONAL DATA */}
                        <div className="glass-panel p-6 rounded-2xl border border-white/10">
                            <h3 className="font-serif font-bold text-lg text-gold-400 mb-6">Személyes Adatok</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-white/50 mb-1">Megjelenített Név</label>
                                    <input value={localName} onChange={e => setLocalName(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-gold-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-white/50 mb-1">Rövid Bemutatkozás (Bio)</label>
                                    <textarea value={localBio} onChange={e => setLocalBio(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-gold-500 outline-none resize-none h-20" placeholder="Írj magadról pár szót..." />
                                </div>
                                <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-xl mt-4">
                                    <label className="block text-sm font-bold mb-1 text-indigo-200">Valódi Teljes Név (Privát - Számmisztikához)</label>
                                    <div className="text-[10px] text-indigo-300/60 mb-2 italic">🔒 Ez az adat titkosított, csak a sorsszám számításához használjuk.</div>
                                    <input value={localRealName} onChange={e => setLocalRealName(e.target.value)} className="w-full bg-black/30 border border-indigo-500/30 rounded-xl p-3 text-white focus:border-indigo-400 outline-none" placeholder="Születési teljes név..." />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-white/50 mb-1">Születési Dátum</label>
                                        <input type="date" value={localBirthDate} onChange={e => setLocalBirthDate(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-gold-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-white/50 mb-1">Születési Idő</label>
                                        <input type="time" value={localBirthTime} onChange={e => setLocalBirthTime(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-gold-500 outline-none" />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <button onClick={handleSaveProfile} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition-all">Mentés</button>
                            </div>
                        </div>

                        {/* MENU CUSTOMIZATION - NEW */}
                        <div className="glass-panel p-6 rounded-2xl border border-white/10">
                            <h3 className="font-serif font-bold text-lg text-gold-400 mb-2">Gyorsmenü Testreszabása</h3>
                            <p className="text-xs text-white/50 mb-6">Válaszd ki azt a maximum 6 funkciót, amit a Főoldalon látni szeretnél, és állítsd be a sorrendet.</p>
                            
                            {/* Selected Order List */}
                            <div className="mb-8 space-y-2">
                                <label className="block text-[10px] uppercase font-bold text-gold-500/60 tracking-widest mb-3">Aktív Sorrend (Módosítás nyilakkal)</label>
                                <div className="flex flex-col gap-2">
                                    {currentActions.map((id, idx) => {
                                        const opt = QUICK_ACTION_OPTIONS.find(o => o.id === id);
                                        if(!opt) return null;
                                        return (
                                            <div key={id} className="flex items-center gap-3 bg-white/5 border border-white/10 p-2 rounded-xl">
                                                <span className="w-6 h-6 flex items-center justify-center bg-black/40 rounded-full text-[10px] font-bold text-gold-500">{idx + 1}</span>
                                                <span className="text-lg">{opt.icon}</span>
                                                <span className="flex-1 font-bold text-sm text-white">{opt.label}</span>
                                                <div className="flex gap-1">
                                                    <button 
                                                        onClick={() => moveQuickAction(idx, 'up')}
                                                        disabled={idx === 0}
                                                        className="w-8 h-8 rounded bg-white/5 flex items-center justify-center hover:bg-white/10 disabled:opacity-20"
                                                    >
                                                        ▲
                                                    </button>
                                                    <button 
                                                        onClick={() => moveQuickAction(idx, 'down')}
                                                        disabled={idx === currentActions.length - 1}
                                                        className="w-8 h-8 rounded bg-white/5 flex items-center justify-center hover:bg-white/10 disabled:opacity-20"
                                                    >
                                                        ▼
                                                    </button>
                                                    <button 
                                                        onClick={() => toggleQuickAction(id)}
                                                        className="w-8 h-8 rounded bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 ml-2"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {currentActions.length === 0 && <div className="text-center py-4 text-white/20 italic text-sm">Válassz elemeket az alábbi listából.</div>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {QUICK_ACTION_OPTIONS.map(opt => {
                                    const isSelected = currentActions.includes(opt.id);
                                    return (
                                        <button 
                                            key={opt.id} 
                                            onClick={() => toggleQuickAction(opt.id)}
                                            className={`p-3 rounded-lg border text-left flex items-center gap-2 transition-all ${isSelected ? 'bg-gold-500/10 border-gold-500 text-gold-200' : 'bg-white/5 border-white/10 text-gray-400 opacity-70 hover:opacity-100'}`}
                                        >
                                            <span>{opt.icon}</span>
                                            <span className="text-xs font-bold">{opt.label}</span>
                                            {isSelected && <span className="ml-auto text-gold-500 text-xs">✓</span>}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-2xl border border-white/10 flex justify-between items-center">
                            <span className="font-bold text-white">Nyelv / Language</span>
                            <div className="flex gap-2 bg-black/30 p-1 rounded-lg">
                                <button onClick={() => setLanguage('hu')} className={`px-4 py-1 rounded-md text-xs font-bold ${language === 'hu' ? 'bg-gold-500 text-black' : 'text-white/50'}`}>HU</button>
                                <button onClick={() => setLanguage('en')} className={`px-4 py-1 rounded-md text-xs font-bold ${language === 'en' ? 'bg-gold-500 text-black' : 'text-white/50'}`}>EN</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'appearance' && isOwnProfile && (
                    <div className="space-y-8 animate-fade-in">
                        {/* THEME SETTINGS - NEW */}
                        <div className="glass-panel p-6 rounded-2xl border border-white/10">
                            <h3 className="font-serif font-bold text-lg text-gold-400 mb-6">Téma Beállítások</h3>
                            
                            {/* Auto Toggle */}
                            <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10 mb-6">
                                <div>
                                    <div className="font-bold text-white text-sm">Automatikus Napszak Téma</div>
                                    <div className="text-xs text-white/50">Váltás a napkelte és napnyugta alapján ({isDay ? 'Most: Nappal' : 'Most: Éjszaka'})</div>
                                </div>
                                <button 
                                    onClick={() => updateSetting('autoThemeEnabled', !currentUser?.autoThemeEnabled)}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors ${currentUser?.autoThemeEnabled ? 'bg-gold-500' : 'bg-gray-600'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${currentUser?.autoThemeEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </button>
                            </div>

                            {currentUser?.autoThemeEnabled ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                        <h4 className="text-xs font-bold uppercase text-yellow-300 mb-4 flex items-center gap-2">☀️ Nappali Téma</h4>
                                        <div className="grid grid-cols-3 gap-2">
                                            {themeOptions.map(tk => (
                                                <ThemeButton 
                                                    key={tk} t={tk} 
                                                    selected={currentUser?.dayTheme === tk} 
                                                    onClick={() => updateSetting('dayTheme', tk)} 
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-black/30 p-4 rounded-xl border border-white/10">
                                        <h4 className="text-xs font-bold uppercase text-blue-300 mb-4 flex items-center gap-2">🌙 Esti Téma</h4>
                                        <div className="grid grid-cols-3 gap-2">
                                            {themeOptions.map(tk => (
                                                <ThemeButton 
                                                    key={tk} t={tk} 
                                                    selected={currentUser?.nightTheme === tk} 
                                                    onClick={() => updateSetting('nightTheme', tk)} 
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <h4 className="text-xs font-bold uppercase text-white/50 mb-4">Fix Téma Választása</h4>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                        {themeOptions.map(tk => (
                                            <ThemeButton 
                                                key={tk} t={tk} 
                                                selected={currentUser?.themePreference === tk} 
                                                onClick={() => updateSetting('themePreference', tk)} 
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="glass-panel p-6 rounded-2xl border border-white/10">
                            <h3 className="font-serif font-bold text-lg text-gold-400 mb-6">Kártya Pakli</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {availableDecks.map(deck => (
                                    <button
                                        key={deck.id}
                                        onClick={() => updateSetting('deckPreference', deck.id)}
                                        className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden group flex gap-4 ${currentUser?.deckPreference === deck.id ? 'border-gold-500 bg-gold-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                                    >
                                        <div className="w-12 h-16 bg-black/50 rounded flex items-center justify-center text-2xl border border-white/10">🎴</div>
                                        <div>
                                            <div className={`font-serif font-bold ${currentUser?.deckPreference === deck.id ? 'text-gold-400' : 'text-white'}`}>{deck.name}</div>
                                            <div className="text-xs opacity-60 mt-1">{deck.description}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* SENTIMENT VISUAL SETTINGS */}
                        <div className="glass-panel p-6 rounded-2xl border border-white/10">
                            <h3 className="font-serif font-bold text-lg text-gold-400 mb-2">Kártya Megítélés Jelzése</h3>
                            <p className="text-xs text-white/50 mb-6">Állítsd be, hogyan jelenjenek meg a pozitív/negatív jelzések a kártyák szegélyén.</p>

                            <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10 mb-6">
                                <div>
                                    <div className="font-bold text-white text-sm">Szegély Megjelenítése</div>
                                    <div className="text-xs text-white/50">Színes keret a kártyák körül a galériában és húzásoknál</div>
                                </div>
                                <button
                                    onClick={() => updateSetting('sentimentSettings', { ...(currentUser?.sentimentSettings || { posColor: '#4ade80', neuColor: '#9ca3af', negColor: '#f87171', borderThickness: 1, enabled: true }), enabled: !currentUser?.sentimentSettings?.enabled })}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors ${currentUser?.sentimentSettings?.enabled !== false ? 'bg-gold-500' : 'bg-gray-600'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${currentUser?.sentimentSettings?.enabled !== false ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm text-white/70">Vastagság: {currentUser?.sentimentSettings?.borderThickness || 1}px</label>
                                        <input
                                            type="range" min="1" max="5"
                                            value={currentUser?.sentimentSettings?.borderThickness || 1}
                                            onChange={e => updateSetting('sentimentSettings', { ...(currentUser?.sentimentSettings || { posColor: '#4ade80', neuColor: '#9ca3af', negColor: '#f87171', borderThickness: 1, enabled: true }), borderThickness: parseInt(e.target.value) })}
                                            className="w-32 accent-gold-500"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm text-white/70">Pozitív Szín</label>
                                        <input
                                            type="color"
                                            value={currentUser?.sentimentSettings?.posColor || '#4ade80'}
                                            onChange={e => updateSetting('sentimentSettings', { ...(currentUser?.sentimentSettings || { posColor: '#4ade80', neuColor: '#9ca3af', negColor: '#f87171', borderThickness: 1, enabled: true }), posColor: e.target.value })}
                                            className="w-10 h-10 rounded cursor-pointer border-none bg-transparent"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm text-white/70">Semleges Szín</label>
                                        <input
                                            type="color"
                                            value={currentUser?.sentimentSettings?.neuColor || '#9ca3af'}
                                            onChange={e => updateSetting('sentimentSettings', { ...(currentUser?.sentimentSettings || { posColor: '#4ade80', neuColor: '#9ca3af', negColor: '#f87171', borderThickness: 1, enabled: true }), neuColor: e.target.value })}
                                            className="w-10 h-10 rounded cursor-pointer border-none bg-transparent"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm text-white/70">Negatív Szín</label>
                                        <input
                                            type="color"
                                            value={currentUser?.sentimentSettings?.negColor || '#f87171'}
                                            onChange={e => updateSetting('sentimentSettings', { ...(currentUser?.sentimentSettings || { posColor: '#4ade80', neuColor: '#9ca3af', negColor: '#f87171', borderThickness: 1, enabled: true }), negColor: e.target.value })}
                                            className="w-10 h-10 rounded cursor-pointer border-none bg-transparent"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col items-center justify-center bg-black/40 rounded-2xl p-6 border border-white/5">
                                    <div className="text-[10px] uppercase font-bold text-white/30 mb-4 tracking-widest">Élő Előnézet</div>
                                    <div className="flex gap-4">
                                        {['pos', 'neu', 'neg'].map(s => (
                                            <div key={s} className="flex flex-col items-center gap-2">
                                                <div
                                                    className="w-16 h-24 bg-gray-800 rounded-lg shadow-xl flex items-center justify-center text-2xl"
                                                    style={{
                                                        border: `${currentUser?.sentimentSettings?.enabled !== false ? (currentUser?.sentimentSettings?.borderThickness || 1) : 0}px solid ${
                                                            s === 'pos' ? (currentUser?.sentimentSettings?.posColor || '#4ade80') :
                                                            s === 'neg' ? (currentUser?.sentimentSettings?.negColor || '#f87171') :
                                                            (currentUser?.sentimentSettings?.neuColor || '#9ca3af')
                                                        }`
                                                    }}
                                                >
                                                    {s === 'pos' ? '🙂' : s === 'neg' ? '🙁' : '😐'}
                                                </div>
                                                <span className="text-[9px] uppercase font-bold text-white/40">{s}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="glass-panel p-6 rounded-2xl border border-white/10">
                            <h3 className="font-serif font-bold text-lg text-gold-400 mb-6">Kártya Hátlap</h3>
                            <div className="grid grid-cols-4 gap-4">
                                {(Object.keys(CARD_BACKS) as CardBackType[]).map(key => (
                                    <button 
                                        key={key}
                                        onClick={() => updateSetting('cardBackPreference', key)}
                                        className={`aspect-[2/3] rounded-lg transition-all relative group ${currentUser?.cardBackPreference === key ? 'ring-2 ring-gold-500 scale-105' : 'opacity-70 hover:opacity-100'}`}
                                    >
                                        <div className={`w-full h-full rounded-lg ${CARD_BACKS[key]} shadow-lg`}></div>
                                        <div className="text-[10px] text-center mt-2 uppercase font-bold text-white group-hover:text-gold-400">{key}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="glass-panel p-6 rounded-2xl border border-white/10">
                            <h3 className="font-serif font-bold text-lg text-gold-400 mb-6">Avatár</h3>
                            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                                {AVATAR_GALLERY.map((url, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => updateSetting('avatarId', url)}
                                        className={`w-16 h-16 flex-shrink-0 rounded-full overflow-hidden border-2 transition-all hover:scale-110 ${currentUser?.avatarId === url ? 'border-gold-500 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                    >
                                        <img src={url} className="w-full h-full object-cover" loading="lazy" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'account' && isOwnProfile && (
                    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
                        <div className="glass-panel p-6 rounded-2xl border border-white/10">
                            <h3 className="font-serif font-bold text-lg text-gold-400 mb-6">Adatkezelés</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={exportData} className="bg-white/10 border border-white/20 text-white py-4 rounded-xl font-bold hover:bg-white/20 transition-colors flex flex-col items-center gap-2">
                                    <span className="text-2xl">📦</span> Mentés Fájlba
                                </button>
                                <label className="bg-indigo-600/80 border border-indigo-500 text-white py-4 rounded-xl font-bold hover:bg-indigo-600 text-center cursor-pointer transition-colors shadow-lg flex flex-col items-center gap-2">
                                    <span className="text-2xl">📂</span> Betöltés Fájlból
                                    <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                                </label>
                            </div>
                        </div>
                        
                        <button onClick={logout} className="w-full py-4 bg-red-500/20 hover:bg-red-500/40 text-red-200 border border-red-500/30 rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                            <span>🚪</span> Kijelentkezés
                        </button>
                    </div>
                )}
            </div>

            {selectedReading && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md overflow-y-auto custom-scrollbar animate-fade-in flex flex-col">
                    <div className="p-4 md:p-8 flex-1">
                        <ReadingAnalysis reading={selectedReading} onClose={() => setSelectedReading(null)} />
                    </div>
                </div>
            )}
        </div>
    );
};
