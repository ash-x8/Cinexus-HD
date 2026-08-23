import React from 'react';
import { Home, Film, Tv, Bookmark, Search, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileBottomNavProps {
  activeTab: 'home' | 'movies' | 'tv' | 'anime' | 'documentary' | 'watchlist';
  setActiveTab: (tab: 'home' | 'movies' | 'tv' | 'anime' | 'documentary' | 'watchlist') => void;
  onOpenSearch: () => void;
  onOpenWatchlist: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenSearch,
  onOpenWatchlist
}) => {
  const { user, openAuthModal } = useAuth();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#07090e]/95 backdrop-blur-lg border-t border-white/10 px-3 py-2 flex items-center justify-around safe-area-pb">
      {/* Home */}
      <button
        onClick={() => setActiveTab('home')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
          activeTab === 'home' ? 'text-red-500 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : ''}`} />
        <span className="text-[10px] mt-0.5">Home</span>
      </button>

      {/* Movies */}
      <button
        onClick={() => setActiveTab('movies')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
          activeTab === 'movies' ? 'text-red-500 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Film className={`w-5 h-5 ${activeTab === 'movies' ? 'stroke-[2.5]' : ''}`} />
        <span className="text-[10px] mt-0.5">Movies</span>
      </button>

      {/* TV */}
      <button
        onClick={() => setActiveTab('tv')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
          activeTab === 'tv' ? 'text-red-500 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Tv className={`w-5 h-5 ${activeTab === 'tv' ? 'stroke-[2.5]' : ''}`} />
        <span className="text-[10px] mt-0.5">TV Series</span>
      </button>

      {/* Global Search */}
      <button
        onClick={onOpenSearch}
        className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-400 hover:text-slate-200 transition-all"
      >
        <Search className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Search</span>
      </button>

      {/* Watchlist */}
      <button
        onClick={() => {
          setActiveTab('watchlist');
          onOpenWatchlist();
        }}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
          activeTab === 'watchlist' ? 'text-red-500 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Bookmark className={`w-5 h-5 ${activeTab === 'watchlist' ? 'stroke-[2.5]' : ''}`} />
        <span className="text-[10px] mt-0.5">My List</span>
      </button>

      {/* Account / Profile */}
      <button
        onClick={() => {
          if (!user) openAuthModal();
        }}
        className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-400 hover:text-slate-200 transition-all"
      >
        {user ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="w-5 h-5 rounded-full object-cover border border-red-500"
          />
        ) : (
          <User className="w-5 h-5" />
        )}
        <span className="text-[10px] mt-0.5">{user ? 'Profile' : 'Sign In'}</span>
      </button>
    </div>
  );
};
