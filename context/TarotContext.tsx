import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { User, Reading, Spread, ThemeType, ToastMessage, DeckMeta, Card, QuizResult, Lesson, CommunityBadge, BadgeRequest, TarotNotification, CommunityEvent } from '../types';
import { StorageService } from '../services/storageService';
import { DeckService } from '../services/deckService';
import { dbService } from '../services/dbService';
import { CommunityService } from '../services/communityService';
import { Language } from '../services/i18nService';
import { useTranslation } from './TranslationContext';
import { AstroService } from '../services/astroService';
import { db } from '../services/firebase';
import { onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore';
// Import FULL_DECK directly from source to avoid circular dependency issues
import { FULL_DECK } from '../constants/deckConstants';
// Fix: Added getAvatarUrl to imports to resolve the error in requestCommunityBadge
import { BADGES, DEFAULT_SPREADS, AVATAR_GALLERY, ADMIN_EMAILS, LESSONS, getAvatarUrl } from '../constants';
import { auth } from '../services/firebase'; 
import { onAuthStateChanged, signOut, deleteUser } from 'firebase/auth';
import { QuestService } from '../services/questService'; // New Quest Service

interface GlobalSettings {
    geminiApiKey?: string;
    enableGeminiSpreadImport?: boolean;
    enableRegistration?: boolean;
    enableShop?: boolean; // Added
}

interface TarotContextType {
    users: User[];
    currentUser: User | null;
    globalSettings: GlobalSettings;
    language: Language;
    setLanguage: (l: Language) => void;
    readings: Reading[];
    customSpreads: Spread[];
    allSpreads: Spread[];
    customLessons: Lesson[];
    allLessons: Lesson[];
    communityEvents: CommunityEvent[]; // New
    deck: Card[];
    toasts: ToastMessage[];
    installPrompt: any;
    availableDecks: DeckMeta[];
    activeDeck: DeckMeta | undefined;
    isCloudAvailable: boolean;
    isSyncing: boolean;
    quizResults: QuizResult[];
    userLocation: { lat: number, lng: number } | null;
    activeThemeKey: ThemeType; // Calculated theme (not 'auto')
    isDay: boolean; // Computed flag for day/night
    notifications: TarotNotification[];
    unreadCount: number;
    latestBadge: string | null;
    setLatestBadge: (id: string | null) => void;
    setCurrentUser: (u: User | null) => void;
    updateUser: (u: User) => void;
    addUser: (name: string, theme: ThemeType) => void;
    addReading: (r: Reading) => void;
    updateReading: (r: Reading) => void;
    deleteReading: (id: string) => void;
    toggleFavorite: (id: string) => void;
    toggleFavoriteCard: (cardId: string) => void; 
    toggleFavoriteSpread: (spreadId: string) => void; // Új
    addCustomSpread: (s: Spread) => void;
    updateCustomSpread: (s: Spread) => void; 
    deleteCustomSpread: (id: string) => void;
    addCustomLesson: (l: Lesson) => void; 
    updateCustomLesson: (l: Lesson) => void; // Added
    deleteCustomLesson: (id: string) => void; 
    updateCardData: (cardId: string, changes: Partial<Card>) => void;
    resetCardData: (cardId: string) => void;
    saveQuizResult: (res: QuizResult) => void;
    checkForBadges: () => void;
    exportData: () => void;
    importData: (f: File) => Promise<boolean>;
    syncToCloud: () => Promise<void>;
    loadFromCloud: () => Promise<void>;
    showToast: (text: string, type?: 'success' | 'info') => void;
    playSound: (type: 'draw' | 'flip' | 'success') => void;
    triggerInstall: () => void;
    logout: () => Promise<void>;
    toggleLessonInCollection: (lessonId: string) => void;
    toggleDeckInCollection: (deckId: string) => void;
    
    // Eseménykezelés
    addCommunityEvent: (e: CommunityEvent) => Promise<boolean>;
    joinCommunityEvent: (eId: string) => Promise<boolean>;
    leaveCommunityEvent: (eId: string) => Promise<boolean>;

    // Jelvény Közösségi Funkciók
    requestCommunityBadge: (badge: CommunityBadge, message?: string) => Promise<boolean>;
    approveCommunityBadgeRequest: (requestId: string, requesterId: string, badgeId: string, badgeName: string, badgeIcon: string) => Promise<boolean>;
    rejectCommunityBadgeRequest: (requestId: string, requesterId: string, badgeName: string) => Promise<boolean>;
    
    // Értesítési Funkciók
    markNotificationRead: (id: string) => void;
    markAllNotificationsRead: () => void;
}

const TarotContext = createContext<TarotContextType | undefined>(undefined);

// Guest Session Config
const GUEST_SESSION_KEY = 'tarot_guest_active';
const GUEST_START_TIME_KEY = 'tarot_guest_start';
const GUEST_TIMEOUT_MS = 60 * 60 * 1000; // 1 Hour

export const TarotProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const { data } = useTranslation();
    // State
    const [users, setUsers] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [language, setLanguage] = useState<Language>('hu');
    const [readings, setReadings] = useState<Reading[]>([]);
    const [customSpreads, setCustomSpreads] = useState<Spread[]>([]);
    const [customLessons, setCustomLessons] = useState<Lesson[]>([]); 
    const [publicLessons, setPublicLessons] = useState<Lesson[]>([]); // New: track for collection display
    const [publicDecks, setPublicDecks] = useState<DeckMeta[]>([]); // New: track for collection display
    const [communityEvents, setCommunityEvents] = useState<CommunityEvent[]>([]); // New
    const [systemLessonOverrides, setSystemLessonOverrides] = useState<Record<string, Lesson>>({});
    const [customCards, setCustomCards] = useState<Record<string, Partial<Card>>>({});
    const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [availableDecks, setAvailableDecks] = useState<DeckMeta[]>([]);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [isCloudAvailable, setIsCloudAvailable] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isDay, setIsDay] = useState(true);
    
    const [notifications, setNotifications] = useState<TarotNotification[]>([]);
    const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);
    const [latestBadge, setLatestBadge] = useState<string | null>(null);
    const [globalSettings, setGlobalSettings] = useState<GlobalSettings>({});

    // Guest Timer Ref
    const guestTimerRef = useRef<any>(null);

    // Precise Auto Theme Logic based on SunCalc
    useEffect(() => {
        const calculateDayNight = () => {
            const now = new Date();
            if (!userLocation) {
                // Fallback to simple hours if no location
                const hour = now.getHours();
                setIsDay(hour >= 6 && hour < 18);
                return;
            }

            const solar = AstroService.getSolarTimes(now, userLocation.lat, userLocation.lng);
            
            // Parse times "HH:MM"
            const [srH, srM] = solar.sunrise.split(':').map(Number);
            const [ssH, ssM] = solar.sunset.split(':').map(Number);
            
            const sunriseMin = srH * 60 + srM;
            const sunsetMin = ssH * 60 + ssM;
            const nowMin = now.getHours() * 60 + now.getMinutes();

            setIsDay(nowMin >= sunriseMin && nowMin < sunsetMin);
        };

        calculateDayNight();
        const i = setInterval(calculateDayNight, 60000 * 10); // Recheck every 10 min
        return () => clearInterval(i);
    }, [userLocation]);

    useEffect(() => {
        // Init IDB & Location
        dbService.init().catch(err => {
            console.warn("IndexedDB initialization failed. Custom local decks may not work.", err);
        });

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (p) => setUserLocation({ lat: p.coords.latitude, lng: p.coords.longitude }),
                (e) => console.log("Location detection error", e)
            );
        }

        // Load local decks initially
        DeckService.loadAvailableDecks().then(decks => setAvailableDecks(decks));

        // Load Public Data for reference display
        CommunityService.getPublicLessons().then(lessons => setPublicLessons(lessons));
        DeckService.getPublicDecks().then(decks => setPublicDecks(decks));

        // Load System Lesson Overrides (Public Lessons)
        CommunityService.getPublicLessons().then(publicLessons => {
            const overrides: Record<string, Lesson> = {};
            publicLessons.forEach(pl => {
                // If the ID matches a base lesson ID, it's an override
                if (LESSONS.some(base => base.id === pl.id)) {
                    overrides[pl.id] = pl;
                }
            });
            setSystemLessonOverrides(overrides);
        }).catch(err => console.warn("Could not load lesson overrides", err));

        // Load Global Settings
        CommunityService.getGlobalSettings().then(settings => {
            if (settings) setGlobalSettings(settings);
        });

        // Auth Listener - Main Data Loader
        if (auth) {
            const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
                if (firebaseUser) {
                    
                    // --- GUEST CLEANUP LOGIC ---
                    if (firebaseUser.isAnonymous) {
                        const now = Date.now();
                        const isNewSession = !sessionStorage.getItem(GUEST_SESSION_KEY);
                        const storedStartStr = localStorage.getItem(GUEST_START_TIME_KEY);
                        const startTime = storedStartStr ? parseInt(storedStartStr) : now;

                        const isExpired = (now - startTime) > GUEST_TIMEOUT_MS;

                        // Clean if: Tab was closed (New Session) OR Time expired
                        if (isNewSession || isExpired) {
                            try {
                                await StorageService.deleteFullUserProfile(firebaseUser.uid);
                            } catch(e) { /* Ignore cleanup errors */ }
                            
                            // Reset timers
                            sessionStorage.setItem(GUEST_SESSION_KEY, 'true');
                            localStorage.setItem(GUEST_START_TIME_KEY, now.toString());
                            showToast("Vendég munkamenet újraindult.", "info");
                        } else {
                            // Valid ongoing session, ensure sessionStorage is set
                            sessionStorage.setItem(GUEST_SESSION_KEY, 'true');
                        }

                        // Set strict 1 hour timeout from now to auto-logout
                        if (guestTimerRef.current) clearTimeout(guestTimerRef.current);
                        guestTimerRef.current = setTimeout(async () => {
                            await logout();
                            showToast("Vendég időkorlát lejárt.", "info");
                        }, GUEST_TIMEOUT_MS);
                    }
                    // ---------------------------

                    setIsCloudAvailable(true);
                    setIsSyncing(true);
                    const isAdmin = firebaseUser.email ? ADMIN_EMAILS.includes(firebaseUser.email) : false;

                    try {
                        // LOAD FROM CLOUD IMMEDIATELY
                        const cloudData = await StorageService.loadFullUserProfile(firebaseUser.uid);
                        
                        let finalUser: User;
                        if (cloudData.user) {
                            // Init quests logic if needed
                            finalUser = QuestService.checkAndRefreshQuests({ ...cloudData.user, isAdmin });

                            // XP to Currency Migration (Only once if undefined)
                            if (finalUser.currency === undefined) {
                                finalUser.currency = finalUser.xp || 0;
                            }

                            setReadings(cloudData.readings);
                            setCustomSpreads(cloudData.customSpreads);
                            setCustomLessons(cloudData.customLessons);
                            setCustomCards(cloudData.customCards);
                            setQuizResults(cloudData.quizResults);
                            
                            // Merge cloud private decks with local available decks
                            if (cloudData.privateDecks && cloudData.privateDecks.length > 0) {
                                DeckService.loadAvailableDecks().then(localDecks => {
                                    // Avoid duplicates by ID
                                    const combined = [...localDecks];
                                    cloudData.privateDecks.forEach(pd => {
                                        if (!combined.some(d => d.id === pd.id)) {
                                            combined.push(pd);
                                        }
                                    });
                                    setAvailableDecks(combined);
                                });
                            }

                        } else {
                            // New User or Wiped Guest -> Init Cloud
                            finalUser = {
                                id: firebaseUser.uid,
                                name: firebaseUser.displayName || 'Utazó',
                                themePreference: 'mystic', // Default manual theme
                                autoThemeEnabled: true, // Default to auto enabled
                                dayTheme: 'nature',
                                nightTheme: 'mystic',
                                deckPreference: 'rider-waite',
                                avatarId: firebaseUser.photoURL || AVATAR_GALLERY[0],
                                language: 'hu',
                                badges: [],
                                xp: 0,
                                currency: 0, // Init currency
                                level: 1,
                                soundEnabled: true,
                                fontSize: 'normal',
                                isAnonymous: firebaseUser.isAnonymous,
                                isAdmin,
                                quickActions: ['community', 'customSpread', 'astro', 'numerology', 'stats'], // Default 5
                                lessonCollection: [],
                                deckCollection: [],
                                favoriteCards: [],
                                favoriteSpreads: []
                            };
                            await StorageService.saveUserProfileToCloud(finalUser);
                            // Clear local state if it was a wipe
                            setReadings([]);
                            setCustomSpreads([]);
                            setCustomLessons([]);
                            setCustomCards({});
                            setQuizResults([]);
                        }
                        
                        setUsers([finalUser]);
                        setCurrentUser(finalUser);

                    } catch(e) {
                        console.error("Cloud load error:", e);
                        showToast("Hiba az adatok betöltésekor.", "info");
                    } finally {
                        setIsSyncing(false);
                    }
                } else {
                    setCurrentUser(null);
                    setReadings([]);
                    setCustomCards({}); 
                    if(guestTimerRef.current) clearTimeout(guestTimerRef.current);
                }
            });
            return () => unsubscribe();
        }
        
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    // REAL-TIME NOTIFICATIONS & EVENTS LISTENER
    useEffect(() => {
        if (!db) return;

        // Events Listener
        const qEvents = query(collection(db, 'community_events'), orderBy('date', 'asc'));
        const unsubEvents = onSnapshot(qEvents, (snap) => {
            const evs: CommunityEvent[] = [];
            snap.forEach(d => evs.push(d.data() as CommunityEvent));
            setCommunityEvents(evs);
        });

        if (currentUser?.id) {
            const qNotif = query(
                collection(db, 'notifications'), 
                where('userId', '==', currentUser.id),
                orderBy('createdAt', 'desc'),
                limit(20)
            );

            const unsubNotif = onSnapshot(qNotif, (snap) => {
                const notifs: TarotNotification[] = [];
                snap.forEach(d => notifs.push(d.data() as TarotNotification));
                setNotifications(notifs);
            });

            return () => { unsubEvents(); unsubNotif(); };
        }

        return () => unsubEvents();
    }, [currentUser?.id]);

    // --- Actions with Immediate Cloud Sync ---

    const addUser = (name: string, theme: ThemeType) => {
        // Legacy
    };

    const updateUser = async (updatedUser: User) => {
        setCurrentUser(updatedUser);
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        if (updatedUser.id && !updatedUser.isAnonymous) {
            await StorageService.saveUserProfileToCloud(updatedUser);
        }
    };

    const toggleLessonInCollection = async (lessonId: string) => {
        if (!currentUser) return;
        const current = currentUser.lessonCollection || [];
        const isPresent = current.includes(lessonId);
        const newCollection = isPresent ? current.filter(id => id !== lessonId) : [...current, lessonId];
        
        const updated = { ...currentUser, lessonCollection: newCollection };
        await updateUser(updated);
        
        if (!isPresent) {
            await CommunityService.downloadLesson(lessonId); // Increment counter
            showToast("Lecke hozzáadva a gyűjteményedhez.", "success");
        } else {
            showToast("Lecke eltávolítva a gyűjteményből.", "info");
        }
    };

    const toggleDeckInCollection = async (deckId: string) => {
        if (!currentUser) return;
        const current = currentUser.deckCollection || [];
        const isPresent = current.includes(deckId);
        const newCollection = isPresent ? current.filter(id => id !== deckId) : [...current, deckId];
        
        const updated = { ...currentUser, deckCollection: newCollection };
        await updateUser(updated);

        if (!isPresent) {
            showToast("Pakli hozzáadva a gyűjteményedhez.", "success");
        } else {
            showToast("Pakli eltávolítva a gyűjteményből.", "info");
        }
    };

    const addReading = async (r: Reading) => {
        setReadings(prev => [r, ...prev]);
        const userToUpdate = currentUser;
        
        if (userToUpdate) {
            const xpGain = 15;
            const newXp = (userToUpdate.xp || 0) + xpGain;
            const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;
            const leveledUp = newLevel > (userToUpdate.level || 1);
            let updatedUser = { ...userToUpdate, xp: newXp, level: newLevel };
            
            // Check Quests
            const questResult = QuestService.processAction(updatedUser, 'reading', { cards: r.cards, majorCount: r.cards.filter(c => deck.find(x => x.id === c.cardId)?.arcana === 'Major').length });
            if (questResult) {
                updatedUser = questResult.updatedUser;
                questResult.completedQuests.forEach(qid => showToast("Küldetés teljesítve!", "success"));
                // Add XP for completed quests
                updatedUser.xp += questResult.completedQuests.length * 100;
            }

            // Sync Currency with XP only if needed?
            // Wait, if user earns XP, they should earn Currency too.
            // If they spent currency, we shouldn't reset it to XP.
            // So: newCurrency = oldCurrency + earnedXP
            // The XP gain here is 15.
            // So we just add 15 to currency as well.
            const earnedXP = updatedUser.xp - (userToUpdate.xp || 0); // Total gained (base + quests)
            updatedUser.currency = (updatedUser.currency || 0) + earnedXP;

            await Promise.all([
                StorageService.saveReadingToCloud(userToUpdate.id, r),
                StorageService.saveUserProfileToCloud(updatedUser)
            ]);
            
            setCurrentUser(updatedUser);
            if (leveledUp) setTimeout(() => showToast(`Szintlépés! ${newLevel}. szint!`, 'success'), 500);
            
            // Trigger badge check after a slight delay to ensure readings state is processed
            setTimeout(() => checkForBadges(), 1000);
        }
        showToast('Húzás elmentve!', 'success');
    };
    
    const updateReading = async (updated: Reading) => {
        setReadings(prev => prev.map(r => r.id === updated.id ? updated : r));
        if (currentUser) {
            await StorageService.saveReadingToCloud(currentUser.id, updated);
        }
    };

    const deleteReading = async (id: string) => {
        const readingToDelete = readings.find(r => r.id === id);
        setReadings(prev => prev.filter(r => r.id !== id));
        
        if (currentUser) {
            await StorageService.deleteReadingFromCloud(currentUser.id, id);
        }

        if (readingToDelete?.isPublic) {
            await CommunityService.unpublishReading(id);
        }
    };

    const toggleFavorite = (id: string) => {
        const r = readings.find(x => x.id === id);
        if (r) updateReading({ ...r, isFavorite: !r.isFavorite });
    };

    const toggleFavoriteCard = (cardId: string) => {
        if(!currentUser) return;
        const currentFavs = currentUser.favoriteCards || [];
        let newFavs;
        if (currentFavs.includes(cardId)) {
            newFavs = currentFavs.filter(id => id !== cardId);
        } else {
            newFavs = [...currentFavs, cardId];
        }
        updateUser({ ...currentUser, favoriteCards: newFavs });
    };

    const toggleFavoriteSpread = (spreadId: string) => {
        if(!currentUser) return;
        const currentFavs = currentUser.favoriteSpreads || [];
        let newFavs;
        if (currentFavs.includes(spreadId)) {
            newFavs = currentFavs.filter(id => id !== spreadId);
        } else {
            newFavs = [...currentFavs, spreadId];
        }
        updateUser({ ...currentUser, favoriteSpreads: newFavs });
    };

    const addCustomSpread = async (s: Spread) => {
        setCustomSpreads(prev => [...prev, s]);
        if(currentUser) {
            await StorageService.saveCustomSpreadToCloud(currentUser.id, s);
        }
    };

    const updateCustomSpread = async (s: Spread) => {
        setCustomSpreads(prev => prev.map(spread => spread.id === s.id ? s : spread));
        if(currentUser) {
            await StorageService.saveCustomSpreadToCloud(currentUser.id, s);
        }
    };

    const deleteCustomSpread = async (id: string) => { 
        if(confirm("Törlöd ezt a kirakást?")) {
            setCustomSpreads(prev => prev.filter(s => s.id !== id)); 
            if(currentUser) {
                await StorageService.deleteCustomSpreadFromCloud(currentUser.id, id);
                await CommunityService.unpublishSpread(id);
            }
        }
    };

    // --- Custom Lesson Actions ---
    const addCustomLesson = async (l: Lesson) => {
        setCustomLessons(prev => [...prev, l]);
        if (currentUser) {
            await StorageService.saveCustomLessonToCloud(currentUser.id, l);
        }
    };

    const updateCustomLesson = async (l: Lesson) => {
        setCustomLessons(prev => prev.map(lesson => lesson.id === l.id ? l : lesson));
        if (currentUser) {
            await StorageService.saveCustomLessonToCloud(currentUser.id, l);
        }
    };

    const deleteCustomLesson = async (id: string) => {
        if(confirm("Biztosan törlöd ezt a leckét?")) {
            setCustomLessons(prev => prev.filter(l => l.id !== id));
            if (currentUser) {
                await StorageService.deleteCustomLessonFromCloud(currentUser.id, id);
                // Optionally unpublish if it was public
            }
        }
    };

    const updateCardData = async (cardId: string, changes: Partial<Card>) => {
        setCustomCards(prev => ({ ...prev, [cardId]: { ...(prev[cardId] || {}), ...changes } }));
        if (currentUser) {
            await StorageService.saveCustomCardToCloud(currentUser.id, cardId, changes);
        }
    };

    const resetCardData = async (cardId: string) => {
        setCustomCards(prev => { 
            const { [cardId]: removed, ...rest } = prev; 
            return rest; 
        });
        if (currentUser) {
            await StorageService.deleteCustomCardFromCloud(currentUser.id, cardId);
        }
    };

    const saveQuizResult = async (res: QuizResult) => {
        setQuizResults(prev => [...prev, res]);
        if (currentUser) {
            const xpGain = res.score * 5;
            const newXp = (currentUser.xp || 0) + xpGain;
            const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;
            
            // Sync Currency
            const newCurrency = (currentUser.currency || 0) + xpGain;

            await Promise.all([
                StorageService.saveQuizResultToCloud(currentUser.id, res),
                updateUser({ ...currentUser, xp: newXp, currency: newCurrency, level: newLevel })
            ]);
        }
    };

    const checkForBadges = () => {
        if(!currentUser) return;
        const earnedBadges = BADGES.filter(b => b.condition(currentUser, readings));
        const newBadges = earnedBadges.map(b => b.id).filter(bid => !currentUser.badges.includes(bid));
        if (newBadges.length > 0) {
            updateUser({ ...currentUser, badges: [...currentUser.badges, ...newBadges] });
            // Show popup for the first one found (or we could queue them, but simple is better)
            setLatestBadge(newBadges[0]);
            // showToast(`Új jelvény megszervezve!`, 'success'); // Removed redundant toast
        }
    };

    // --- Community Events ---
    const addCommunityEvent = async (e: CommunityEvent) => {
        const success = await CommunityService.createEvent(e);
        if (success) showToast("Esemény sikeresen létrehozva!", "success");
        return success;
    };

    const joinCommunityEvent = async (eId: string) => {
        if (!currentUser) return false;
        const success = await CommunityService.joinEvent(eId, currentUser.id, currentUser.name, getAvatarUrl(currentUser));
        if (success) showToast("Csatlakoztál az eseményhez!", "success");
        return success;
    };

    const leaveCommunityEvent = async (eId: string) => {
        if (!currentUser) return false;
        const success = await CommunityService.leaveEvent(eId, currentUser.id, currentUser.name, getAvatarUrl(currentUser));
        if (success) showToast("Kiléptél az eseményből.", "info");
        return success;
    };

    // --- Community Badge Management ---

    const requestCommunityBadge = async (badge: CommunityBadge, message?: string): Promise<boolean> => {
        if (!currentUser) return false;
        const request: BadgeRequest = {
            id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            badgeId: badge.id,
            badgeName: badge.name,
            badgeIcon: badge.icon,
            requesterId: currentUser.id,
            requesterName: currentUser.name,
            // Fix: Added getAvatarUrl to imports and using it here
            requesterAvatar: getAvatarUrl(currentUser),
            creatorId: badge.userId,
            status: 'pending',
            createdAt: new Date().toISOString(),
            message
        };
        const success = await CommunityService.submitBadgeRequest(request);
        if (success) showToast("Kérelem elküldve a készítőnek!", "success");
        else showToast("Már van folyamatban lévő kérelmed erre a jelvényre.", "info");
        return success;
    };

    const approveCommunityBadgeRequest = async (requestId: string, requesterId: string, badgeId: string, badgeName: string, badgeIcon: string) => {
        if (!currentUser) return false;
        const success = await CommunityService.resolveBadgeRequest(requestId, 'approved');
        if (success) {
            // Trigger Notification
            const notif: TarotNotification = {
                id: `nt_${Date.now()}`,
                userId: requesterId,
                type: 'badge_approved',
                title: 'Jelvény Jóváhagyva! ✨',
                message: `Gratulálunk! A(z) "${badgeName}" jelvényedet jóváhagyta a készítő.`,
                isRead: false,
                createdAt: new Date().toISOString()
            };
            await CommunityService.addNotification(notif);
            showToast("Kérelem jóváhagyva!", "success");
        }
        return success;
    };

    const rejectCommunityBadgeRequest = async (requestId: string, requesterId: string, badgeName: string) => {
        const success = await CommunityService.resolveBadgeRequest(requestId, 'rejected');
        if (success) {
             // Trigger Notification
             const notif: TarotNotification = {
                id: `nt_${Date.now()}`,
                userId: requesterId,
                type: 'badge_rejected',
                title: 'Jelvény Kérelem Elutasítva',
                message: `Sajnáljuk, a(z) "${badgeName}" jelvény kérelmedet elutasították.`,
                isRead: false,
                createdAt: new Date().toISOString()
            };
            await CommunityService.addNotification(notif);
            showToast("Kérelem elutasítva.", "info");
        }
        return success;
    };

    // --- Notification Actions ---
    const markNotificationRead = (id: string) => {
        CommunityService.markNotificationAsRead(id);
    };

    const markAllNotificationsRead = () => {
        if(currentUser) CommunityService.markAllNotificationsAsRead(currentUser.id);
    };

    // Utils - Safety check for FULL_DECK
    const deck = useMemo(() => ((data && data.cards) || FULL_DECK || []).map(c => customCards[c.id] ? { ...c, ...customCards[c.id] } : c), [customCards, data]);
    
    const activeDeck = useMemo(() => {
        if (!currentUser) return undefined;
        
        // 1. Check if it's Rider Waite
        if (currentUser.deckPreference === 'rider-waite') return availableDecks[0];
        
        // 2. Check if it's in the User's Personal Deck collection (Local storage / Cloud private)
        const localMatch = availableDecks.find(d => d.id === currentUser.deckPreference);
        if (localMatch) return localMatch;
        
        // 3. Check if it's a collected public deck (by Reference)
        if (currentUser.deckCollection?.includes(currentUser.deckPreference)) {
            return publicDecks.find(d => d.id === currentUser.deckPreference);
        }

        return availableDecks[0];
    }, [currentUser, availableDecks, publicDecks]);
    
    // Merge Base Lessons with System Overrides, Custom Lessons, and Collected References
    const allLessons = useMemo(() => {
        const baseLessons = LESSONS.map(lesson => systemLessonOverrides[lesson.id] || lesson);
        
        const collectedIds = currentUser?.lessonCollection || [];
        const collectedLessons = publicLessons.filter(pl => collectedIds.includes(pl.id));
        
        const combined = [...baseLessons, ...customLessons, ...collectedLessons];
        
        // Remove duplicates by ID, prioritizing Custom > Collected > System
        const seen = new Set();
        return combined.filter(l => {
            if (seen.has(l.id)) return false;
            seen.add(l.id);
            return true;
        });
    }, [customLessons, systemLessonOverrides, publicLessons, currentUser?.lessonCollection]);

    const showToast = (text: string, type: 'success'|'info' = 'info') => {
        const id = Math.random().toString(36);
        setToasts(prev => [...prev, { id, text, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    };
    const playSound = () => {};
    
    const logout = async () => { 
        if (currentUser?.isAnonymous) {
            try {
                await StorageService.deleteFullUserProfile(currentUser.id);
                await deleteUser(auth.currentUser!); 
            } catch(e) { 
                console.warn("Logout cleanup warning:", e); 
            }
        }
        await signOut(auth); 
        setCurrentUser(null);
        setReadings([]);
        setCustomSpreads([]);
        setCustomLessons([]);
        setCustomCards({});
        setQuizResults([]);
        localStorage.removeItem(GUEST_START_TIME_KEY);
        sessionStorage.removeItem(GUEST_SESSION_KEY);
    };

    const triggerInstall = async () => { installPrompt?.prompt(); };
    
    const syncToCloud = async () => { /* Direct Sync enforced */ };
    const loadFromCloud = async () => { 
        if(currentUser) { 
            const d = await StorageService.loadFullUserProfile(currentUser.id);
            if(d.readings) setReadings(d.readings);
            if(d.customSpreads) setCustomSpreads(d.customSpreads);
            if(d.customLessons) setCustomLessons(d.customLessons);
            if(d.customCards) setCustomCards(d.customCards);
            if(d.quizResults) setQuizResults(d.quizResults);
            if (d.privateDecks && d.privateDecks.length > 0) {
                DeckService.loadAvailableDecks().then(localDecks => {
                    const combined = [...localDecks];
                    d.privateDecks.forEach(pd => {
                        if (!combined.some(d => d.id === pd.id)) combined.push(pd);
                    });
                    setAvailableDecks(combined);
                });
            }
        }
    };

    // THEME LOGIC
    let activeThemeKey: ThemeType = 'mystic';
    if (currentUser) {
        if (currentUser.autoThemeEnabled) {
            // Use calculated day/night state with specific preferences
            activeThemeKey = isDay ? (currentUser.dayTheme || 'nature') : (currentUser.nightTheme || 'mystic');
        } else {
            // Use manual preference
            activeThemeKey = currentUser.themePreference || 'mystic';
        }
    }

    return (
        <TarotContext.Provider value={{
            users, currentUser, language, setLanguage, readings, customSpreads, toasts, installPrompt,
            allSpreads: [...DEFAULT_SPREADS, ...customSpreads], 
            customLessons, 
            allLessons,
            communityEvents,
            deck, availableDecks, activeDeck, quizResults, userLocation,
            isCloudAvailable, isSyncing, activeThemeKey, isDay,
            notifications, unreadCount,
            latestBadge, setLatestBadge,
            globalSettings,
            setCurrentUser, updateUser, addUser, addReading, updateReading, deleteReading, 
            addCustomSpread, updateCustomSpread, deleteCustomSpread, 
            addCustomLesson, updateCustomLesson, deleteCustomLesson,
            updateCardData, resetCardData, saveQuizResult,
            checkForBadges, toggleFavorite, toggleFavoriteCard, toggleFavoriteSpread, triggerInstall, exportData: StorageService.exportData,
            importData: StorageService.importData, syncToCloud, loadFromCloud, showToast, playSound, logout,
            toggleLessonInCollection, toggleDeckInCollection,
            addCommunityEvent, joinCommunityEvent, leaveCommunityEvent,
            requestCommunityBadge, approveCommunityBadgeRequest, rejectCommunityBadgeRequest,
            markNotificationRead, markAllNotificationsRead
        }}>
            {children}
        </TarotContext.Provider>
    );
};

export const useTarot = () => {
    const context = useContext(TarotContext);
    if (!context) throw new Error("useTarot error");
    return context;
};
