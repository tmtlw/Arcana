const CACHE_NAME = 'arkanum-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Lato:wght@300;400;700&display=swap'
];

// Ezt a listát szinkronban kell tartani az index.html-ben lévő CRITICAL_FILES-szal
const CRITICAL_FILES = [
  './types.ts',
  './constants/deck.ts',
  './constants/deckConstants.ts',
  './constants/astro.ts',
  './constants/ui.ts',
  './constants/quiz.ts',
  './constants/spreads.ts',
  './cards/major.ts', './cards/wands.ts', './cards/cups.ts', './cards/swords.ts', './cards/pentacles.ts',
  './lessons/basics.ts', './lessons/major.ts', './lessons/minor.ts', './lessons/reading.ts', './lessons/symbolism.ts',
  './constants/badges.ts', './constants/gamification.ts', './constants.ts', './constants/gameIcons.ts', './constants/shopItems.ts',
  './services/firebase.ts', './services/dbService.ts', './services/deckService.ts', './services/storageService.ts',
  './services/i18nService.ts', './services/communityService.ts', './services/adminService.ts',
  './services/astroService.ts', './services/analyticsHook.ts', './services/numerologyService.ts', './services/questService.ts',
  './components/CardImage.tsx', './components/CardModal.tsx', './components/MarkdownSupport.tsx', './components/ReadingAnalysis.tsx',
  './components/DashboardWidgets.tsx',
  './components/CardDetailView.tsx', './components/Dashboard.tsx', './components/ReadingView.tsx',
  './components/HistoryView.tsx', './components/LibraryView.tsx', './components/CustomSpreadBuilder.tsx',
  './components/AdvancedSpreadBuilder.tsx', './components/StatsView.tsx', './components/QuizView.tsx',
  './components/IconPicker.tsx', './components/ProfileView.tsx', './components/EducationView.tsx', './components/MultiplayerSession.tsx',
  './components/InstallView.tsx', './components/DeckBuilder.tsx', './components/DeckImportWizard.tsx',
  './components/MusicPlayer.tsx', './components/AuthView.tsx', './components/CommunityView.tsx',
  './components/RatingSystem.tsx', './components/CommentSection.tsx',
  './components/AchievementPopup.tsx', './components/HistoryHeatmap.tsx',
  './components/CommunityDecksView.tsx', './components/CommunitySpreadsView.tsx', './components/AdminDashboard.tsx',
  './components/NumerologyView.tsx', './components/AstroCalendarView.tsx', './components/CompareView.tsx',
  './components/BadgesView.tsx', './components/ContentEditor.tsx', './components/QuestLog.tsx', './components/QuestView.tsx', './components/TutorialOverlay.tsx', './services/UpdateService.ts',
  './components/MonthlySummaryView.tsx', './components/SoulCompass.tsx', './services/AnalysisService.ts', './components/DailyInsight.tsx', './components/AnalysisView.tsx', './components/MarketplaceView.tsx',
  './constants/horoscopes_western.ts', './constants/horoscopes_chinese.ts',
  './context/TarotContext.tsx', './App.tsx', './index.tsx'
];

const ALL_TO_CACHE = [...ASSETS, ...CRITICAL_FILES];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ALL_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
