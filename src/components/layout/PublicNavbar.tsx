import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bookmark, User, LogIn, LogOut, Menu, X, Play } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const PublicNavbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
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
    <header className="sticky top-0 z-40 w-full bg-[#06080c]/90 backdrop-blur-xl border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        
        {/* Zone 1: Single text element wordmark */}
        <Link
          to="/"
          className="text-xl sm:text-2xl font-bold tracking-widest text-white hover:text-red-500 transition-colors uppercase font-display select-none"
        >
          CINEXUS
        </Link>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`transition-colors py-1 ${
                isActive(link.path)
                  ? 'text-white font-semibold border-b-2 border-red-600'
                  : 'hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Zone 3: 1-2 primary actions (Search, Watchlist, User Profile/Sign In) */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            to="/search"
            className="p-2.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Search cinema catalog"
            aria-label="Search catalog"
          >
            <Search className="w-5 h-5" />
          </Link>

          <Link
            to="/watchlist"
            className="hidden sm:flex p-2.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
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
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-white/5 transition-colors"
                aria-label="Open profile menu"
              >
                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/20 flex items-center justify-center text-xs font-semibold text-white uppercase overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name[0] || 'U'
                  )}
                </div>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 p-2 rounded-2xl bg-[#0c1017] border border-white/10 shadow-2xl backdrop-blur-xl text-xs text-zinc-300 animate-fadeIn z-50">
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
                      <User className="w-4 h-4 text-zinc-400" />
                      <span>Account Settings</span>
                    </Link>
                    <Link
                      to="/history"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 text-zinc-200 transition-colors"
                    >
                      <Play className="w-4 h-4 text-zinc-400" />
                      <span>Watch History</span>
                    </Link>
                  </div>
                  <div className="pt-1 border-t border-white/10">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/profile"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-semibold text-white tracking-wide transition-colors whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#06080c] px-4 pt-3 pb-6 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive(link.path)
                  ? 'bg-red-600/10 text-red-500 font-semibold'
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
