import React, { useState, useEffect, useMemo } from 'react';
import { 
  Film, 
  Flame, 
  Trophy, 
  Sparkles, 
  Tv, 
  Clapperboard, 
  Compass, 
  Zap, 
  Eye, 
  SlidersHorizontal,
  Bookmark,
  Shield
} from 'lucide-react';
import { MovieItem, FilterOptions, WatchProgress, MediaType } from './types';
import { MOVIES_DATABASE } from './data/moviesData';
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
import { AdminDashboard } from './components/admin/AdminDashboard';
import { useAuth } from './context/AuthContext';
import { usePlayer } from './context/PlayerContext';

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
  const { playContent } = usePlayer();

  // Navigation tabs: 'home' | 'movies' | 'tv' | 'anime' | 'documentary' | 'watchlist'
  const [activeTab, setActiveTab] = useState<'home' | 'movies' | 'tv' | 'anime' | 'documentary' | 'watchlist' | 'admin'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);

  // Modals state
  const [selectedMovie, setSelectedMovie] = useState<MovieItem | null>(null);
  const [activePlayingMovie, setActivePlayingMovie] = useState<{ movie: MovieItem; episodeId?: string } | null>(null);
  const [watchPartyMovie, setWatchPartyMovie] = useState<MovieItem | null>(null);
  const [downloadTargetMovie, setDownloadTargetMovie] = useState<MovieItem | null>(null);
  const [isTechSpecsOpen, setIsTechSpecsOpen] = useState(false);
  const [isDownloadsOpen, setIsDownloadsOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

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

  // Watchlist & History persistence in localStorage
  const [watchlist, setWatchlist] = useState<MovieItem[]>(() => {
    try {
      const saved = localStorage.getItem('cinexus_watchlist');
      if (saved) {
        const ids: string[] = JSON.parse(saved);
        return MOVIES_DATABASE.filter(m => ids.includes(m.id));
      }
    } catch {
      // fallback
    }
    // Default pre-saved favorites
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
    return MOVIES_DATABASE.filter(movie => {
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
      return 0; // default trending
    });
  }, [activeTab, filters, searchQuery]);

  // Featured Blockbuster Heroes for carousel
  const featuredHeroes = useMemo(() => {
    return MOVIES_DATABASE.filter(m => m.isFeaturedHero);
  }, []);

  // Row Segmentations
  const top10Movies = useMemo(() => {
    return MOVIES_DATABASE.filter(m => m.isTop10 !== undefined).sort((a, b) => (a.isTop10 || 99) - (b.isTop10 || 99));
  }, []);

  const continueWatchingMovies = useMemo(() => {
    const ids = Object.keys(watchProgressMap);
    return MOVIES_DATABASE.filter(m => ids.includes(m.id));
  }, [watchProgressMap]);

  const trendingBlockbusters = useMemo(() => {
    return MOVIES_DATABASE.filter(m => m.isTrendingToday);
  }, []);

  const sciFiCyberpunk = useMemo(() => {
    return MOVIES_DATABASE.filter(m => m.genres.includes('Sci-Fi') || m.genres.includes('Cyberpunk'));
  }, []);

  const prestigeTvAndAnime = useMemo(() => {
    return MOVIES_DATABASE.filter(m => m.mediaType === 'tv' || m.mediaType === 'anime');
  }, []);

  const awardWinningDrama = useMemo(() => {
    return MOVIES_DATABASE.filter(m => m.rating >= 8.5);
  }, []);

  const actionThrillers = useMemo(() => {
    return MOVIES_DATABASE.filter(m => m.genres.includes('Action') || m.genres.includes('Thriller'));
  }, []);

  const natureDocu = useMemo(() => {
    return MOVIES_DATABASE.filter(m => m.mediaType === 'documentary');
  }, []);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-red-600 selection:text-white">
      
      {/* Universal Fixed Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        movies={MOVIES_DATABASE}
        onSelectMovie={(m) => setSelectedMovie(m)}
        onOpenWatchParty={() => setWatchPartyMovie(MOVIES_DATABASE[0])}
        onOpenTechSpecs={() => setIsTechSpecsOpen(true)}
        onOpenDownloads={() => { setDownloadTargetMovie(MOVIES_DATABASE[0]); setIsDownloadsOpen(true); }}
        onOpenAdmin={() => setIsAdminDashboardOpen(true)}
        onOpenSearchModal={() => setIsSearchModalOpen(true)}
        watchlistCount={watchlist.length}
        toggleFilters={() => setIsFilterOpen(!isFilterOpen)}
        isFilterOpen={isFilterOpen}
      />

      {/* Main Content Area */}
      <main className="flex-1 pt-16 md:pt-20">
        
        {/* Watchlist View Tab */}
        {activeTab === 'watchlist' ? (
          <WatchlistView
            watchlist={watchlist}
            watchProgressMap={watchProgressMap}
            onPlayMovie={handlePlayMovie}
            onOpenDetails={(m) => setSelectedMovie(m)}
            onRemoveFromWatchlist={removeFromWatchlist}
            onBrowseCatalog={() => setActiveTab('home')}
          />
        ) : (
          <>
            {/* Filter Panel (if toggled or query active) */}
            <FilterSection
              filters={filters}
              setFilters={setFilters}
              resetFilters={() => setFilters(DEFAULT_FILTERS)}
              isOpen={isFilterOpen}
              totalFilteredCount={filteredCatalog.length}
            />

            {/* If actively searching or filtering specific category outside home */}
            {isFilterOpen || searchQuery.trim() || activeTab !== 'home' ? (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                
                {/* Active Category Header */}
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold font-cinema text-white capitalize">
                      {searchQuery ? `Search results for "${searchQuery}"` : activeTab === 'home' ? 'Filtered Cinema Collection' : `${activeTab} Master Catalog`}
                    </h2>
                    <p className="text-xs text-slate-400">
                      Showing {filteredCatalog.length} titles in Ultra HD
                    </p>
                  </div>

                  <span className="text-xs px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 font-bold">
                    4K MASTER LIBRARY
                  </span>
                </div>

                {/* Filtered Grid Output */}
                {filteredCatalog.length === 0 ? (
                  <div className="py-20 text-center space-y-3 bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl p-8">
                    <Film className="w-12 h-12 text-slate-600 mx-auto" />
                    <h3 className="text-base font-bold text-white">No Matching Cinema Titles</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Try adjusting your minimum rating or genre filters to explore more movies.
                    </p>
                    <button
                      onClick={() => { setFilters(DEFAULT_FILTERS); setSearchQuery(''); }}
                      className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold shadow"
                    >
                      Reset All Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                    {filteredCatalog.map(movie => (
                      <div
                        key={movie.id}
                        id={`catalog-grid-${movie.id}`}
                        onClick={() => setSelectedMovie(movie)}
                        className="group relative bg-[#0c1017] border border-slate-800/80 hover:border-red-500/60 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col cursor-pointer"
                      >
                        <div className="aspect-[2/3] w-full relative overflow-hidden bg-slate-950">
                          <img
                            src={movie.posterUrl}
                            alt={movie.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                            {movie.quality}
                          </div>
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-bold text-amber-400">
                            ★ {movie.rating}
                          </div>
                        </div>
                        <div className="p-3">
                          <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                            {movie.title}
                          </h4>
                          <div className="text-[11px] text-slate-400 flex items-center justify-between mt-1">
                            <span>{movie.genres[0]}</span>
                            <span>{movie.releaseYear}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            ) : (
              /* Standard Cinema Dashboard */
              <>
                {/* Hero Featured Blockbuster Carousel */}
                <HeroBanner
                  featuredMovies={featuredHeroes}
                  onPlayMovie={handlePlayMovie}
                  onOpenDetails={(m) => setSelectedMovie(m)}
                  isInWatchlist={isInWatchlist}
                  onToggleWatchlist={toggleWatchlist}
                />

                {/* Tech Highlights Statistics Banner */}
                <StatsBanner />

                {/* 1. Continue Watching Row (if user has watch progress) */}
                {continueWatchingMovies.length > 0 && (
                  <MovieRow
                    id="continue-watching"
                    title="Continue Watching"
                    subtitle="Resume right where you left off with synchronized 4K HDR playback"
                    icon={<Eye className="w-5 h-5 text-red-500" />}
                    badge="ACTIVE SESSIONS"
                    movies={continueWatchingMovies}
                    onPlayMovie={handlePlayMovie}
                    onOpenDetails={(m) => setSelectedMovie(m)}
                    isInWatchlist={isInWatchlist}
                    onToggleWatchlist={toggleWatchlist}
                    watchProgressMap={watchProgressMap}
                  />
                )}

                {/* 2. Top 10 Today in HD (Ranking 1-10 layout) */}
                <MovieRow
                  id="top-10"
                  title="Top 10 Today in HD"
                  subtitle="The most-streamed master titles across all regions right now"
                  icon={<Trophy className="w-5 h-5 text-amber-400" />}
                  badge="GLOBAL CHARTS"
                  movies={top10Movies}
                  isTop10={true}
                  onPlayMovie={handlePlayMovie}
                  onOpenDetails={(m) => setSelectedMovie(m)}
                  isInWatchlist={isInWatchlist}
                  onToggleWatchlist={toggleWatchlist}
                  watchProgressMap={watchProgressMap}
                />

                {/* 3. Trending Blockbusters */}
                <MovieRow
                  id="trending-now"
                  title="Trending & Popular"
                  subtitle="Critically celebrated cinema with Dolby Atmos surround mixes"
                  icon={<Flame className="w-5 h-5 text-red-500" />}
                  movies={trendingBlockbusters}
                  onPlayMovie={handlePlayMovie}
                  onOpenDetails={(m) => setSelectedMovie(m)}
                  isInWatchlist={isInWatchlist}
                  onToggleWatchlist={toggleWatchlist}
                  watchProgressMap={watchProgressMap}
                />

                {/* 4. Sci-Fi & Cyberpunk */}
                <MovieRow
                  id="scifi-cyberpunk"
                  title="Sci-Fi & Cyberpunk Realities"
                  subtitle="Mind-bending visual effects, synth soundscapes, and futuristic dystopias"
                  icon={<Sparkles className="w-5 h-5 text-cyan-400" />}
                  badge="IMAX MASTERS"
                  movies={sciFiCyberpunk}
                  onPlayMovie={handlePlayMovie}
                  onOpenDetails={(m) => setSelectedMovie(m)}
                  isInWatchlist={isInWatchlist}
                  onToggleWatchlist={toggleWatchlist}
                  watchProgressMap={watchProgressMap}
                />

                {/* 5. Prestige TV Series & Anime */}
                <MovieRow
                  id="prestige-tv-anime"
                  title="Prestige Series & Animation"
                  subtitle="Multi-episode sagas with full HDR color grading and original voice dubs"
                  icon={<Tv className="w-5 h-5 text-purple-400" />}
                  movies={prestigeTvAndAnime}
                  onPlayMovie={handlePlayMovie}
                  onOpenDetails={(m) => setSelectedMovie(m)}
                  isInWatchlist={isInWatchlist}
                  onToggleWatchlist={toggleWatchlist}
                  watchProgressMap={watchProgressMap}
                />

                {/* 6. Award-Winning Masterpieces */}
                <MovieRow
                  id="award-winners"
                  title="Acclaimed Masterpieces"
                  subtitle="IMDb 8.5+ ratings and Academy Award winners in native 4K"
                  icon={<Clapperboard className="w-5 h-5 text-amber-300" />}
                  movies={awardWinningDrama}
                  onPlayMovie={handlePlayMovie}
                  onOpenDetails={(m) => setSelectedMovie(m)}
                  isInWatchlist={isInWatchlist}
                  onToggleWatchlist={toggleWatchlist}
                  watchProgressMap={watchProgressMap}
                />

                {/* 7. Action & Adrenaline */}
                <MovieRow
                  id="action-thrillers"
                  title="Action, Crime & Thrillers"
                  subtitle="High-octane stunt choreography, vehicular mayhem, and suspense"
                  icon={<Zap className="w-5 h-5 text-yellow-400" />}
                  movies={actionThrillers}
                  onPlayMovie={handlePlayMovie}
                  onOpenDetails={(m) => setSelectedMovie(m)}
                  isInWatchlist={isInWatchlist}
                  onToggleWatchlist={toggleWatchlist}
                  watchProgressMap={watchProgressMap}
                />

                {/* 8. Nature & Documentaries */}
                <MovieRow
                  id="nature-docs"
                  title="Groundbreaking Documentaries"
                  subtitle="Native 8K RED captures of breathtaking wildlife journeys and human limits"
                  icon={<Compass className="w-5 h-5 text-emerald-400" />}
                  movies={natureDocu}
                  onPlayMovie={handlePlayMovie}
                  onOpenDetails={(m) => setSelectedMovie(m)}
                  isInWatchlist={isInWatchlist}
                  onToggleWatchlist={toggleWatchlist}
                  watchProgressMap={watchProgressMap}
                />
              </>
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-800/80 bg-[#0c1017] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-600 text-white font-black font-cinema">
              CX
            </div>
            <div>
              <span className="font-bold text-white font-cinema tracking-wider text-sm block">CINEXUS HD</span>
              <span>Ultra Cinema Discovery & Streaming Platform</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-medium">
            <button onClick={() => setIsTechSpecsOpen(true)} className="hover:text-white transition-colors">4K Tech Specs</button>
            <button onClick={() => setWatchPartyMovie(MOVIES_DATABASE[0])} className="hover:text-white transition-colors">Watch Party Lounge</button>
            <button onClick={() => { setDownloadTargetMovie(MOVIES_DATABASE[0]); setIsDownloadsOpen(true); }} className="hover:text-white transition-colors">Offline Downloads</button>
            <button onClick={() => setActiveTab('watchlist')} className="hover:text-white transition-colors">My Watchlist</button>
          </div>

          <div className="text-slate-500 font-mono text-[11px]">
            © {new Date().getFullYear()} Cinexus HD. Mastered in 4K HDR & Dolby Atmos.
          </div>

        </div>
      </footer>

      {/* MODALS */}

      {/* 1. Movie Details Modal */}
      {selectedMovie && (
        <MovieDetailsModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onPlayMovie={(m, epId) => {
            setSelectedMovie(null);
            handlePlayMovie(m, epId);
          }}
          isInWatchlist={isInWatchlist}
          onToggleWatchlist={toggleWatchlist}
          onOpenWatchPartyWithMovie={(m) => {
            setSelectedMovie(null);
            setWatchPartyMovie(m);
          }}
          onOpenDownloadsWithMovie={(m) => {
            setDownloadTargetMovie(m);
            setIsDownloadsOpen(true);
          }}
          allMovies={MOVIES_DATABASE}
          onSelectSimilarMovie={(m) => setSelectedMovie(m)}
        />
      )}

      {/* 2. Fullscreen Video Player Modal */}
      {activePlayingMovie && (
        <VideoPlayerModal
          movie={activePlayingMovie.movie}
          episodeId={activePlayingMovie.episodeId}
          initialTime={watchProgressMap[activePlayingMovie.movie.id]?.currentTime || 0}
          onClose={handleCloseVideoPlayer}
        />
      )}

      {/* 3. Watch Party Modal */}
      {watchPartyMovie && (
        <WatchPartyModal
          movie={watchPartyMovie}
          onClose={() => setWatchPartyMovie(null)}
          onStartWatchMovie={(m) => {
            setWatchPartyMovie(null);
            handlePlayMovie(m);
          }}
        />
      )}

      {/* 4. Tech Specs Analyzer Modal */}
      {isTechSpecsOpen && (
        <TechSpecsModal onClose={() => setIsTechSpecsOpen(false)} />
      )}

      {/* 5. Offline Download Manager Modal */}
      {isDownloadsOpen && (
        <DownloadModal
          movie={downloadTargetMovie}
          onClose={() => setIsDownloadsOpen(false)}
          onPlayMovie={(m) => {
            setIsDownloadsOpen(false);
            handlePlayMovie(m);
          }}
        />
      )}

      {/* 6. Admin Studio Management Console */}
      {(isAdminDashboardOpen || activeTab === 'admin') && (
        <AdminDashboard
          onClose={() => {
            setIsAdminDashboardOpen(false);
            if (activeTab === 'admin') setActiveTab('home');
          }}
          onSelectMovie={(m) => {
            setIsAdminDashboardOpen(false);
            if (activeTab === 'admin') setActiveTab('home');
            setSelectedMovie(m);
          }}
        />
      )}

      {/* Persistent Floating Admin Studio Quick Launcher */}
      <button
        id="floating-admin-launcher-btn"
        onClick={() => setIsAdminDashboardOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-bold text-xs shadow-2xl shadow-red-950/80 border border-red-400/40 hover:scale-105 active:scale-95 transition-all group cursor-pointer"
        title="Open Admin Dashboard (TMDB 1-Click Importer & CMS)"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        <Shield className="w-4 h-4 text-white" />
        <span>Admin Dashboard</span>
        <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-black/40 text-[10px] text-red-200 uppercase font-mono">
          STUDIO
        </span>
      </button>

      {/* 7. TMDB Global 4K Live Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectMovie={(m) => {
          setIsSearchModalOpen(false);
          setSelectedMovie(m);
        }}
      />

      {/* 8. User Auth & Role Modal */}
      <AuthModal />

    </div>
  );
};
