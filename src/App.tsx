import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Film, 
  Flame, 
  Trophy, 
  Sparkles, 
  Tv, 
  Clapperboard, 
  Compass, 
  Zap
} from 'lucide-react';
import { MovieItem, FilterOptions, WatchProgress } from './types';
import { MOVIES_DATABASE } from './data/moviesData';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { MovieRow } from './components/MovieRow';
import { MovieCard } from './components/MovieCard';
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
import { AdminPortal } from './components/admin/AdminPortal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { Logo } from './components/common/Logo';
import { useAuth } from './context/AuthContext';
import { BRANDING } from './config/branding';
import { api } from './services/api';

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
  const { user } = useAuth();

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

  // Modals state
  const [selectedMovie, setSelectedMovie] = useState<MovieItem | null>(null);
  const [activePlayingMovie, setActivePlayingMovie] = useState<{ movie: MovieItem; episodeId?: string } | null>(null);
  const [watchPartyMovie, setWatchPartyMovie] = useState<MovieItem | null>(null);
  const [downloadTargetMovie, setDownloadTargetMovie] = useState<MovieItem | null>(null);
  const [isTechSpecsOpen, setIsTechSpecsOpen] = useState(false);
  const [isDownloadsOpen, setIsDownloadsOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Route Listener for `/admin` URL access
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/admin' || hash === '#/admin' || hash === '#admin') {
        setCurrentPath('/admin');
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

  // Fetch server custom content
  const fetchServerData = useCallback(async () => {
    try {
      setServerContent(await api.getAdminContent());
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    fetchServerData();
  }, [fetchServerData]);

  // Combined Master Catalog
  const fullCatalog = useMemo(() => {
    const customIds = new Set(serverContent.map(c => c.id));
    const dedupedStatic = MOVIES_DATABASE.filter(m => !customIds.has(m.id));
    return [...serverContent, ...dedupedStatic];
  }, [serverContent]);

  // Watchlist & History persistence in localStorage
  const [watchlist, setWatchlist] = useState<MovieItem[]>(() => {
    try {
      const saved = localStorage.getItem('cinexus_watchlist');
      if (saved) {
        const ids: string[] = JSON.parse(saved);
        return MOVIES_DATABASE.filter(m => ids.includes(m.id));
      }
    } catch {}
    return MOVIES_DATABASE.filter(m => ['dune-part-two', 'cyberpunk-edgerunners', 'oppenheimer'].includes(m.id));
  });

  const [watchProgressMap, setWatchProgressMap] = useState<Record<string, WatchProgress>>(() => {
    try {
      const saved = localStorage.getItem('cinexus_watch_progress');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      'dune-part-two': {
        movieId: 'dune-part-two',
        currentTime: 3450,
        duration: 9960,
        percentage: 35,
        lastWatchedAt: 'Yesterday'
      },
      'the-last-of-us': {
        movieId: 'the-last-of-us',
        currentTime: 1820,
        duration: 3180,
        percentage: 57,
        lastWatchedAt: '2 days ago'
      }
    };
  });

  // Sync watchlist to localStorage
  useEffect(() => {
    try {
      const ids = watchlist.map(m => m.id);
      localStorage.setItem('cinexus_watchlist', JSON.stringify(ids));
    } catch {}
  }, [watchlist]);

  // Sync watch progress to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cinexus_watch_progress', JSON.stringify(watchProgressMap));
    } catch {}
  }, [watchProgressMap]);

  const isInWatchlist = (movieId: string) => {
    return watchlist.some(m => m.id === movieId);
  };

  const toggleWatchlist = (movie: MovieItem) => {
    if (isInWatchlist(movie.id)) {
      setWatchlist(prev => prev.filter(m => m.id !== movie.id));
    } else {
      setWatchlist(prev => [movie, ...prev]);
    }
  };

  const removeFromWatchlist = (movieId: string) => {
    setWatchlist(prev => prev.filter(m => m.id !== movieId));
  };

  // Video playback callbacks
  const handlePlayMovie = (movie: MovieItem, episodeId?: string) => {
    setActivePlayingMovie({ movie, episodeId });
  };

  const handleCloseVideoPlayer = (finalTime: number, duration: number) => {
    if (activePlayingMovie) {
      const percentage = duration > 0 ? Math.min(100, Math.round((finalTime / duration) * 100)) : 0;
      setWatchProgressMap(prev => ({
        ...prev,
        [activePlayingMovie.movie.id]: {
          movieId: activePlayingMovie.movie.id,
          currentTime: finalTime,
          duration,
          percentage,
          lastWatchedAt: 'Just now'
        }
      }));
    }
    setActivePlayingMovie(null);
  };

  // Filter and Category segmentation
  const filteredCatalog = useMemo(() => {
    return fullCatalog.filter(movie => {
      // Tab based filter
      if (activeTab === 'movies' && movie.mediaType !== 'movie') return false;
      if (activeTab === 'tv' && movie.mediaType !== 'tv') return false;
      if (activeTab === 'anime' && movie.mediaType !== 'anime') return false;
      if (activeTab === 'documentary' && movie.mediaType !== 'documentary') return false;

      // Filter Bar filters
      if (filters.mediaType !== 'all' && movie.mediaType !== filters.mediaType) return false;
      if (filters.genre !== 'all' && !movie.genres.includes(filters.genre)) return false;
      if (filters.quality !== 'all' && movie.quality !== filters.quality) return false;
      if (movie.rating < filters.minRating) return false;
      if (filters.minYear && movie.releaseYear < filters.minYear) return false;
      if (filters.maxYear && movie.releaseYear > filters.maxYear) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = movie.title.toLowerCase().includes(q);
        const matchGenre = movie.genres.some(g => g.toLowerCase().includes(q));
        const matchCast = movie.cast?.some(c => c.name.toLowerCase().includes(q));
        const matchDirector = movie.techSpecs?.director?.toLowerCase().includes(q);
        if (!matchTitle && !matchGenre && !matchCast && !matchDirector) return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'rating') return b.rating - a.rating;
      if (filters.sortBy === 'year') return b.releaseYear - a.releaseYear;
      if (filters.sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });
  }, [fullCatalog, activeTab, filters, searchQuery]);

  // Featured Blockbuster Heroes for carousel
  const featuredHeroes = useMemo(() => {
    return fullCatalog.filter(m => m.isFeaturedHero || m.rating >= 8.6);
  }, [fullCatalog]);

  // Row Segmentations
  const top10Movies = useMemo(() => {
    return fullCatalog.filter(m => m.isTop10 !== undefined).sort((a, b) => (a.isTop10 || 99) - (b.isTop10 || 99));
  }, [fullCatalog]);

  const continueWatchingMovies = useMemo(() => {
    const ids = Object.keys(watchProgressMap);
    return fullCatalog.filter(m => ids.includes(m.id));
  }, [fullCatalog, watchProgressMap]);

  const trendingBlockbusters = useMemo(() => {
    return fullCatalog.filter(m => m.isTrendingToday || m.isTrending);
  }, [fullCatalog]);

  const sciFiCyberpunk = useMemo(() => {
    return fullCatalog.filter(m => m.genres.includes('Sci-Fi') || m.genres.includes('Cyberpunk'));
  }, [fullCatalog]);

  const prestigeTvAndAnime = useMemo(() => {
    return fullCatalog.filter(m => m.mediaType === 'tv' || m.mediaType === 'anime');
  }, [fullCatalog]);

  const awardWinningDrama = useMemo(() => {
    return fullCatalog.filter(m => m.rating >= 8.5);
  }, [fullCatalog]);

  const actionThrillers = useMemo(() => {
    return fullCatalog.filter(m => m.genres.includes('Action') || m.genres.includes('Thriller'));
  }, [fullCatalog]);

  const natureDocu = useMemo(() => {
    return fullCatalog.filter(m => m.mediaType === 'documentary');
  }, [fullCatalog]);

  // =========================================================================
  // ADMIN ROUTE HANDLING (/admin)
  // When user visits /admin:
  // - If not logged in as Admin, show AdminPortal (login gate).
  // - If logged in as Admin, show AdminDashboard.
  // =========================================================================
  if (currentPath === '/admin') {
    const isAdminUser = user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');

    if (!isAdminUser) {
      return (
        <AdminPortal
          onSuccess={() => {
            setCurrentPath('/admin');
          }}
          onExit={() => {
            window.history.pushState({}, '', '/');
            setCurrentPath('/');
          }}
        />
      );
    }

    return (
      <AdminDashboard
        onClose={() => {
          window.history.pushState({}, '', '/');
          setCurrentPath('/');
        }}
        onSelectMovie={(m: MovieItem) => setSelectedMovie(m)}
        onCatalogUpdated={fetchServerData}
      />
    );
  }

  // =========================================================================
  // MAIN PUBLIC SITE (Home, Movies, TV, Anime, Documentaries, Watchlist)
  // Zero admin buttons or hints are exposed here.
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-red-600 selection:text-white pb-16 md:pb-0">
      
      {/* Universal Fixed Header without any admin links */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        movies={fullCatalog}
        onSelectMovie={(m: MovieItem) => setSelectedMovie(m)}
        onOpenSearchModal={() => setIsSearchModalOpen(true)}
        onOpenFilter={() => setIsFilterOpen(!isFilterOpen)}
        onOpenWatchlist={() => setActiveTab('watchlist')}
      />

      {/* Main Streaming Content Area */}
      <main className="flex-1 pt-16 md:pt-20">
        
        {/* Watchlist View Tab */}
        {activeTab === 'watchlist' ? (
          <WatchlistView
            watchlist={watchlist}
            watchProgressMap={watchProgressMap}
            onPlayMovie={handlePlayMovie}
            onOpenDetails={(m: MovieItem) => setSelectedMovie(m)}
            onRemoveFromWatchlist={removeFromWatchlist}
            onBrowseCatalog={() => setActiveTab('home')}
          />
        ) : (
          <>
            {/* Filter Section Panel (if toggled) */}
            <FilterSection
              filters={filters}
              setFilters={setFilters}
              resetFilters={() => setFilters(DEFAULT_FILTERS)}
              isOpen={isFilterOpen}
              totalFilteredCount={filteredCatalog.length}
            />

            {/* Filtered Grid or Categorized Rails */}
            {isFilterOpen || searchQuery.trim() || activeTab !== 'home' ? (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                
                {/* Header */}
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white capitalize">
                      {searchQuery ? `Search results for "${searchQuery}"` : activeTab === 'home' ? 'Filtered Cinema Collection' : `${activeTab} Master Catalog`}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Showing {filteredCatalog.length} titles in 4K Ultra HD & Dolby Atmos
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setFilters(DEFAULT_FILTERS);
                    }}
                    className="text-xs text-red-400 hover:text-red-300 font-semibold"
                  >
                    Clear Filters
                  </button>
                </div>

                {/* Grid */}
                {filteredCatalog.length === 0 ? (
                  <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 space-y-3">
                    <Film className="w-12 h-12 text-slate-600 mx-auto" />
                    <h3 className="text-lg font-bold text-white">No Matching Titles Found</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Try adjusting your search criteria, quality filters, or search the global 4K TMDB catalog.
                    </p>
                    <button
                      onClick={() => setIsSearchModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-all shadow-md"
                    >
                      Search TMDB Live Catalog
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-3 gap-y-7 sm:gap-x-4 sm:gap-y-9">
                    {filteredCatalog.map(movie => (
                      <MovieCard
                        key={movie.id}
                        movie={movie}
                        onPlayMovie={handlePlayMovie}
                        onOpenDetails={(m: MovieItem) => setSelectedMovie(m)}
                        isInWatchlist={isInWatchlist}
                        onToggleWatchlist={toggleWatchlist}
                        watchProgress={watchProgressMap[movie.id]}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Standard Homepage Rows */
              <div className="space-y-8 sm:space-y-12 pb-12">
                
                {/* High-Impact Hero Banner Carousel */}
                <HeroBanner
                  featuredMovies={featuredHeroes}
                  onPlayMovie={handlePlayMovie}
                  onOpenDetails={(m: MovieItem) => setSelectedMovie(m)}
                  onToggleWatchlist={toggleWatchlist}
                  isInWatchlist={isInWatchlist}
                />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-12">
                  
                  {/* Continue Watching Row (if any progress) */}
                  {continueWatchingMovies.length > 0 && (
                    <MovieRow
                      id="row-continue-watching"
                      title="Continue Watching in 4K"
                      subtitle="Resume from your exact timestamp across all devices"
                      icon={<Zap className="w-5 h-5 text-amber-400" />}
                      movies={continueWatchingMovies}
                      watchProgressMap={watchProgressMap}
                      onOpenDetails={(m: MovieItem) => setSelectedMovie(m)}
                      onPlayMovie={handlePlayMovie}
                      onToggleWatchlist={toggleWatchlist}
                      isInWatchlist={isInWatchlist}
                    />
                  )}

                  {/* Top 10 Blockbusters in Ultra HD */}
                  {top10Movies.length > 0 && (
                    <MovieRow
                      id="row-top-10"
                      title="Top 10 Today in CINEXUS"
                      subtitle="Most streamed 4K cinematic releases this week"
                      icon={<Trophy className="w-5 h-5 text-amber-400" />}
                      movies={top10Movies}
                      isTop10={true}
                      onOpenDetails={(m: MovieItem) => setSelectedMovie(m)}
                      onPlayMovie={handlePlayMovie}
                      onToggleWatchlist={toggleWatchlist}
                      isInWatchlist={isInWatchlist}
                    />
                  )}

                  {/* Trending Now */}
                  <MovieRow
                    id="row-trending"
                    title="Trending Master Releases"
                    subtitle="Dolby Vision & Lossless Audio master prints"
                    icon={<Flame className="w-5 h-5 text-red-500" />}
                    movies={trendingBlockbusters}
                    onOpenDetails={(m: MovieItem) => setSelectedMovie(m)}
                    onPlayMovie={handlePlayMovie}
                    onToggleWatchlist={toggleWatchlist}
                    isInWatchlist={isInWatchlist}
                  />

                  {/* Sci-Fi & Cyberpunk */}
                  <MovieRow
                    id="row-scifi"
                    title="Sci-Fi & Cyberpunk Futures"
                    subtitle="Mind-bending visual spectacles in IMAX enhanced format"
                    icon={<Sparkles className="w-5 h-5 text-cyan-400" />}
                    movies={sciFiCyberpunk}
                    onOpenDetails={(m: MovieItem) => setSelectedMovie(m)}
                    onPlayMovie={handlePlayMovie}
                    onToggleWatchlist={toggleWatchlist}
                    isInWatchlist={isInWatchlist}
                  />

                  {/* Prestige TV Series & Anime */}
                  <MovieRow
                    id="row-prestige-tv"
                    title="Prestige Series & Master Anime"
                    subtitle="Binge complete seasons with Sinhala & Multi-language subtitles"
                    icon={<Tv className="w-5 h-5 text-purple-400" />}
                    movies={prestigeTvAndAnime}
                    onOpenDetails={(m: MovieItem) => setSelectedMovie(m)}
                    onPlayMovie={handlePlayMovie}
                    onToggleWatchlist={toggleWatchlist}
                    isInWatchlist={isInWatchlist}
                  />

                  {/* Award-Winning Masterpieces */}
                  <MovieRow
                    id="row-award-winning"
                    title="Critically Acclaimed Masterpieces"
                    subtitle="Titles rated 8.5+ with highest viewer ratings"
                    icon={<Clapperboard className="w-5 h-5 text-amber-500" />}
                    movies={awardWinningDrama}
                    onOpenDetails={(m: MovieItem) => setSelectedMovie(m)}
                    onPlayMovie={handlePlayMovie}
                    onToggleWatchlist={toggleWatchlist}
                    isInWatchlist={isInWatchlist}
                  />

                  {/* Adrenaline Action & Thrillers */}
                  <MovieRow
                    id="row-action"
                    title="Adrenaline Action & Edge-of-Seat Thrillers"
                    subtitle="High-octane soundscapes mixed for home theater immersion"
                    icon={<Flame className="w-5 h-5 text-orange-500" />}
                    movies={actionThrillers}
                    onOpenDetails={(m: MovieItem) => setSelectedMovie(m)}
                    onPlayMovie={handlePlayMovie}
                    onToggleWatchlist={toggleWatchlist}
                    isInWatchlist={isInWatchlist}
                  />

                  {/* Nature & Wildlife */}
                  <MovieRow
                    id="row-nature"
                    title="Wildlife & Nature Documentaries"
                    subtitle="Breathtaking 4K HDR captures of Earth's greatest wonders"
                    icon={<Compass className="w-5 h-5 text-emerald-400" />}
                    movies={natureDocu}
                    onOpenDetails={(m: MovieItem) => setSelectedMovie(m)}
                    onPlayMovie={handlePlayMovie}
                    onToggleWatchlist={toggleWatchlist}
                    isInWatchlist={isInWatchlist}
                  />

                  {/* Cinema Platform Stats Banner */}
                  <StatsBanner />

                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSearch={() => setIsSearchModalOpen(true)}
        onOpenWatchlist={() => setActiveTab('watchlist')}
      />

      {/* Clean Modern Public Footer */}
      <footer className="border-t border-slate-800/80 bg-[#07090e] py-10 px-4 sm:px-6 lg:px-8 text-slate-400 text-xs mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-[11px] text-slate-500">
              © {new Date().getFullYear()} {BRANDING.name} Cinematic Networks. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <button onClick={() => setActiveTab('movies')} className="hover:text-white transition-colors">Movies</button>
            <button onClick={() => setActiveTab('tv')} className="hover:text-white transition-colors">TV Series</button>
            <button onClick={() => setActiveTab('anime')} className="hover:text-white transition-colors">Anime</button>
            <button onClick={() => setActiveTab('watchlist')} className="hover:text-white transition-colors">Watchlist</button>
          </div>
        </div>
      </footer>

      {/* ===================================================================== */}
      {/* MODALS & OVERLAYS */}
      {/* ===================================================================== */}

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
