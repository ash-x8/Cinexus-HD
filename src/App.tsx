import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Film, 
  Flame, 
  Trophy, 
  Sparkles, 
  Tv, 
  Clapperboard, 
  Compass, 
  Zap,
  Bookmark,
  SlidersHorizontal,
  Search,
  User,
  Shield
} from 'lucide-react';
import { MovieItem, FilterOptions, WatchProgress } from './types';
import { MOVIES_DATABASE } from './data/moviesData';
import { 
  initializeFirestoreDatabase, 
  subscribeToMovies, 
  subscribeToSettings 
} from './services/firestore';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { MovieRow } from './components/MovieRow';
import { MovieDetailsModal } from './components/MovieDetailsModal';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { FilterSection } from './components/FilterSection';
import { WatchPartyModal } from './components/WatchPartyModal';
import { TechSpecsModal } from './components/TechSpecsModal';
import { DownloadModal } from './components/DownloadModal';
import { WatchlistView } from './components/WatchlistView';
import { StatsBanner } from './components/StatsBanner';
import { AuthModal } from './components/auth/AuthModal';
import { SearchModal } from './components/search/SearchModal';
import { UserProfileModal } from './components/profile/UserProfileModal';
import { MaintenanceScreen } from './components/maintenance/MaintenanceScreen';
import { AdminPortal } from './components/admin/AdminPortal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { Logo } from './components/common/Logo';
import { 
  AboutPage, 
  ContactPage, 
  PrivacyPolicyPage, 
  TermsOfServicePage, 
  GenresPage 
} from './components/pages/StaticPages';
import { WatchPage } from './components/pages/WatchPage';
import { useAuth } from './context/AuthContext';
import { BRANDING } from './config/branding';

const DEFAULT_FILTERS: FilterOptions = {
  searchQuery: '',
  mediaType: 'all',
  genre: 'all',
  quality: 'all',
  minRating: 6.0,
  minYear: 2010,
  maxYear: 2026,
  sortBy: 'trending'
};

