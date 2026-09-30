import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bookmark, User, LogIn, LogOut, Menu, X, Play } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';

interface PublicNavbarProps {
  onOpenSearch?: () => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({ onOpenSearch }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, openAuthModal } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { label: 'Movies', path: '/movies' },
    { label: 'TV Series', path: '/tv' },
    { label: 'Anime', path: '/anime' },
    { label: 'Genres', path: '/genres' },
    { label: 'My Library', path: '/watchlist' }
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0B0D12]/92 backdrop-blur-xl border-b border-amber-500/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        
        {/* Zone 1: Official Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 select-none"
        >
          <Logo size="md" showSubtitle={false} />
        </Link>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`transition-colors py-1 ${
                isActive(link.path)
                  ? 'text-amber-400 font-bold border-b-2 border-amber-400'
                  : 'hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Zone 3: Search Bar with Ctrl+K shortcut & User Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          {onOpenSearch ? (
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[#12151E] border border-amber-500/20 hover:border-amber-500/50 text-zinc-400 hover:text-white transition-all cursor-pointer group"
              title="Search catalog (Ctrl+K or /)"
            >
              <Search className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs text-zinc-400 hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold text-amber-300/80 bg-black/40 rounded border border-amber-500/20">
                ⌘K
              </kbd>
            </button>
          ) : (
            <Link
              to="/search"
              className="p-2.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Search cinema catalog"
              aria-label="Search catalog"
            >
              <Search className="w-5 h-5 text-amber-400" />
            </Link>
          )}

          <Link
            to="/watchlist"
            className="hidden sm:flex p-2.5 rounded-full text-zinc-400 hover:text-amber-400 hover:bg-white/5 transition-colors"
            title="Watchlist"
            aria-label="View watchlist"
          >
            <Bookmark className="w-5 h-5" />
          </Link>

          {/* User Account / Sign In */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen((v) => !v)}
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Open profile menu"
              >
                <div className="w-8 h-8 rounded-full bg-[#12151E] border border-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-300 uppercase overflow-hidden shadow-[0_0_12px_rgba(229,169,60,0.3)]">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name[0] || 'U'
                  )}
                </div>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 p-2 rounded-2xl bg-[#12151E] border border-amber-500/20 shadow-2xl backdrop-blur-xl text-xs text-zinc-300 animate-fadeIn z-50">
                  <div className="px-3 py-2 border-b border-white/10">
                    <p className="font-semibold text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 text-zinc-200 transition-colors"
                    >
                      <User className="w-4 h-4 text-amber-400" />
                      <span>Account Settings</span>
                    </Link>
                    <Link
                      to="/history"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 text-zinc-200 transition-colors"
                    >
                      <Play className="w-4 h-4 text-amber-400" />
                      <span>Watch History</span>
                    </Link>
                  </div>
                  <div className="pt-1 border-t border-white/10">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-xs font-bold text-zinc-950 tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer shadow-lg shadow-amber-950/40 hover:scale-105"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-amber-500/15 bg-[#0B0D12] px-4 pt-3 pb-6 space-y-2 animate-fadeIn">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive(link.path)
                  ? 'bg-amber-500/15 text-amber-400 font-bold border border-amber-500/30'
                  : 'text-zinc-300 hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/watchlist"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:bg-white/5"
          >
            Saved Watchlist
          </Link>
        </div>
      )}
    </header>
  );
};
