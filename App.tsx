
import React, { useState, useEffect, useMemo } from 'react';
import { TarotProvider, useTarot } from './context/TarotContext';
import { THEMES, getAvatarUrl } from './constants';
import { Dashboard } from './components/Dashboard';
import { ReadingView } from './components/ReadingView';
import { HistoryView } from './components/HistoryView';
import { LibraryView } from './components/LibraryView';
import { CustomSpreadBuilder } from './components/CustomSpreadBuilder';
import { AdvancedSpreadBuilder } from './components/AdvancedSpreadBuilder';
import { StatsView } from './components/StatsView'; // Still imported but used inside Analysis
import { QuizView } from './components/QuizView';
import { CardDetailView } from './components/CardDetailView'; 
import { AchievementPopup } from './components/AchievementPopup';
import { ProfileView } from './components/ProfileView';
import { MultiplayerSession } from './components/MultiplayerSession'; 
import { EducationView } from './components/EducationView'; 
import { InstallView } from './components/InstallView';
import { DeckBuilder } from './components/DeckBuilder';
import { MusicPlayer } from './components/MusicPlayer';
import { AuthView } from './components/AuthView';
import { CommunityView } from './components/CommunityView';
import { CommunityDecksView } from './components/CommunityDecksView'; 
import { CommunitySpreadsView } from './components/CommunitySpreadsView'; 
import { AdminDashboard } from './components/AdminDashboard';
import { NumerologyView } from './components/NumerologyView'; // Still imported but used inside Analysis
import { AstroCalendarView } from './components/AstroCalendarView';
import { BadgesView } from './components/BadgesView';
import { QuestView } from './components/QuestView';
import { MonthlySummaryView } from './components/MonthlySummaryView'; // Still imported
import { AnalysisView } from './components/AnalysisView';
import { MarketplaceView } from './components/MarketplaceView';
import { Spread, Card } from './types';
import { t } from './services/i18nService';
import { AstroService } from './services/astroService';
import { UpdateService, UpdateResponse } from './services/UpdateService';
import { TutorialOverlay, TutorialStep } from './components/TutorialOverlay';

