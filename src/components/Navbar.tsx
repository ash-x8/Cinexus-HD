import React, { useState, useEffect, useRef } from 'react';
import { 
  Film, 
  Search, 
  Bookmark, 
  Users, 
  Sparkles, 
  SlidersHorizontal,
  X,
  Play,
  Star,
  Tv,
  Clapperboard,
  Compass,
  HardDriveDownload,
  Shield,
  LogIn,
  LogOut,
  User,
  Settings,
  ChevronDown
} from 'lucide-react';
import { MovieItem } from '../types';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: 'home' | 'movies' | 'tv' | 'anime' | 'documentary' | 'watchlist' | 'admin';
  setActiveTab: (tab: 'home' | 'movies' | 'tv' | 'anime' | 'documentary' | 'watchlist' | 'admin') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  movies: MovieItem[];
  onSelectMovie: (movie: MovieItem) => void;
  onOpenWatchParty: () => void;
  onOpenTechSpecs: () => void;
  onOpenDownloads: () => void;
  onOpenAdmin?: () => void;
  onOpenSearchModal?: () => void;
  watchlistCount: number;
  toggleFilters: () => void;
  isFilterOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  movies,
  onSelectMovie,
  onOpenWatchParty,
  onOpenTechSpecs,
  onOpenDownloads,
  onOpenAdmin,
  onOpenSearchModal,
  watchlistCount,
  toggleFilters,
  isFilterOpen,
}) => {
  const { user, isAuthenticated, isAdmin, isSuperAdmin, openAuthModal, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = searchQuery.trim() === '' 
    ? [] 
    : movies.filter(m => 
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.genres.some(g => g.toLowerCase().includes(searchQuery.toLowerCase())) ||
        m.cast?.some(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 5);

  return (
    <header 
      id="cinexus-navbar"
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled 
          ? 'bg-[#07090e]/95 backdrop-blur-md shadow-2xl border-b border-slate-800/60 py-3' 
          : 'bg-gradient-to-b from-[#07090e]/90 via-[#07090e]/40 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <button 
            id="brand-logo-btn"
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2.5 group text-left focus:outline-none"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-red-700 to-rose-900 shadow-lg shadow-red-900/40 border border-red-500/30 group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5 text-white" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black font-cinema tracking-wider text-white flex items-center gap-1.5">
                CINEXUS <span className="text-xs px-1.5 py-0.5 rounded bg-red-600 font-sans tracking-tight font-bold text-white uppercase">HD</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Ultra Cinema Experience</span>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <button
              id="nav-home-btn"
              onClick={() => setActiveTab('home')}
              className={`px-3.5 py-1.5 rounded-lg transition-all ${
                activeTab === 'home'
                  ? 'text-white bg-slate-800/80 font-semibold shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-slate-850/50'
              }`}
            >
              Home
            </button>
            <button
              id="nav-movies-btn"
              onClick={() => setActiveTab('movies')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'movies'
                  ? 'text-white bg-slate-800/80 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-850/50'
              }`}
            >
              <Clapperboard className="w-4 h-4 text-red-500" />
              Movies
            </button>
            <button
              id="nav-tv-btn"
              onClick={() => setActiveTab('tv')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'tv'
                  ? 'text-white bg-slate-800/80 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-850/50'
              }`}
            >
              <Tv className="w-4 h-4 text-cyan-400" />
              TV Series
            </button>
            <button
              id="nav-anime-btn"
              onClick={() => setActiveTab('anime')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'anime'
                  ? 'text-white bg-slate-800/80 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-850/50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Anime
            </button>
            <button
              id="nav-doc-btn"
              onClick={() => setActiveTab('documentary')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'documentary'
                  ? 'text-white bg-slate-800/80 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-850/50'
              }`}
            >
              <Compass className="w-4 h-4 text-emerald-400" />
              Documentaries
            </button>

            {/* Admin Dashboard Nav Tab */}
            <button
              id="nav-admin-dashboard-btn"
              onClick={() => {
                if (onOpenAdmin) onOpenAdmin();
                setActiveTab('admin');
              }}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 border ${
                activeTab === 'admin'
                  ? 'text-white bg-red-600 border-red-500 font-bold shadow-lg shadow-red-900/50'
                  : 'text-red-300 bg-red-950/40 border-red-800/50 hover:bg-red-900/50 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4 text-red-400" />
              <span>Admin Dashboard</span>
              <span className="px-1.5 py-0.2 text-[9px] font-black rounded bg-red-500 text-white tracking-wider">
                LIVE
              </span>
            </button>
          </nav>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* TMDB Global Search Modal Trigger */}
          {onOpenSearchModal && (
            <button
              id="btn-open-tmdb-search"
              onClick={onOpenSearchModal}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-red-500/60 text-slate-300 hover:text-white transition-all text-xs font-medium"
              title="Search TMDB 4K Catalog (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-red-500" />
              <span>TMDB Search...</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono">⌘K</kbd>
            </button>
          )}

          {/* Quick Header Search Bar */}
          <div className="relative">
            <div className={`flex items-center bg-slate-900/90 border ${isSearchOpen || searchQuery ? 'border-red-500/80 w-52 sm:w-64' : 'border-slate-800 w-9 sm:w-48'} rounded-xl px-2.5 py-1.5 transition-all duration-300`}>
              <Search className="w-4 h-4 text-slate-400 shrink-0 cursor-pointer" onClick={() => setIsSearchOpen(!isSearchOpen)} />
              <input
                id="header-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search movies, actors..."
                className={`bg-transparent text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none ml-2 w-full ${
                  isSearchOpen || searchQuery ? 'block' : 'hidden sm:block'
                }`}
              />
              {searchQuery && (
                <button 
                  id="clear-search-btn"
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Live Search Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-[#0c1017] border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden z-50 p-2 space-y-1">
                <div className="text-[11px] font-semibold text-slate-400 px-3 py-1.5 uppercase tracking-wider border-b border-slate-800/60">
                  Search Results ({searchResults.length})
                </div>
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    id={`search-item-${item.id}`}
                    onClick={() => {
                      onSelectMovie(item);
                      setSearchQuery('');
                      setIsSearchOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/70 text-left transition-colors group"
                  >
                    <img 
                      src={item.posterUrl} 
                      alt={item.title} 
                      className="w-10 h-14 object-cover rounded-lg shrink-0 border border-slate-700/50"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate group-hover:text-red-400 transition-colors">
                        {item.title}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{item.releaseYear}</span>
                        <span>•</span>
                        <span className="flex items-center text-amber-400 font-medium">
                          <Star className="w-3 h-3 fill-amber-400 mr-1" />
                          {item.rating}
                        </span>
                        <span>•</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{item.quality}</span>
                      </div>
                    </div>
                    <Play className="w-4 h-4 text-slate-500 group-hover:text-red-400 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filters Toggle Button */}
          <button
            id="filter-toggle-btn"
            onClick={toggleFilters}
            className={`p-2 rounded-xl border transition-all ${
              isFilterOpen 
                ? 'bg-red-600/20 border-red-500/60 text-red-400' 
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
            title="Filter & Sort"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Admin Studio Trigger Button */}
          {onOpenAdmin && (
            <button
              id="btn-open-admin-studio"
              onClick={onOpenAdmin}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 via-red-700 to-rose-700 hover:from-red-500 hover:to-rose-600 border border-red-400/40 text-white transition-all text-xs font-bold shadow-lg shadow-red-950/60 group hover:scale-[1.03] active:scale-[0.98]"
              title="Open Admin Dashboard & TMDB Importer"
            >
              <Shield className="w-3.5 h-3.5 text-white animate-pulse" />
              <span className="inline">Admin Dashboard</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping" />
            </button>
          )}

          {/* Watch Party Modal Trigger */}
          <button
            id="watch-party-btn"
            onClick={onOpenWatchParty}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-950/80 to-purple-950/80 border border-indigo-500/40 text-indigo-300 hover:text-white hover:border-indigo-400 transition-all text-xs font-semibold shadow-sm"
            title="Watch Party Lounge"
          >
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>Party</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {/* Tech Specs Analyzer Trigger */}
          <button
            id="tech-specs-btn"
            onClick={onOpenTechSpecs}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-cyan-300 hover:text-white hover:border-cyan-400 transition-all text-xs font-semibold"
            title="Cinema 4K & Dolby Audio Specs"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>4K Specs</span>
          </button>

          {/* Offline Downloads */}
          <button
            id="downloads-btn"
            onClick={onOpenDownloads}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all"
            title="Offline Downloads Manager"
          >
            <HardDriveDownload className="w-4 h-4 text-slate-300" />
          </button>

          {/* My Watchlist Button */}
          <button
            id="nav-watchlist-btn"
            onClick={() => setActiveTab('watchlist')}
            className={`relative p-2 rounded-xl border transition-all ${
              activeTab === 'watchlist'
                ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-900/40'
                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
            }`}
            title="My Watchlist & Collections"
          >
            <Bookmark className="w-4 h-4" />
            {watchlistCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#07090e]">
                {watchlistCount}
              </span>
            )}
          </button>

          {/* User Account / Profile Menu */}
          <div className="relative" ref={userMenuRef}>
            {isAuthenticated && user ? (
              <button
                id="btn-user-profile-menu"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all"
              >
                <img
                  src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={user.name}
                  className="w-7 h-7 rounded-lg object-cover border border-red-500/60"
                />
                <span className="hidden md:inline text-xs font-semibold text-slate-200 max-w-[100px] truncate">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>
            ) : (
              <button
                id="btn-open-sign-in"
                onClick={() => openAuthModal('login')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold text-xs shadow-md shadow-red-950/40 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* User Dropdown Menu */}
            {isUserMenuOpen && isAuthenticated && user && (
              <div className="absolute right-0 mt-2 w-60 bg-[#0c1017] border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden z-50 p-2 space-y-1 animate-fadeIn">
                <div className="p-3 border-b border-slate-800/80">
                  <div className="text-xs font-bold text-white truncate">{user.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/80 text-red-400 border border-red-800/40">
                    <Shield className="w-3 h-3" />
                    <span>{user.role}</span>
                  </div>
                </div>

                {onOpenAdmin && (
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenAdmin();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800/70 transition-colors text-left"
                  >
                    <Shield className="w-4 h-4 text-red-400" />
                    <span>Studio Management</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setActiveTab('watchlist');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800/70 transition-colors text-left"
                >
                  <Bookmark className="w-4 h-4 text-amber-400" />
                  <span>My Watchlist ({watchlistCount})</span>
                </button>

                <div className="border-t border-slate-800/80 my-1" />

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Mobile Sub Navigation Bar */}
      <div className="flex md:hidden items-center justify-around border-t border-slate-800/70 mt-3 pt-2.5 px-3 text-xs font-medium text-slate-300">
        <button 
          onClick={() => setActiveTab('home')}
          className={`px-2 py-1 rounded-md ${activeTab === 'home' ? 'text-red-400 font-bold' : ''}`}
        >
          Home
        </button>
        <button 
          onClick={() => setActiveTab('movies')}
          className={`px-2 py-1 rounded-md ${activeTab === 'movies' ? 'text-red-400 font-bold' : ''}`}
        >
          Movies
        </button>
        <button 
          onClick={() => setActiveTab('tv')}
          className={`px-2 py-1 rounded-md ${activeTab === 'tv' ? 'text-cyan-400 font-bold' : ''}`}
        >
          TV Series
        </button>
        <button 
          onClick={() => setActiveTab('anime')}
          className={`px-2 py-1 rounded-md ${activeTab === 'anime' ? 'text-amber-400 font-bold' : ''}`}
        >
          Anime
        </button>
        <button 
          onClick={() => setActiveTab('documentary')}
          className={`px-2 py-1 rounded-md ${activeTab === 'documentary' ? 'text-emerald-400 font-bold' : ''}`}
        >
          Docu
        </button>
        <button 
          onClick={() => {
            if (onOpenAdmin) onOpenAdmin();
            setActiveTab('admin');
          }}
          className={`px-2 py-1 rounded-md flex items-center gap-1 font-bold ${activeTab === 'admin' ? 'text-white bg-red-600' : 'text-red-400'}`}
        >
          <Shield className="w-3 h-3" />
          <span>Admin</span>
        </button>
      </div>
    </header>
  );
};
