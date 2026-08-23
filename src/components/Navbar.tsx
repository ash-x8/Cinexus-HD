import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Film, 
  Tv, 
  Bookmark, 
  Sparkles, 
  Flame, 
  Compass, 
  User, 
  X, 
  Menu,
  SlidersHorizontal,
  LogOut,
  Bell,
  Star,
  Check
} from 'lucide-react';
import { MovieItem, UserProfile } from '../types';
import { Logo } from './common/Logo';
import { useAuth } from '../context/AuthContext';
import { BRANDING } from '../config/branding';

interface NavbarProps {
  activeTab: 'home' | 'movies' | 'tv' | 'anime' | 'documentary' | 'watchlist';
  setActiveTab: (tab: 'home' | 'movies' | 'tv' | 'anime' | 'documentary' | 'watchlist') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  movies: MovieItem[];
  onSelectMovie: (movie: MovieItem) => void;
  onOpenSearchModal: () => void;
  onOpenFilter: () => void;
  onOpenWatchlist: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  movies,
  onSelectMovie,
  onOpenSearchModal,
  onOpenFilter,
  onOpenWatchlist
}) => {
  const { user, logout, openAuthModal } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const searchResults = !searchQuery.trim() 
    ? [] 
    : movies.filter(m => 
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.genres.some(g => g.toLowerCase().includes(searchQuery.toLowerCase())) ||
        m.cast?.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 5);

  return (
    <header 
      id="main-header"
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled 
          ? 'bg-[#07090e]/95 backdrop-blur-md border-b border-white/10 shadow-2xl py-2.5 sm:py-3' 
          : 'bg-gradient-to-b from-[#07090e]/90 via-[#07090e]/50 to-transparent py-3 sm:py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          
          {/* Left: Brand Logo & Primary Navigation */}
          <div className="flex items-center gap-6 lg:gap-8">
            <Logo 
              size="md" 
              showSubtitle={false}
              onClick={() => setActiveTab('home')}
              className="cursor-pointer"
            />

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 text-xs lg:text-sm font-medium">
              <button
                id="nav-home-btn"
                onClick={() => setActiveTab('home')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'home' 
                    ? 'text-white bg-red-600 font-bold shadow-md shadow-red-900/30' 
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Home</span>
              </button>

              <button
                id="nav-movies-btn"
                onClick={() => setActiveTab('movies')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'movies' 
                    ? 'text-white bg-red-600 font-bold shadow-md shadow-red-900/30' 
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Film className="w-4 h-4 text-red-400" />
                <span>Movies</span>
              </button>

              <button
                id="nav-tv-btn"
                onClick={() => setActiveTab('tv')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'tv' 
                    ? 'text-white bg-red-600 font-bold shadow-md shadow-red-900/30' 
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Tv className="w-4 h-4 text-cyan-400" />
                <span>TV Series</span>
              </button>

              <button
                id="nav-anime-btn"
                onClick={() => setActiveTab('anime')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'anime' 
                    ? 'text-white bg-red-600 font-bold shadow-md shadow-red-900/30' 
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Anime</span>
              </button>

              <button
                id="nav-docu-btn"
                onClick={() => setActiveTab('documentary')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'documentary' 
                    ? 'text-white bg-red-600 font-bold shadow-md shadow-red-900/30' 
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Compass className="w-4 h-4 text-emerald-400" />
                <span>Documentaries</span>
              </button>
            </nav>
          </div>

          {/* Right: Search, Filter, Notifications & Account */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            
            {/* Quick 4K TMDB Global Search Button */}
            <button
              id="btn-global-search-modal"
              onClick={onOpenSearchModal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-xs font-medium transition-all shadow-sm"
              title="Search 4K TMDB Catalog (Ctrl + K)"
            >
              <Search className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Search Catalog...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-black/40 text-[10px] text-slate-400 font-mono">
                ⌘K
              </kbd>
            </button>

            {/* Filter Drawer Trigger */}
            <button
              id="btn-open-filter-drawer"
              onClick={onOpenFilter}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all"
              title="Filter Catalog by Genre, Rating, Year"
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-300" />
            </button>

            {/* Watchlist Quick Access */}
            <button
              id="btn-open-watchlist-nav"
              onClick={() => {
                setActiveTab('watchlist');
                onOpenWatchlist();
              }}
              className={`p-2 rounded-xl border transition-all ${
                activeTab === 'watchlist' 
                  ? 'bg-red-600 border-red-500 text-white' 
                  : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white'
              }`}
              title="My Cinema Watchlist"
            >
              <Bookmark className="w-4 h-4" />
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                id="btn-notifications"
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-all"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              </button>

              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-[#0b0f17] border border-slate-700 rounded-2xl p-4 shadow-2xl z-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Premieres & Updates</span>
                    <button onClick={() => setNotificationOpen(false)} className="text-slate-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
                      <span className="font-bold text-white block">Dune: Part Two • 4K IMAX Master</span>
                      <span className="text-slate-400 text-[11px]">Now streaming with Dolby Atmos Lossless Audio.</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
                      <span className="font-bold text-white block">Sinhala Subtitles Engine v2</span>
                      <span className="text-slate-400 text-[11px]">Synced high-fidelity Sinhala subtitles available for top releases.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile / Auth Action */}
            {user ? (
              <div className="relative">
                <button
                  id="btn-user-avatar-menu"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-slate-600 transition-all"
                >
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-7 h-7 rounded-lg object-cover border border-slate-700"
                  />
                  <span className="hidden lg:inline text-xs font-semibold text-white max-w-[90px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#0b0f17] border border-slate-700 rounded-2xl p-3 shadow-2xl z-50 space-y-2.5">
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                      />
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold text-white truncate">{user.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                        <div className="mt-1 inline-block px-1.5 py-0.2 rounded bg-red-600/20 border border-red-500/40 text-[9px] text-red-400 font-bold">
                          VIP MEMBER
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <button
                        onClick={() => {
                          setActiveTab('watchlist');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2"
                      >
                        <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                        <span>My Saved Watchlist</span>
                      </button>

                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-950/40 flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="btn-nav-sign-in"
                onClick={() => openAuthModal()}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-950/50 cursor-pointer"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-900/80 border border-slate-700/80 text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-3 pb-2 border-t border-slate-800/80 mt-2 space-y-1">
            <button
              onClick={() => {
                setActiveTab('home');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 ${
                activeTab === 'home' ? 'bg-red-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Home</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('movies');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 ${
                activeTab === 'movies' ? 'bg-red-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Film className="w-4 h-4 text-red-400" />
              <span>Movies</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('tv');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 ${
                activeTab === 'tv' ? 'bg-red-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Tv className="w-4 h-4 text-cyan-400" />
              <span>TV Series</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('anime');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 ${
                activeTab === 'anime' ? 'bg-red-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Anime</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('documentary');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 ${
                activeTab === 'documentary' ? 'bg-red-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>Documentaries</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