// Inline UpdateNotification to avoid module loading errors in copy-and-run environment
const UpdateNotification: React.FC = () => {
  const { currentUser } = useTarot();
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [details, setDetails] = useState<{local: string, remote: string} | null>(null);
  const [showBackupList, setShowBackupList] = useState<boolean>(false);
  const [backups, setBackups] = useState<string[]>([]);

  useEffect(() => {
    // Csak adminnak ellenőrizzük
    if (currentUser?.isAdmin) {
      check();
    }
  }, [currentUser]);

  const check = async () => {
    const result = await UpdateService.checkForUpdates();
    if (result.status === 'success' && result.has_update) {
      setUpdateAvailable(true);
      setDetails({
        local: result.local_sha || 'Ismeretlen',
        remote: result.remote_sha || 'Ismeretlen'
      });
    }
  };

  const handleUpdate = async () => {
    if (!window.confirm("Biztosan frissíteni szeretnéd a rendszert? A folyamat előtt biztonsági mentés készül.")) return;

    setLoading(true);
    setMessage("Frissítés folyamatban... Kérlek ne zárd be az ablakot.");

    const result = await UpdateService.performUpdate();
    setLoading(false);

    if (result.status === 'success') {
      setMessage(`Sikeres frissítés! (Backup ID: ${result.backup_id}) Az oldal újratöltődik...`);
      setTimeout(() => window.location.reload(), 3000);
    } else {
      setMessage(`Hiba történt: ${result.message}`);
    }
  };

  const fetchBackups = async () => {
    const result = await UpdateService.listBackups();
    if (result.status === 'success' && result.backups) {
      setBackups(result.backups);
      setShowBackupList(true);
    }
  };

  const handleRestore = async (id: string) => {
    if (!window.confirm(`Biztosan visszaállítod ezt a verziót: ${id}? A jelenlegi állapot elveszhet.`)) return;

    setLoading(true);
    setMessage("Visszaállítás folyamatban...");
    const result = await UpdateService.restoreBackup(id);
    setLoading(false);

    if (result.status === 'success') {
      setMessage("Sikeres visszaállítás! Az oldal újratöltődik...");
      setTimeout(() => window.location.reload(), 3000);
    } else {
      setMessage(`Hiba történt: ${result.message}`);
    }
  };

  // Ha nem admin, vagy nincs frissítés/üzenet/lista, ne jelenjen meg
  if (!currentUser?.isAdmin) return null;
  if (!updateAvailable && !showBackupList && !message) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: '#2c3e50',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      zIndex: 9999,
      maxWidth: '300px',
      fontFamily: 'sans-serif'
    }}>
      {message && <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>{message}</div>}

      {updateAvailable && !loading && (
        <div>
          <h4 style={{ margin: '0 0 10px 0' }}>Új verzió elérhető!</h4>
          <p style={{ fontSize: '0.8em', margin: '0 0 10px 0' }}>
            Jelenlegi: {details?.local.substring(0, 7)}...<br/>
            Új: {details?.remote.substring(0, 7)}...
          </p>
          <button
            onClick={handleUpdate}
            style={{
              background: '#27ae60',
              color: 'white',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              width: '100%',
              marginBottom: '5px'
            }}
          >
            Frissítés most
          </button>
        </div>
      )}

      {!loading && (
        <div style={{ marginTop: '10px', borderTop: '1px solid #34495e', paddingTop: '5px' }}>
          {!showBackupList ? (
            <button
              onClick={fetchBackups}
              style={{
                background: 'transparent',
                color: '#bdc3c7',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.8em',
                textDecoration: 'underline'
              }}
            >
              Mentések kezelése
            </button>
          ) : (
            <div>
              <h5 style={{ margin: '5px 0' }}>Elérhető mentések:</h5>
              <ul style={{ listStyle: 'none', padding: 0, maxHeight: '100px', overflowY: 'auto', fontSize: '0.8em' }}>
                {backups.length === 0 ? <li>Nincs mentés.</li> : backups.map(b => (
                  <li key={b} style={{ marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{b}</span>
                    <button onClick={() => handleRestore(b)} style={{ background: '#c0392b', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.8em' }}>Vissza</button>
                  </li>
                ))}
              </ul>
              <button onClick={() => setShowBackupList(false)} style={{ fontSize: '0.8em', background: 'transparent', color: '#bdc3c7', border: 'none', cursor: 'pointer' }}>Bezár</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Icons
const Icons = {
  Menu: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>,
  Close: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>,
  Sun: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>,
  Bell: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
};

const ToastContainer = () => {
    const { toasts } = useTarot();
    return (
        <div className="fixed top-24 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            {toasts.map(t => (
                <div key={t.id} className={`px-4 py-3 rounded-lg shadow-xl backdrop-blur-md border border-white/20 text-white font-bold animate-fade-in pointer-events-auto ${t.type === 'success' ? 'bg-green-600/80' : 'bg-indigo-600/80'}`}>
                    {t.text}
                </div>
            ))}
        </div>
    );
};

const NotificationCenter = ({ navigateTo }: { navigateTo: (v: string) => void }) => {
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

const AppContent = () => {
    const { currentUser, deck, isSyncing, isCloudAvailable, language, activeThemeKey, logout, userLocation, globalSettings } = useTarot();
    const [view, setView] = useState('dashboard');
    const [analysisTab, setAnalysisTab] = useState<any>('stats');
    const [activeSpread, setActiveSpread] = useState<Spread | null>(null);
    const [readingDate, setReadingDate] = useState<Date | undefined>(undefined);
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);
    const [spreadToEdit, setSpreadToEdit] = useState<Spread | undefined>(undefined);
    const [viewProfileId, setViewProfileId] = useState<string | undefined>(undefined);
    const [spreadBuilderMode, setSpreadBuilderMode] = useState<'simple'|'advanced'>('simple');
    
    // Tutorial State
    const [isTutorialActive, setIsTutorialActive] = useState(false);
    const [tutorialStepIndex, setTutorialStepIndex] = useState(0);

    const TUTORIAL_STEPS: TutorialStep[] = [
        { targetId: 'app-header-logo', title: 'Üdvözöllek az Arkánumban!', content: 'Ez a te spirituális útitársad. Kezdjük egy rövid bemutatóval!', position: 'bottom' },
        { targetId: 'spread-selector-container', title: 'Válassz Kirakást', content: 'Itt találod a különböző élethelyzetekre szóló kártyavetéseket. Válassz egyet a kezdéshez!', position: 'top' },
    ];

    // Header Astro Info
    const today = useMemo(() => new Date(), []);
    const headerAstro = useMemo(() => AstroService.getAstroData(today, userLocation || undefined), [today, userLocation]);

    // Menu State
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    if (!currentUser) return <AuthView />;

    if (view === 'admin') {
        return <AdminDashboard onBack={() => setView('dashboard')} />;
    }

    const theme = THEMES[activeThemeKey] || THEMES['mystic'];
    const fontSizeClass = currentUser.fontSize === 'large' ? 'text-lg' : 'text-base';

    const startReading = (spread: Spread, date?: Date) => {
        setActiveSpread(spread);
        setReadingDate(date);
        setView('reading');
        setIsMenuOpen(false);
    };

    const startTutorial = () => {
        setIsTutorialActive(true);
        setTutorialStepIndex(0);
        setIsMenuOpen(false);
        setView('dashboard');
    };

    const handleSelectCard = (card: Card) => {
        setSelectedCard(card);
        setView('cardDetail');
    };

    const navigateTo = (v: string, param?: string) => {
        if (v === 'tutorial') {
            startTutorial();
            return;
        }

        if(v === 'customSpread') setSpreadToEdit(undefined);

        if (v === 'stats' || v === 'numerology' || v === 'analysis' || v === 'monthly' || v === 'compass') {
            setAnalysisTab(v === 'analysis' ? 'stats' : v);
            setView('analysis');
        } else if (v === 'profile') {
            setViewProfileId(param);
            setView(v);
        } else {
            setViewProfileId(undefined);
            setView(v);
        }

        setIsMenuOpen(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleEditSpread = (spread: Spread) => {
        setSpreadToEdit(spread);
        setView('customSpread');
        setIsMenuOpen(false);
    };

    const handleLogout = () => {
        setIsMenuOpen(false);
        logout();
    };

    // --- MENU STRUCTURE ---
    const menuGroups = [
        {
            title: 'Főmenü',
            items: [
                { id: 'dashboard', label: t('menu.dashboard', language), icon: '🏠' },
                { id: 'history', label: t('menu.history', language), icon: '📜' },
                { id: 'library', label: t('menu.library', language), icon: '📖' },
                { id: 'profile', label: t('menu.profile', language), icon: '👤' },
            ]
        },
        {
            title: 'Misztikum',
            items: [
                { id: 'analysis', label: 'Elemzés', icon: '📊' }, // Consolidated item
                { id: 'badges', label: 'Jelvények', icon: '🏆' },
                { id: 'astro', label: 'Holdnaptár', icon: '🌙' },
                { id: 'quiz', label: 'Tudás Próba', icon: '🎓' },
            ]
        },
        {
            title: 'Közösség',
            items: [
                { id: 'community', label: 'Faliújság', icon: '🌍' },
                { id: 'quests', label: 'Kihívások', icon: '⚔️' },
                ...(globalSettings.enableShop !== false ? [{ id: 'marketplace', label: 'Piactér (Bolt)', icon: '🏷️' }] : []),
                { id: 'live', label: 'Távjóslás (Live)', icon: '📡' },
                { id: 'communityDecks', label: 'Pakli Piactér', icon: '🎨' },
                { id: 'communitySpreads', label: 'Kirakás Piactér', icon: '💠' },
            ]
        },
        {
            title: 'Eszközök',
            items: [
                { id: 'tutorial', label: 'Kezdő Utazás', icon: '🎓' },
                { id: 'customSpread', label: 'Kirakás Tervező', icon: '✨' },
                { id: 'deckBuilder', label: 'Pakli Műhely', icon: '🖌️' },
                { id: 'education', label: 'Tanulás', icon: '📚' },
                { id: 'install', label: 'Mentés & Telepítés', icon: '💾' },
            ]
        }
    ];

    return (
        <div className={`min-h-screen font-sans transition-colors duration-500 ${theme.bg} ${theme.text} ${fontSizeClass}`}>
            <ToastContainer />
            <AchievementPopup />
            <MusicPlayer />
            <UpdateNotification />
            
            {/* --- HEADER --- */}
            <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3">
                <div className={`glass-panel-dark backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl relative transition-all duration-300 ${isMenuOpen ? 'bg-black/90' : ''}`}>
                    <div className="flex justify-between items-center px-4 py-3">
                        
                        {/* Logo & Title Area - UPDATED */}
                        <div id="app-header-logo" className="flex items-center cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigateTo('dashboard')}>
                            <span className="text-3xl filter drop-shadow-[0_0_10px_rgba(251,191,36,0.6)] mr-3">🔮</span>
                            
                            {/* Vertical Divider */}
                            <div className="h-8 w-px bg-white/10 mx-1 hidden sm:block"></div>
                            
                            <div className="flex flex-col justify-center ml-2">
                                <h1 className="text-xl font-serif font-bold tracking-[0.1em] uppercase text-white shadow-black drop-shadow-md leading-none mb-1">
                                    ARKÁNUM
                                </h1>
                                {/* Subtitle with Dynamic Moon Info */}
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gold-400 tracking-widest uppercase opacity-80">
                                    <span>A Lélek Tükre</span>
                                    <span className="text-white/30">•</span>
                                <div className="flex items-center gap-1 text-blue-200 cursor-pointer hover:text-white transition-colors" title={`Holdfázis: ${headerAstro.moonPhase} (${Math.round(headerAstro.illumination * 100)}%)`} onClick={() => navigateTo('astro')}>
                                        {headerAstro.icon} {headerAstro.moonPhase} {Math.round(headerAstro.illumination * 100)}%
                                </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Status & Notifications & Menu Toggle */}
                        <div className="flex items-center gap-2 md:gap-4">
                            {/* Notification Center */}
                            <NotificationCenter navigateTo={navigateTo} />

                            {/* Hamburger Button */}
                            <button 
                                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                                aria-label={isMenuOpen ? "Bezárás" : "Menü"}
                                className={`p-2 rounded-xl transition-all border ${isMenuOpen ? 'bg-gold-500 text-black border-gold-500 rotate-90' : 'bg-white/10 text-white border-white/10 hover:bg-white/20'}`}
                            >
                                {isMenuOpen ? <Icons.Close /> : <Icons.Menu />}
                            </button>
                        </div>
                    </div>

                    {/* --- DROPDOWN MEGA MENU --- */}
                    <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isMenuOpen ? 'max-h-[80vh] opacity-100 border-t border-white/10' : 'max-h-0 opacity-0'}`}>
                        <div className="p-6 overflow-y-auto max-h-[75vh] custom-scrollbar">
                            
                            {/* User Info in Menu (Mobile) */}
                            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/10 md:hidden">
                                <img src={getAvatarUrl(currentUser)} className="w-12 h-12 rounded-full border border-white/20" />
                                <div>
                                    <div className="font-bold text-white">{currentUser.name}</div>
                                    <div className="text-xs text-white/50">Lvl {currentUser.level} Látnok</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                {menuGroups.map((group, idx) => (
                                    <div key={idx} className="space-y-3">
                                        <h3 className="text-xs font-bold uppercase text-gold-500 tracking-widest mb-2 border-b border-white/5 pb-2">
                                            {group.title}
                                        </h3>
                                        {group.items.map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => navigateTo(item.id)}
                                                className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group ${view === item.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                            >
                                                <span className={`text-lg transition-transform group-hover:scale-110 ${view === item.id ? 'scale-110' : ''}`}>{item.icon}</span>
                                                <span className="text-sm font-bold">{item.label}</span>
                                                {view === item.id && <span className="ml-auto text-[10px] text-gold-500">●</span>}
                                            </button>
                                        ))}
                                    </div>
                                ))}
                            </div>

                            {/* Footer Actions with Admin Link */}
                            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="text-xs text-white/30 flex items-center gap-3">
                                    <span>v1.2.0 • {isSyncing ? 'Szinkronizálás...' : 'Naprakész'}</span>
                                    {currentUser.isAdmin && (
                                        <button 
                                            onClick={() => navigateTo('admin')} 
                                            className="px-2 py-1 bg-red-500/20 text-red-200 rounded border border-red-500/30 font-bold uppercase tracking-wider hover:bg-red-500/40 transition-colors flex items-center gap-1"
                                        >
                                            <span>🔧</span> Admin Pult
                                        </button>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => window.location.href = window.location.pathname + '?force=true'}
                                        className="px-4 py-2 rounded-lg bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 hover:text-blue-200 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                                        title="Kényszerített frissítés (Cache törlése)"
                                    >
                                        <span>🔄</span> Frissítés
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="px-6 py-2 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
                                    >
                                        <span>🚪</span> Kijelentkezés
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content - Adjusted Padding for Header */}
            <main className="container mx-auto px-4 pt-28 pb-10 max-w-7xl">
                {view === 'dashboard' && <Dashboard onNavigate={navigateTo} onStartReading={startReading} onEditSpread={handleEditSpread} />}
                {view === 'reading' && activeSpread && <ReadingView spread={activeSpread} deck={deck} targetDate={readingDate} onCancel={() => setView('dashboard')} />}
                {view === 'history' && <HistoryView deck={deck} />}
                {view === 'education' && <EducationView onBack={() => setView('dashboard')} />}
                {view === 'community' && <CommunityView onBack={() => setView('dashboard')} onNavigate={navigateTo} />}
                {view === 'communityDecks' && <CommunityDecksView onBack={() => setView('dashboard')} />}
                {view === 'communitySpreads' && <CommunitySpreadsView onBack={() => setView('dashboard')} />}
                {view === 'library' && <LibraryView deck={deck} theme={theme} onSelectCard={handleSelectCard} />}
                {view === 'cardDetail' && selectedCard && <CardDetailView card={deck.find(c => c.id === selectedCard.id) || selectedCard} theme={theme} onBack={() => setView('library')} onNavigate={setSelectedCard} />}
                {view === 'customSpread' && (
                    <div className="relative">
                        <div className="absolute top-0 right-0 z-10 p-2">
                            <button onClick={() => setSpreadBuilderMode(spreadBuilderMode === 'simple' ? 'advanced' : 'simple')} className="bg-white/10 px-3 py-1 rounded text-xs font-bold border border-white/20">
                                {spreadBuilderMode === 'simple' ? 'Váltás: Haladó (Drag & Drop)' : 'Váltás: Egyszerű (Rács)'}
                            </button>
                        </div>
                        {spreadBuilderMode === 'simple' ? (
                            <CustomSpreadBuilder onCancel={() => setView('dashboard')} initialSpread={spreadToEdit} />
                        ) : (
                            <AdvancedSpreadBuilder onCancel={() => setView('dashboard')} initialSpread={spreadToEdit} />
                        )}
                    </div>
                )}
                {view === 'deckBuilder' && <DeckBuilder onBack={() => setView('dashboard')} />}

                {/* Consolidating Views */}
                {view === 'analysis' && <AnalysisView onBack={() => setView('dashboard')} initialTab={analysisTab} />}

                {view === 'marketplace' && <MarketplaceView onBack={() => setView('dashboard')} />}
                {view === 'quiz' && <QuizView onBack={() => setView('dashboard')} />}
                {view === 'profile' && <ProfileView onBack={() => setView('dashboard')} targetUserId={viewProfileId} onNavigate={navigateTo} />}
                {view === 'live' && <MultiplayerSession onBack={() => setView('dashboard')} />}
                {view === 'install' && <InstallView onBack={() => setView('dashboard')} />}
                {view === 'astro' && <AstroCalendarView onBack={() => setView('dashboard')} onStartReading={startReading} />}
                {view === 'badges' && <BadgesView onBack={() => setView('dashboard')} />}
                {view === 'quests' && <QuestView onBack={() => setView('dashboard')} />}
                {isTutorialActive && (
                    <TutorialOverlay
                        steps={TUTORIAL_STEPS}
                        currentStepIndex={tutorialStepIndex}
                        onNextStep={() => setTutorialStepIndex(prev => prev + 1)}
                        onComplete={() => { setIsTutorialActive(false); alert("Gratulálok, kész az alapozó!"); }}
                    />
                )}
            </main>
        </div>
    );
};

const App = () => {
    return (
        <TarotProvider>
            <AppContent />
        </TarotProvider>
    );
};

export default App;
