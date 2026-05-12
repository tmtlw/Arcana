import React, { useState, useMemo, useEffect } from 'react';
import { useTarot } from '../context/TarotContext';
import { THEMES, BADGES, AVATAR_GALLERY, CARD_BACKS, QUICK_ACTION_OPTIONS, MOODS, getAvatarUrl, FULL_DECK } from '../constants';
import { CardImage } from './CardImage'; 
import { ThemeType, CardBackType, Reading, User, Card } from '../types';
import { t } from '../services/i18nService';
import { CommunityService } from '../services/communityService';
import { ReadingAnalysis } from './ReadingAnalysis';
import { useAnalytics } from '../services/analyticsHook';
import { NumerologyService } from '../services/numerologyService';
import { HistoryHeatmap } from './HistoryHeatmap';

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
    const [localMantra, setLocalMantra] = useState("");
    const [showAltarPicker, setShowAltarPicker] = useState(false);
    const [showAuraInfo, setShowAuraInfo] = useState(false);
    const [showDiscoveryGallery, setShowDiscoveryGallery] = useState(false);

    const PROTECTION_SYMBOLS = [
        { id: 'none', icon: '❌', name: 'Nincs' },
        { id: 'ankh', icon: '☥', name: 'Ankh' },
        { id: 'om', icon: '🕉️', name: 'Om' },
        { id: 'flower_of_life', icon: '🌼', name: 'Élet Virága' },
        { id: 'pentagram', icon: '⛧', name: 'Pentagram' },
        { id: 'eye_of_horus', icon: '👁️', name: 'Hórusz Szeme' }
    ];

    const isOwnProfile = !targetUserId || (currentUser && targetUserId === currentUser.id);

    // Analytics
    const userReadings = useMemo(() => readings.filter(r => r.userId === (targetUserId || currentUser?.id)), [readings, targetUserId, currentUser]);
    const stats = useAnalytics(userReadings, targetUserId || currentUser?.id, viewedUser?.birthDate, currentUser?.cardSentiments);

    useEffect(() => {
        if (isOwnProfile && currentUser) {
            setViewedUser(currentUser);
            setLocalName(currentUser.name);
            setLocalRealName(currentUser.realName || "");
            setLocalBirthDate(currentUser.birthDate || "");
            setLocalBirthTime(currentUser.birthTime || "12:00");
            setLocalBio(currentUser.bio || "");
            setLocalMantra(currentUser.mantra || "");
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
                bio: localBio,
                mantra: localMantra
            });
            alert(t('profile.saved', language));
        }
    };

    const toggleAltarCard = (cardId: string) => {
        if (!currentUser) return;
        const currentAltar = currentUser.altarCards || [];
        let nextAltar;
        if (currentAltar.includes(cardId)) {
            nextAltar = currentAltar.filter(id => id !== cardId);
        } else {
            if (currentAltar.length >= 3) {
                alert("Maximum 3 kártyát tehetsz az oltárodra!");
                return;
            }
            nextAltar = [...currentAltar, cardId];
        }
        updateSetting('altarCards', nextAltar);
    };

    const getRank = (xp: number) => {
        if (xp >= 5000) return { title: 'Mágus', icon: '🧙‍♂️', color: 'text-purple-400' };
        if (xp >= 2000) return { title: 'Főpapnő', icon: '✨', color: 'text-gold-400' };
        if (xp >= 500) return { title: 'Beavatott', icon: '👁️', color: 'text-blue-400' };
        if (xp >= 100) return { title: 'Novícius', icon: '📜', color: 'text-green-400' };
        return { title: 'Kereső', icon: '🔍', color: 'text-gray-400' };
    };

    const auraColor = useMemo(() => {
        const last7Days = userReadings.filter(r => {
            const diff = Date.now() - new Date(r.date).getTime();
            return diff < 7 * 24 * 60 * 60 * 1000;
        });

        const counts: Record<string, number> = { Major: 0, Tűz: 0, Víz: 0, Levegő: 0, Föld: 0 };
        last7Days.forEach(r => {
            r.cards.forEach(c => {
                const card = FULL_DECK.find(d => d.id === c.cardId);
                if (card) {
                    if (card.arcana === 'Major') counts.Major++;
                    else if (card.element) counts[card.element]++;
                }
            });
        });

        const winner = Object.entries(counts).sort((a,b) => b[1] - a[1])[0];
        if (!winner || winner[1] === 0) return 'rgba(255,255,255,0.2)';

        switch(winner[0]) {
            case 'Major': return 'rgba(212, 175, 55, 0.6)'; // Gold
            case 'Tűz': return 'rgba(239, 68, 68, 0.6)'; // Red
            case 'Víz': return 'rgba(59, 130, 246, 0.6)'; // Blue
            case 'Levegő': return 'rgba(234, 179, 8, 0.6)'; // Yellow
            case 'Föld': return 'rgba(34, 197, 94, 0.6)'; // Green
            default: return 'rgba(255,255,255,0.2)';
        }
    }, [userReadings]);

    const lifePath = viewedUser?.birthDate ? NumerologyService.calculateLifePath(viewedUser.birthDate) : null;
    const lifePathCard = lifePath ? NumerologyService.getTarotCardForNumber(lifePath, FULL_DECK) : null;

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
                <div className={`absolute inset-0 h-48 ${THEMES[viewedUser.themePreference || 'mystic'].bg} opacity-80`}></div>
                <div className="absolute inset-0 h-48 bg-gradient-to-b from-transparent via-black/20 to-black/90"></div>
                
                <div className="relative z-10 px-6 pb-8 pt-24 flex flex-col md:flex-row items-center md:items-end gap-6">
                    <div className="relative group">
                        {/* Aura Effect */}
                        <div
                            className="absolute inset-0 rounded-full blur-2xl opacity-50 animate-pulse transition-colors duration-1000 cursor-help"
                            style={{ backgroundColor: auraColor }}
                            onClick={() => setShowAuraInfo(true)}
                        ></div>

                        {viewedUser.protectionSymbol && viewedUser.protectionSymbol !== 'none' && (
                            <div className="absolute -top-2 -left-2 z-20 bg-black/60 backdrop-blur-md w-10 h-10 rounded-full border border-gold-500/50 flex items-center justify-center text-xl shadow-lg animate-float">
                                {PROTECTION_SYMBOLS.find(s => s.id === viewedUser.protectionSymbol)?.icon}
                            </div>
                        )}

                        <img 
                            src={getAvatarUrl(viewedUser)} 
                            className="w-32 h-32 rounded-full bg-black relative z-10 border-4 border-gold-500 shadow-2xl object-cover transition-transform group-hover:scale-105"
                            onClick={() => setShowAuraInfo(true)}
                        />
                        <div className="absolute bottom-0 right-0 z-20 bg-gold-500 text-black font-bold text-xs px-2 py-1 rounded-full border-2 border-black shadow-lg">
                            Lvl {viewedUser.level || 1}
                        </div>
                    </div>
                    
                    <div className="flex-1 text-center md:text-left mb-2 z-10">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                            <h2 className="text-4xl font-serif font-bold text-white shadow-black drop-shadow-md">{viewedUser.name}</h2>
                            <div className={`px-3 py-1 rounded-full bg-black/40 border border-white/10 text-xs font-bold flex items-center gap-1 ${getRank(viewedUser.xp || 0).color}`}>
                                <span>{getRank(viewedUser.xp || 0).icon}</span>
                                <span>{getRank(viewedUser.xp || 0).title}</span>
                            </div>
                        </div>
                        {viewedUser.mantra && (
                            <div className="mb-3 inline-block px-4 py-1 rounded-lg bg-gold-500/10 border border-gold-500/20 italic text-gold-200 text-sm animate-pulse">
                                " {viewedUser.mantra} "
                            </div>
                        )}
                        {viewedUser.bio && <p className="text-white/80 italic max-w-lg text-sm line-clamp-2">{viewedUser.bio}</p>}
                    </div>

                    <div className="flex gap-4 z-10">
                        <div className="text-center bg-black/60 p-3 rounded-xl border border-white/10 backdrop-blur-md min-w-[70px]">
                            <div className="text-xl font-bold text-blue-300">{viewedUser.xp || 0}</div>
                            <div className="text-[10px] uppercase text-white/50 font-bold">XP</div>
                        </div>
                        <div className="text-center bg-black/60 p-3 rounded-xl border border-white/10 backdrop-blur-md min-w-[70px]">
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

            {showDiscoveryGallery && (
                <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
                    <div className="glass-panel w-full max-w-5xl max-h-[90vh] rounded-3xl border border-gold-500/30 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gold-500/10">
                            <div>
                                <h3 className="text-2xl font-serif font-bold text-gold-400">Felfedezett Lapok</h3>
                                <p className="text-xs text-white/40">A gyűjteményed eddig {stats.discoveryProgress.discovered} lapot tartalmaz a 78-ból.</p>
                            </div>
                            <button onClick={() => setShowDiscoveryGallery(false)} className="text-white/60 hover:text-white text-2xl">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                                {FULL_DECK.map(card => {
                                    const isDiscovered = (stats.cardCounts[card.id] || 0) > 0;
                                    return (
                                        <div key={card.id} className="flex flex-col gap-1 items-center">
                                            <div className={`aspect-[2/3] w-full rounded-lg border transition-all ${isDiscovered ? 'border-gold-500/50 shadow-lg' : 'border-white/5 opacity-20 grayscale'}`}>
                                                {isDiscovered ? <CardImage cardId={card.id} className="w-full h-full object-cover rounded-lg" /> : <div className="w-full h-full bg-white/5 rounded-lg"></div>}
                                            </div>
                                            <span className={`text-[8px] text-center truncate w-full ${isDiscovered ? 'text-white/80 font-bold' : 'text-white/20'}`}>
                                                {isDiscovered ? card.name : '???'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="p-6 border-t border-white/10 flex justify-center">
                            <button onClick={() => setShowDiscoveryGallery(false)} className="bg-gold-500 text-black px-10 py-2 rounded-full font-bold shadow-lg">Bezárás</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="min-h-[400px]">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                        
                        {/* LEFT COLUMN: Stats & Tools */}
                        <div className="space-y-6">

                            {/* INNER PEACE INDEX */}
                            <div className="glass-panel p-6 rounded-2xl border border-teal-500/20 bg-gradient-to-br from-teal-900/10 to-transparent">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-teal-300 text-xs uppercase tracking-widest">Belső Béke Index</h3>
                                    <span className="text-2xl">⚖️</span>
                                </div>
                                <div className="flex items-end gap-2 mb-2">
                                    <span className="text-4xl font-bold text-white">{stats.innerPeaceIndex}%</span>
                                    <span className="text-xs text-white/40 pb-1">mentális egyensúly</span>
                                </div>
                                <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-white/5 p-0.5">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-teal-600 to-teal-400 transition-all duration-1000 shadow-[0_0_10px_rgba(45,212,191,0.5)]"
                                        style={{ width: `${stats.innerPeaceIndex}%` }}
                                    ></div>
                                </div>
                                <p className="text-[10px] text-white/50 mt-4 leading-relaxed italic">
                                    A kártyák energiái és a hangulatnaplód alapján számított spirituális rezgésszinted.
                                </p>
                            </div>

                            {/* TOTEM ANIMAL */}
                            <div className="glass-panel p-6 rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-900/10 to-transparent overflow-hidden relative">
                                <div className="absolute -right-4 -bottom-4 text-8xl opacity-10 grayscale">{stats.totemAnimal.icon}</div>
                                <h3 className="font-bold text-orange-300 text-xs uppercase tracking-widest mb-4">Szellemállat Guide</h3>
                                <div className="flex gap-4 items-center relative z-10">
                                    <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-4xl shadow-inner">
                                        {stats.totemAnimal.icon}
                                    </div>
                                    <div>
                                        <div className="text-xl font-bold text-white">{stats.totemAnimal.name}</div>
                                        <p className="text-[10px] text-orange-200/70 leading-tight mt-1">
                                            {stats.totemAnimal.description}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* DIGITAL ALTAR */}
                            <div className="glass-panel p-6 rounded-2xl border border-gold-500/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <span className="text-6xl">🕯️</span>
                                </div>
                                <h3 className="font-bold text-gold-400 text-xs uppercase tracking-widest mb-6 flex items-center justify-between">
                                    Digitális Oltár
                                    {isOwnProfile && <button onClick={() => setShowAltarPicker(true)} className="text-[10px] bg-white/10 px-2 py-1 rounded hover:bg-white/20 transition-colors">Szerkesztés</button>}
                                </h3>
                                <div className="flex justify-center gap-3">
                                    {[0, 1, 2].map(idx => {
                                        const cardId = viewedUser.altarCards?.[idx];
                                        return (
                                            <div key={idx} className="w-1/3 aspect-[2/3] rounded-lg border border-white/10 bg-black/40 flex items-center justify-center relative group overflow-hidden shadow-2xl">
                                                {cardId ? (
                                                    <CardImage cardId={cardId} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                                ) : (
                                                    <span className="text-2xl opacity-20">🎴</span>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* NUMEROLOGY CARD */}
                            {lifePath && (
                                <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-900/10 to-transparent">
                                    <h3 className="font-bold text-indigo-300 text-xs uppercase tracking-widest mb-4">Személyes Archetípusok</h3>
                                    <div className="space-y-6">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-20 aspect-[2/3] rounded-lg border border-indigo-500/30 overflow-hidden shadow-lg flex-shrink-0">
                                                {lifePathCard ? <CardImage cardId={lifePathCard.id} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-indigo-900/40"></div>}
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-white mb-1">Sorsút {lifePath}</div>
                                                <div className="text-sm font-serif text-indigo-200 italic mb-2">{lifePathCard?.name || 'Ismeretlen'}</div>
                                                <p className="text-[10px] text-white/50 leading-relaxed">
                                                    Az életed fő irányvonala és karmikus tanításai.
                                                </p>
                                            </div>
                                        </div>

                                        {stats.personalYear > 0 && (
                                            <div className="pt-4 border-t border-white/5 flex gap-4 items-center">
                                                <div className="w-16 aspect-[2/3] rounded-lg border border-indigo-500/20 overflow-hidden opacity-80 flex-shrink-0">
                                                    {NumerologyService.getTarotCardForNumber(stats.personalYear, FULL_DECK) ?
                                                        <CardImage cardId={NumerologyService.getTarotCardForNumber(stats.personalYear, FULL_DECK)!.id} className="w-full h-full object-cover" /> :
                                                        <div className="w-full h-full bg-indigo-900/20"></div>
                                                    }
                                                </div>
                                                <div>
                                                    <div className="text-lg font-bold text-indigo-200">Személyes Év: {stats.personalYear}</div>
                                                    <div className="text-[10px] text-white/40">
                                                        Az idei éved ({new Date().getFullYear()}) fókusza és energiája.
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ANALYTICS PREVIEW */}
                            <div className="glass-panel p-6 rounded-2xl border border-white/5">
                                <h3 className="font-bold text-white/60 text-xs uppercase tracking-widest mb-6">Spirituális Analitika</h3>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-2 mb-4">
                                        <div className="bg-white/5 rounded-xl p-2 text-center border border-white/5">
                                            <div className="text-lg font-bold text-white">{stats.diaryStats.favorites}</div>
                                            <div className="text-[8px] uppercase text-white/30">Kedvenc</div>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-2 text-center border border-white/5">
                                            <div className="text-lg font-bold text-green-400">{stats.diaryStats.fulfilled}</div>
                                            <div className="text-[8px] uppercase text-white/30">Beteljesült</div>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-2 text-center border border-white/5">
                                            <div className="text-lg font-bold text-blue-400">{stats.diaryStats.notesCount}</div>
                                            <div className="text-[8px] uppercase text-white/30">Jegyzet</div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-white/40">Összes Húzás</span>
                                        <span className="text-white font-bold">{stats.totalReadings}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm group cursor-pointer" onClick={() => setShowDiscoveryGallery(true)}>
                                        <span className="text-white/40 group-hover:text-gold-400 transition-colors">Felfedezett Lapok</span>
                                        <span className="text-white font-bold">{stats.discoveryProgress.discovered} / 78</span>
                                    </div>
                                    <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5 cursor-pointer" onClick={() => setShowDiscoveryGallery(true)}>
                                        <div className="h-full bg-gold-500 transition-all duration-1000" style={{ width: `${(stats.discoveryProgress.discovered / 78) * 100}%` }}></div>
                                    </div>

                                    <div className="pt-4 border-t border-white/5">
                                        <span className="text-[10px] text-white/30 uppercase font-bold block mb-3">Domináns Elemed</span>
                                        <div className="grid grid-cols-4 gap-2">
                                            {Object.entries(stats.elements).map(([el, count]) => {
                                                const total = Object.values(stats.elements).reduce((a,b) => a+b, 0) || 1;
                                                const pct = Math.round((count / total) * 100);
                                                return (
                                                    <div key={el} className="flex flex-col items-center gap-1">
                                                        <div className="w-full h-12 bg-black/20 rounded-lg flex flex-col items-end justify-end p-1 relative overflow-hidden border border-white/5">
                                                            <div className={`absolute bottom-0 left-0 w-full bg-current opacity-20`} style={{ height: `${pct}%`, color: el === 'Tűz' ? '#ef4444' : el === 'Víz' ? '#3b82f6' : el === 'Levegő' ? '#eab308' : '#22c55e' }}></div>
                                                            <span className="text-[10px] font-bold text-white relative z-10">{pct}%</span>
                                                        </div>
                                                        <span className="text-[8px] text-white/40 uppercase">{el}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {stats.favMoon && (
                                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                            <span className="text-[10px] text-white/30 uppercase font-bold">Hold-affinitás</span>
                                            <div className="flex items-center gap-2 bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20">
                                                <span className="text-blue-300 font-bold text-xs">{stats.favMoon.name}</span>
                                                <span className="text-[10px] text-blue-300/60">({stats.favMoon.count}x)</span>
                                            </div>
                                        </div>
                                    )}

                                    {stats.zodiacDominance.length > 0 && (
                                        <div className="pt-4 border-t border-white/5">
                                            <span className="text-[10px] text-white/30 uppercase font-bold block mb-3">Zodiákus Dominancia</span>
                                            <div className="space-y-2">
                                                {stats.zodiacDominance.map((z, idx) => {
                                                    const max = stats.zodiacDominance[0].count;
                                                    const pct = (z.count / max) * 100;
                                                    return (
                                                        <div key={z.name} className="flex items-center gap-2">
                                                            <span className="text-[10px] text-white/60 w-16 truncate">{z.name}</span>
                                                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                                <div className="h-full bg-indigo-500/50" style={{ width: `${pct}%` }}></div>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-white/40">{z.count}</span>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {stats.dominantMood && (
                                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                            <span className="text-[10px] text-white/30 uppercase font-bold">Domináns Hangulat</span>
                                            <div className="flex items-center gap-2 bg-purple-500/10 px-2 py-1 rounded-lg border border-purple-500/20">
                                                <span className="text-xl">{stats.dominantMood.icon}</span>
                                                <span className="text-purple-200 font-bold text-xs">{stats.dominantMood.label}</span>
                                            </div>
                                        </div>
                                    )}

                                    {stats.sortedCards.length > 0 && (
                                        <div className="pt-4 border-t border-white/5">
                                            <span className="text-[10px] text-white/30 uppercase font-bold block mb-3">Aki üldöz (Stalker Card)</span>
                                            <div className="flex items-center gap-4 bg-black/20 p-3 rounded-xl border border-white/5">
                                                <div className="w-12 aspect-[2/3] rounded border border-white/10 overflow-hidden">
                                                    {stats.sortedCards[0].card && <CardImage cardId={stats.sortedCards[0].card.id} className="w-full h-full object-cover" />}
                                                </div>
                                                <div>
                                                    <div className="text-xs font-bold text-white">{stats.sortedCards[0].card?.name}</div>
                                                    <div className="text-[10px] text-gold-500">{stats.sortedCards[0].count} alkalommal megjelent</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* HEATMAP */}
                            <HistoryHeatmap readings={userReadings} onSelectReading={setSelectedReading} />

                            {/* BADGES */}
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
                        <div className="lg:col-span-2 space-y-8">

                            {/* MAGICAL REVIEW / ANNIVERSARY */}
                            {isOwnProfile && stats.anniversaryReadings.length > 0 && (
                                <div className="glass-panel p-6 rounded-2xl border border-gold-500/30 bg-gradient-to-r from-gold-900/20 to-transparent">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-gold-500/20 flex items-center justify-center text-xl shadow-lg border border-gold-500/30">✨</div>
                                        <div>
                                            <h3 className="text-xl font-serif font-bold text-gold-400">Mágikus Visszapillantó</h3>
                                            <p className="text-xs text-white/40">Pontosan ezen a napon történt korábban...</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                                        {stats.anniversaryReadings.map(r => (
                                            <div
                                                key={r.id}
                                                onClick={() => setSelectedReading(r)}
                                                className="flex-shrink-0 w-64 bg-black/40 border border-white/10 rounded-xl p-4 hover:border-gold-500/50 transition-all cursor-pointer group"
                                            >
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[10px] font-bold text-gold-500">{new Date(r.date).getFullYear()}</span>
                                                    <span className="text-[10px] text-white/30">#{r.id.substring(0,4)}</span>
                                                </div>
                                                <p className="text-sm italic text-white/80 line-clamp-2 mb-3">"{r.question || 'Csendes húzás'}"</p>
                                                <div className="flex -space-x-2">
                                                    {r.cards.slice(0, 3).map((c, i) => (
                                                        <div key={i} className="w-8 aspect-[2/3] rounded border border-white/20 overflow-hidden shadow-lg group-hover:scale-110 transition-transform">
                                                            <CardImage cardId={c.cardId} className="w-full h-full object-cover" />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

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
                                <div>
                                    <label className="block text-xs font-bold text-white/50 mb-1">Személyes Mantra</label>
                                    <input value={localMantra} onChange={e => setLocalMantra(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-gold-500 outline-none" placeholder="Pl: Az univerzum támogat engem..." />
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

                                <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10 mt-4">
                                    <div>
                                        <div className="font-bold text-white text-sm">Publikus Profil</div>
                                        <div className="text-xs text-white/50">Mások is láthatják a profilodat és a nyilvános húzásaidat</div>
                                    </div>
                                    <button
                                        onClick={() => updateSetting('isPublicProfile', !currentUser?.isPublicProfile)}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors ${currentUser?.isPublicProfile ? 'bg-gold-500' : 'bg-gray-600'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${currentUser?.isPublicProfile ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                    </button>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <button onClick={handleSaveProfile} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition-all">Mentés</button>
                            </div>
                        </div>

                        {/* PROTECTION SYMBOL - NEW */}
                        <div className="glass-panel p-6 rounded-2xl border border-white/10">
                            <h3 className="font-serif font-bold text-lg text-gold-400 mb-2">Védelmező Szimbólum</h3>
                            <p className="text-xs text-white/50 mb-6">Válassz egy szimbólumot, amely energetikai védelmet nyújt a profilodnak.</p>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                                {PROTECTION_SYMBOLS.map(symbol => (
                                    <button
                                        key={symbol.id}
                                        onClick={() => updateSetting('protectionSymbol', symbol.id)}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${currentUser?.protectionSymbol === symbol.id ? 'border-gold-500 bg-gold-500/10 scale-105 shadow-lg' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
                                    >
                                        <span className="text-2xl">{symbol.icon}</span>
                                        <span className="text-[8px] font-bold uppercase text-white/60 text-center">{symbol.name}</span>
                                    </button>
                                ))}
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

            {/* AURA KNOWLEDGE MODAL */}
            {showAuraInfo && (
                <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
                    <div className="glass-panel w-full max-w-lg rounded-3xl border border-gold-500/30 overflow-hidden shadow-2xl animate-scale-in">
                        <div className="p-8 text-center">
                            <div className="w-24 h-24 rounded-full mx-auto mb-6 blur-2xl opacity-80 animate-pulse" style={{ backgroundColor: auraColor }}></div>
                            <h3 className="text-3xl font-serif font-bold text-white mb-2">Aura Tudástár</h3>
                            <p className="text-gold-400 text-sm italic mb-8">Az aura színe az utolsó 7 napod uralkodó energiáit tükrözi.</p>

                            <div className="space-y-4 text-left">
                                <div className="flex gap-4 items-center p-3 rounded-xl bg-white/5 border border-white/5">
                                    <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                                    <div className="flex-1">
                                        <div className="text-xs font-bold text-white uppercase">Vörös / Tűz</div>
                                        <div className="text-[10px] text-white/50">Szenvedély, tettvágy, fizikai energia és kreatív lángolás.</div>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-center p-3 rounded-xl bg-white/5 border border-white/5">
                                    <div className="w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                    <div className="flex-1">
                                        <div className="text-xs font-bold text-white uppercase">Kék / Víz</div>
                                        <div className="text-[10px] text-white/50">Érzelmi mélység, intuíció, gyógyulás és belső béke.</div>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-center p-3 rounded-xl bg-white/5 border border-white/5">
                                    <div className="w-4 h-4 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                                    <div className="flex-1">
                                        <div className="text-xs font-bold text-white uppercase">Sárga / Levegő</div>
                                        <div className="text-[10px] text-white/50">Intellektus, kommunikáció, optimizmus és tiszta gondolatok.</div>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-center p-3 rounded-xl bg-white/5 border border-white/5">
                                    <div className="w-4 h-4 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                                    <div className="flex-1">
                                        <div className="text-xs font-bold text-white uppercase">Zöld / Föld</div>
                                        <div className="text-[10px] text-white/50">Stabilitás, növekedés, bőség és természetközeli állapot.</div>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-center p-3 rounded-xl bg-white/5 border border-white/5">
                                    <div className="w-4 h-4 rounded-full bg-gold-500 shadow-[0_0_10px_rgba(212,175,55,0.5)]"></div>
                                    <div className="flex-1">
                                        <div className="text-xs font-bold text-white uppercase">Arany / Nagy Árkánum</div>
                                        <div className="text-[10px] text-white/50">Sorsszerű változások, isteni vezettetés és magasabb tudatosság.</div>
                                    </div>
                                </div>
                            </div>

                            <button onClick={() => setShowAuraInfo(false)} className="mt-8 w-full py-3 bg-gold-500 text-black font-bold rounded-full shadow-lg">Értem</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ALTAR PICKER MODAL */}
            {showAltarPicker && (
                <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
                    <div className="glass-panel w-full max-w-4xl max-h-[90vh] rounded-3xl border border-gold-500/30 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h3 className="text-2xl font-serif font-bold text-gold-400">Oltár Kártyák Kiválasztása</h3>
                            <button onClick={() => setShowAltarPicker(false)} className="text-white/60 hover:text-white text-2xl">✕</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6">
                            <p className="text-white/60 mb-6 italic text-sm text-center">Válaszd ki azt a maximum 3 kártyát, amelyek a jelenlegi utadat leginkább tükrözik.</p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                                {FULL_DECK.map(card => {
                                    const isSelected = currentUser?.altarCards?.includes(card.id);
                                    return (
                                        <button
                                            key={card.id}
                                            onClick={() => toggleAltarCard(card.id)}
                                            className={`aspect-[2/3] rounded-lg border-2 transition-all relative group overflow-hidden ${isSelected ? 'border-gold-500 shadow-[0_0_15px_rgba(212,175,55,0.4)] scale-105 z-10' : 'border-white/10 opacity-60 hover:opacity-100'}`}
                                        >
                                            <CardImage cardId={card.id} className="w-full h-full object-cover" />
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-gold-500/10 flex items-center justify-center">
                                                    <span className="text-2xl drop-shadow-md">✨</span>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="p-6 border-t border-white/10 bg-black/40 flex justify-center">
                            <button onClick={() => setShowAltarPicker(false)} className="bg-gold-500 text-black px-10 py-3 rounded-full font-bold shadow-xl hover:scale-105 transition-transform">Kész</button>
                        </div>
                    </div>
                </div>
            )}

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