export const App: React.FC = () => {
  const { user, openAuthModal, logout } = useAuth();

  // Navigation and Route State
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname.toLowerCase();
  });
  const [activeTab, setActiveTab] = useState<'home' | 'movies' | 'tv' | 'anime' | 'documentary' | 'watchlist'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);

  // Dynamic Custom Catalog from Server
  const [serverContent, setServerContent] = useState<MovieItem[]>([]);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [adminBypassed, setAdminBypassed] = useState(false);

  // Modals state
  const [selectedMovie, setSelectedMovie] = useState<MovieItem | null>(null);
  const [activePlayingMovie, setActivePlayingMovie] = useState<{ movie: MovieItem; episodeId?: string } | null>(null);
  const [watchPartyMovie, setWatchPartyMovie] = useState<MovieItem | null>(null);
  const [downloadTargetMovie, setDownloadTargetMovie] = useState<MovieItem | null>(null);
  const [isTechSpecsOpen, setIsTechSpecsOpen] = useState(false);
  const [isDownloadsOpen, setIsDownloadsOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Watchlist & History state
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cinexus_watchlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [watchProgressMap, setWatchProgressMap] = useState<Record<string, WatchProgress>>(() => {
    try {
      const saved = localStorage.getItem('cinexus_watch_progress');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Route Listener for all public and admin paths
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/admin' || hash === '#/admin' || hash === '#admin') {
        setCurrentPath('/admin');
      } else if (path.startsWith('/watch/')) {
        setCurrentPath(path);
      } else if (path === '/movies') {
        setCurrentPath('/movies');
        setActiveTab('movies');
      } else if (path === '/tv') {
        setCurrentPath('/tv');
        setActiveTab('tv');
      } else if (path === '/anime') {
        setCurrentPath('/anime');
        setActiveTab('anime');
      } else if (path === '/watchlist') {
        setCurrentPath('/watchlist');
        setActiveTab('watchlist');
      } else if (['/genres', '/about', '/contact', '/privacy', '/terms'].includes(path)) {
        setCurrentPath(path);
      } else {
        setCurrentPath('/');
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Keyboard shortcut listener for TMDB search (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initialize and subscribe to Firestore realtime database
  useEffect(() => {
    initializeFirestoreDatabase();
    const unsubMovies = subscribeToMovies((liveList) => {
      if (liveList && liveList.length > 0) {
        setServerContent(liveList);
      }
    });
    const unsubSettings = subscribeToSettings((liveSettings) => {
      if (liveSettings) {
        setIsMaintenanceMode(liveSettings.maintenanceMode);
      }
    });
    return () => {
      unsubMovies();
      unsubSettings();
    };
  }, []);

  // Combined Master Catalog
  const fullCatalog = useMemo(() => {
    if (serverContent.length > 0) {
      const customIds = new Set(serverContent.map(c => c.id));
      const staticFiltered = MOVIES_DATABASE.filter(m => !customIds.has(m.id));
      return [...serverContent, ...staticFiltered];
    }
    return MOVIES_DATABASE;
  }, [serverContent]);

  // Watch URL matching
  const watchMatch = currentPath.match(/^\/watch\/([^\/]+)(?:\/([^\/]+))?/);
  const watchMovieId = watchMatch ? watchMatch[1] : null;
  const watchEpisodeId = watchMatch ? watchMatch[2] : undefined;
  const watchTargetMovie = watchMovieId ? fullCatalog.find(m => m.id === watchMovieId || m.slug === watchMovieId) : null;

  // Watchlist handlers
  const toggleWatchlist = (movie: MovieItem) => {
    setWatchlist(prev => {
      const next = prev.includes(movie.id) ? prev.filter(id => id !== movie.id) : [movie.id, ...prev];
      try {
        localStorage.setItem('cinexus_watchlist', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const isInWatchlist = (movieId: string) => watchlist.includes(movieId);

  // Watch progress handlers
  const handleSaveProgress = (progress: WatchProgress) => {
    const progressKey = progress.movieId || progress.contentId || 'unknown';
    setWatchProgressMap(prev => {
      const next = { ...prev, [progressKey]: progress };
      try {
        localStorage.setItem('cinexus_watch_progress', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  // Video playback
  const handlePlayMovie = (movie: MovieItem, episodeId?: string) => {
    setActivePlayingMovie({ movie, episodeId });
    setSelectedMovie(null);
  };

  const handleCloseVideoPlayer = () => {
    setActivePlayingMovie(null);
  };

  // Filtered Catalog
  const filteredCatalog = useMemo(() => {
    return fullCatalog.filter(movie => {
      if (filters.mediaType !== 'all' && movie.mediaType !== filters.mediaType) return false;
      if (activeTab === 'movies' && movie.mediaType !== 'movie') return false;
      if (activeTab === 'tv' && movie.mediaType !== 'tv') return false;
      if (activeTab === 'anime' && !movie.genres?.some(g => g.toLowerCase().includes('anime') || g.toLowerCase().includes('animation'))) return false;
      if (activeTab === 'documentary' && !movie.genres?.some(g => g.toLowerCase().includes('documentary'))) return false;

      if (filters.genre !== 'all' && !movie.genres?.some(g => g.toLowerCase() === filters.genre.toLowerCase())) return false;
      if (filters.quality !== 'all' && movie.quality !== filters.quality) return false;
      if (movie.rating < filters.minRating) return false;
      if (filters.minYear !== undefined && movie.releaseYear < filters.minYear) return false;
      if (filters.maxYear !== undefined && movie.releaseYear > filters.maxYear) return false;

      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesTitle = movie.title.toLowerCase().includes(q);
        const matchesDirector = movie.director?.toLowerCase().includes(q);
        const matchesCast = movie.cast?.some(c => c.name.toLowerCase().includes(q));
        const matchesGenre = movie.genres?.some(g => g.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDirector && !matchesCast && !matchesGenre) return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'rating') return b.rating - a.rating;
      if (filters.sortBy === 'year') return b.releaseYear - a.releaseYear;
      if (filters.sortBy === 'title') return a.title.localeCompare(b.title);
      return (b.voteCount || 0) - (a.voteCount || 0);
    });
  }, [fullCatalog, filters, activeTab]);

  // Curated Row Subsets
  const trendingNow = useMemo(() => fullCatalog.filter(m => m.isTrending), [fullCatalog]);
  const sinhalaSubtitled = useMemo(() => fullCatalog.filter(m => m.subtitles?.some(s => s.language === 'si' || s.label.includes('Sinhala'))), [fullCatalog]);
  const fourKMasters = useMemo(() => fullCatalog.filter(m => m.quality === '4K Ultra HD' || m.quality === 'IMAX Enhanced'), [fullCatalog]);
  const sciFiCyberpunk = useMemo(() => fullCatalog.filter(m => m.genres?.some(g => ['Sci-Fi', 'Cyberpunk', 'Action'].includes(g))), [fullCatalog]);
  const natureDocumentaries = useMemo(() => fullCatalog.filter(m => m.genres?.some(g => ['Documentary', 'Nature'].includes(g))), [fullCatalog]);
  const continueWatching = useMemo(() => {
    return Object.values(watchProgressMap)
      .map(p => ({ progress: p, movie: fullCatalog.find(m => m.id === p.movieId) }))
      .filter((item): item is { progress: WatchProgress; movie: MovieItem } => !!item.movie);
  }, [watchProgressMap, fullCatalog]);

  // ============================================================
  // MAINTENANCE MODE VIEW (If platform is under maintenance)
  // ============================================================
  if (isMaintenanceMode && !adminBypassed && (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN'))) {
    return (
      <MaintenanceScreen
        onAdminBypass={() => {
          if (user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
            setAdminBypassed(true);
          } else {
            openAuthModal();
          }
        }}
      />
    );
  }

  // ============================================================
  // ADMIN DASHBOARD ROUTE (`/admin`)
  // ============================================================
  if (currentPath === '/admin') {
    const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');

    if (!isAdmin) {
      return (
        <AdminPortal
          onAccessGranted={() => {
            setCurrentPath('/admin');
          }}
          onBackToSite={() => {
            window.history.pushState({}, '', '/');
            setCurrentPath('/');
          }}
        />
      );
    }

    return (
      <AdminDashboard
        onBackToSite={() => {
          window.history.pushState({}, '', '/');
          setCurrentPath('/');
        }}
        onLogout={() => {
          logout();
          window.history.pushState({}, '', '/');
          setCurrentPath('/');
        }}
      />
    );
  }

  // ============================================================
  // MAIN CLIENT STREAMING PLATFORM
  // ============================================================
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-200 flex flex-col antialiased selection:bg-red-600 selection:text-white pb-20 md:pb-0">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        movies={fullCatalog}
        onSelectMovie={(m) => setSelectedMovie(m)}
        onOpenSearchModal={() => setIsSearchModalOpen(true)}
        onOpenFilter={() => setIsFilterOpen(!isFilterOpen)}
        onOpenWatchlist={() => setActiveTab('watchlist')}
        onOpenProfile={() => {
          if (user) {
            setIsProfileModalOpen(true);
          } else {
            openAuthModal();
          }
        }}
      />

      {/* Main Content Body */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        
        {/* Watch Route: /watch/:id or /watch/:id/:episodeId */}
        {currentPath.startsWith('/watch/') && watchTargetMovie ? (
          <WatchPage
            movie={watchTargetMovie}
            initialEpisodeId={watchEpisodeId}
            onBack={() => navigate('/')}
            onSelectMovie={(m) => navigate(`/watch/${m.id}`)}
            isInWatchlist={isInWatchlist}
            onToggleWatchlist={toggleWatchlist}
            onSaveProgress={handleSaveProgress}
            allMovies={fullCatalog}
          />
        ) : currentPath === '/about' ? (
          <AboutPage onBack={() => navigate('/')} />
        ) : currentPath === '/contact' ? (
          <ContactPage onBack={() => navigate('/')} />
        ) : currentPath === '/privacy' ? (
          <PrivacyPolicyPage onBack={() => navigate('/')} />
        ) : currentPath === '/terms' ? (
          <TermsOfServicePage onBack={() => navigate('/')} />
        ) : currentPath === '/genres' ? (
          <GenresPage 
            onBack={() => navigate('/')} 
            onSelectGenre={(genre) => {
              setFilters({ ...DEFAULT_FILTERS, genre });
              navigate('/movies');
              setActiveTab('movies');
            }} 
          />
        ) : activeTab === 'watchlist' ? (
          <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <WatchlistView
              watchlist={fullCatalog.filter(m => watchlist.includes(m.id))}
              watchlistIds={watchlist}
              allMovies={fullCatalog}
              watchProgressMap={watchProgressMap}
              onSelectMovie={(m: MovieItem) => setSelectedMovie(m)}
              onOpenDetails={(m: MovieItem) => setSelectedMovie(m)}
              onPlayMovie={handlePlayMovie}
              onRemoveFromWatchlist={(id) => {
                setWatchlist(prev => prev.filter(item => item !== id));
              }}
              onBrowseCatalog={() => setActiveTab('home')}
            />
          </div>
        ) : (
          <>
            {/* Hero Cinema Showcase (Home Tab Only) */}
            {activeTab === 'home' && !filters.searchQuery && (
              <HeroBanner
                featuredMovies={fullCatalog.filter(m => m.isFeatured).slice(0, 5)}
                onPlayMovie={handlePlayMovie}
                onOpenDetails={(m) => setSelectedMovie(m)}
                onToggleWatchlist={toggleWatchlist}
                isInWatchlist={isInWatchlist}
              />
            )}

            {/* Filter Drawer / Accordion */}
            {isFilterOpen && (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
                <FilterSection
                  filters={filters}
                  setFilters={setFilters}
                  onReset={() => setFilters(DEFAULT_FILTERS)}
                  resultCount={filteredCatalog.length}
                />
              </div>
            )}

            {/* Filtered Grid View vs Standard Curated Rows */}
            {filters.searchQuery || filters.genre !== 'all' || filters.quality !== 'all' || activeTab !== 'home' ? (
              <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black text-white capitalize tracking-tight flex items-center gap-2">
                      {activeTab === 'movies' && <Film className="w-6 h-6 text-red-500" />}
                      {activeTab === 'tv' && <Tv className="w-6 h-6 text-cyan-400" />}
                      {activeTab === 'anime' && <Sparkles className="w-6 h-6 text-purple-400" />}
                      {activeTab === 'documentary' && <Compass className="w-6 h-6 text-emerald-400" />}
                      <span>{activeTab === 'home' ? 'Filtered Cinema Results' : `${activeTab} Master Catalog`}</span>
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                      Showing {filteredCatalog.length} 4K Ultra HD titles matched to your criteria.
                    </p>
                  </div>

                  <button
                    onClick={() => setFilters(DEFAULT_FILTERS)}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white"
                  >
                    Clear All Filters
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {filteredCatalog.map(movie => (
                    <div
                      key={movie.id}
                      onClick={() => setSelectedMovie(movie)}
                      className="group cursor-pointer rounded-2xl overflow-hidden bg-slate-900/80 border border-slate-800 hover:border-red-600 transition-all hover:scale-[1.03] hover:shadow-xl hover:shadow-red-950/40 flex flex-col"
                    >
                      <div className="relative aspect-[2/3] overflow-hidden bg-slate-950">
                        <img
                          src={movie.posterPath || movie.posterUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400'}
                          alt={movie.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md border border-white/10 text-[9px] font-bold text-red-400 uppercase">
                          {movie.quality || '4K'}
                        </div>
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[9px] font-bold text-amber-400">
                          ★ {movie.rating}
                        </div>
                      </div>
                      <div className="p-2.5 flex-1 flex flex-col justify-between">
                        <h4 className="text-xs font-bold text-white group-hover:text-red-400 truncate transition-colors">
                          {movie.title}
                        </h4>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                          <span>{movie.releaseYear}</span>
                          <span className="uppercase text-[9px] font-semibold">{movie.mediaType}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Standard Curated Rows */
              <div className="space-y-10 py-6 sm:py-8">
                
                {/* Continue Watching Row */}
                {continueWatching.length > 0 && (
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
                    <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                      <Flame className="w-4 h-4 text-red-500" />
                      <span>Continue Streaming</span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {continueWatching.slice(0, 5).map(({ movie, progress }) => {
                        const percent = progress.duration > 0 ? (progress.currentTime / progress.duration) * 100 : 0;
                        return (
                          <div
                            key={movie.id}
                            onClick={() => handlePlayMovie(movie)}
                            className="group cursor-pointer rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-red-500 transition-all p-2 space-y-2"
                          >
                            <div className="relative aspect-video rounded-xl overflow-hidden">
                              <img
                                src={movie.backdropPath || movie.posterPath || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400'}
                                alt={movie.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                                  ▶
                                </span>
                              </div>
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-white truncate">{movie.title}</h5>
                              <div className="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                                <div className="h-full bg-red-600" style={{ width: `${percent}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Trending Now */}
                <MovieRow
                  id="trending-now"
                  title="Trending Today Across CINEXUS"
                  subtitle="Highest stream density & 4K viewership in real-time"
                  icon={<Flame className="w-5 h-5 text-red-500" />}
                  badge="HOT"
                  movies={trendingNow}
                  onOpenDetails={(m) => setSelectedMovie(m)}
                  onSelectMovie={(m) => setSelectedMovie(m)}
                  onPlayMovie={handlePlayMovie}
                  onToggleWatchlist={toggleWatchlist}
                  isInWatchlist={isInWatchlist}
                  watchProgressMap={watchProgressMap}
                />

                {/* Sinhala Subtitles Row */}
                <MovieRow
                  id="sinhala-subtitles"
                  title="Sinhala Subtitled 4K Blockbusters (සිංහල උපසිරැසි)"
                  subtitle="Synchronized master Sinhala translation tracks"
                  icon={<Sparkles className="w-5 h-5 text-yellow-400" />}
                  badge="SINHALA SUB"
                  movies={sinhalaSubtitled}
                  onOpenDetails={(m) => setSelectedMovie(m)}
                  onSelectMovie={(m) => setSelectedMovie(m)}
                  onPlayMovie={handlePlayMovie}
                  onToggleWatchlist={toggleWatchlist}
                  isInWatchlist={isInWatchlist}
                  watchProgressMap={watchProgressMap}
                />

                {/* 4K Ultra HD & IMAX Enhanced */}
                <MovieRow
                  id="fourk-masters"
                  title="4K Ultra HD & IMAX Enhanced Cinema"
                  subtitle="Master visual tracks with Dolby Vision HDR & Atmos"
                  icon={<Trophy className="w-5 h-5 text-amber-400" />}
                  badge="4K MASTER"
                  movies={fourKMasters}
                  onOpenDetails={(m) => setSelectedMovie(m)}
                  onSelectMovie={(m) => setSelectedMovie(m)}
                  onPlayMovie={handlePlayMovie}
                  onToggleWatchlist={toggleWatchlist}
                  isInWatchlist={isInWatchlist}
                  watchProgressMap={watchProgressMap}
                />

                {/* Cyberpunk & Sci-Fi */}
                <MovieRow
                  id="scifi-cyberpunk"
                  title="Cyberpunk & Sci-Fi Dimensions"
                  subtitle="Futuristic thrillers, artificial intelligence & space exploration"
                  icon={<Zap className="w-5 h-5 text-cyan-400" />}
                  movies={sciFiCyberpunk}
                  onOpenDetails={(m) => setSelectedMovie(m)}
                  onSelectMovie={(m) => setSelectedMovie(m)}
                  onPlayMovie={handlePlayMovie}
                  onToggleWatchlist={toggleWatchlist}
                  isInWatchlist={isInWatchlist}
                  watchProgressMap={watchProgressMap}
                />

                {/* Nature Documentaries */}
                <MovieRow
                  id="nature-docs"
                  title="IMAX Wildlife & Earth Expeditions"
                  subtitle="Stunning planetary visuals captured in native 8K sensors"
                  icon={<Compass className="w-5 h-5 text-emerald-400" />}
                  movies={natureDocumentaries}
                  onOpenDetails={(m) => setSelectedMovie(m)}
                  onSelectMovie={(m) => setSelectedMovie(m)}
                  onPlayMovie={handlePlayMovie}
                  onToggleWatchlist={toggleWatchlist}
                  isInWatchlist={isInWatchlist}
                  watchProgressMap={watchProgressMap}
                />

                {/* Platform Live Stats */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                  <StatsBanner onOpenTechSpecs={() => setIsTechSpecsOpen(true)} />
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-slate-800/80 bg-[#07090e] py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-slate-500">|</span>
            <span className="text-slate-400 text-[11px]">{BRANDING.tagline}</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <button 
              onClick={() => {
                window.history.pushState({}, '', '/about');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }} 
              className="hover:text-white cursor-pointer transition-colors"
            >
              About
            </button>
            <span>•</span>
            <button 
              onClick={() => {
                window.history.pushState({}, '', '/genres');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }} 
              className="hover:text-white cursor-pointer transition-colors"
            >
              Genres
            </button>
            <span>•</span>
            <button 
              onClick={() => {
                window.history.pushState({}, '', '/contact');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }} 
              className="hover:text-white cursor-pointer transition-colors"
            >
              Contact
            </button>
            <span>•</span>
            <button 
              onClick={() => {
                window.history.pushState({}, '', '/privacy');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }} 
              className="hover:text-white cursor-pointer transition-colors"
            >
              Privacy
            </button>
            <span>•</span>
            <button 
              onClick={() => {
                window.history.pushState({}, '', '/terms');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }} 
              className="hover:text-white cursor-pointer transition-colors"
            >
              Terms
            </button>
            <span>•</span>
            <button onClick={() => setIsTechSpecsOpen(true)} className="hover:text-white cursor-pointer transition-colors">
              4K Architecture
            </button>
            <span>•</span>
            <span className="text-slate-500">© {new Date().getFullYear()} {BRANDING.name}</span>
          </div>
        </div>
      </footer>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSearch={() => setIsSearchModalOpen(true)}
        onOpenWatchlist={() => setActiveTab('watchlist')}
        onOpenProfile={() => {
          if (user) {
            setIsProfileModalOpen(true);
          } else {
            openAuthModal();
          }
        }}
      />

      {/* ============================================================ */}
      {/* GLOBAL MODALS */}
      {/* ============================================================ */}

      {/* Movie Details Modal */}
      {selectedMovie && (
        <MovieDetailsModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onPlayMovie={handlePlayMovie}
          onToggleWatchlist={toggleWatchlist}
          isInWatchlist={isInWatchlist}
          onSelectSimilarMovie={(m: MovieItem) => setSelectedMovie(m)}
          onOpenWatchPartyWithMovie={(m: MovieItem) => {
            setWatchPartyMovie(m);
            setSelectedMovie(null);
          }}
          onOpenDownloadsWithMovie={(m: MovieItem) => {
            setDownloadTargetMovie(m);
            setIsDownloadsOpen(true);
            setSelectedMovie(null);
          }}
          allMovies={fullCatalog}
        />
      )}

      {/* Video Player Modal */}
      {activePlayingMovie && (
        <VideoPlayerModal
          movie={activePlayingMovie.movie}
          episodeId={activePlayingMovie.episodeId}
          initialTime={watchProgressMap[activePlayingMovie.movie.id]?.currentTime || 0}
          onClose={handleCloseVideoPlayer}
        />
      )}

      {/* 4K Global TMDB Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectMovie={(movie) => {
          setSelectedMovie(movie);
          setIsSearchModalOpen(false);
        }}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        watchlist={fullCatalog.filter(m => watchlist.includes(m.id))}
        watchProgressMap={watchProgressMap}
        allMovies={fullCatalog}
        onPlayMovie={(m, epId) => {
          setIsProfileModalOpen(false);
          handlePlayMovie(m, epId);
        }}
        onOpenMovieDetail={(m) => {
          setIsProfileModalOpen(false);
          setSelectedMovie(m);
        }}
        onOpenAdmin={() => {
          setIsProfileModalOpen(false);
          window.history.pushState({}, '', '/admin');
          setCurrentPath('/admin');
        }}
        onClearHistory={() => {
          setWatchProgressMap({});
          localStorage.removeItem('cinexus_watch_progress');
        }}
      />

      {/* Watch Party Modal */}
      {watchPartyMovie && (
        <WatchPartyModal
          movie={watchPartyMovie}
          onClose={() => setWatchPartyMovie(null)}
          onStartWatchMovie={(m: MovieItem) => {
            setWatchPartyMovie(null);
            handlePlayMovie(m);
          }}
        />
      )}

      {/* 4K Tech Specs Modal */}
      {isTechSpecsOpen && (
        <TechSpecsModal
          onClose={() => setIsTechSpecsOpen(false)}
        />
      )}

      {/* Offline Download Hub Modal */}
      {isDownloadsOpen && (
        <DownloadModal
          movie={downloadTargetMovie || fullCatalog[0]}
          onClose={() => setIsDownloadsOpen(false)}
          onPlayMovie={(m: MovieItem) => {
            setIsDownloadsOpen(false);
            handlePlayMovie(m);
          }}
        />
      )}

      {/* Auth Modal */}
      <AuthModal />

    </div>
  );
};
