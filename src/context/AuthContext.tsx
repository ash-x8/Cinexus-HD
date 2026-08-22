import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, WatchProgress } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  watchlist: string[];
  history: WatchProgress[];
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => void;
  toggleWatchlist: (contentId: string) => Promise<void>;
  isInWatchlist: (contentId: string) => boolean;
  saveProgress: (progress: WatchProgress) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
  authModalMode: 'login' | 'register';
}

const DEFAULT_SUPER_ADMIN: UserProfile = {
  id: 'usr_super_admin_kushan',
  email: 'kushanashvika216@gmail.com',
  name: 'Kushan Ashvika',
  role: 'SUPER_ADMIN',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
  createdAt: new Date().toISOString()
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('cinexus_user');
    return saved ? JSON.parse(saved) : DEFAULT_SUPER_ADMIN;
  });
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [history, setHistory] = useState<WatchProgress[]>([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Load user data on auth change
  useEffect(() => {
    if (user?.id) {
      localStorage.setItem('cinexus_user', JSON.stringify(user));
      api.getWatchlist(user.id).then(setWatchlist).catch(() => {});
      api.getWatchHistory(user.id).then(setHistory).catch(() => {});
    } else {
      localStorage.removeItem('cinexus_user');
      setWatchlist([]);
      setHistory([]);
    }
  }, [user]);

  const login = async (email: string, pass: string) => {
    const data = await api.login(email, pass);
    setUser(data.user);
    setAuthModalOpen(false);
  };

  const register = async (email: string, pass: string, name: string) => {
    const data = await api.register(email, pass, name);
    setUser(data.user);
    setAuthModalOpen(false);
  };

  const logout = () => {
    setUser(null);
  };

  const toggleWatchlist = async (contentId: string) => {
    if (!user?.id) {
      setAuthModalOpen(true);
      return;
    }
    if (watchlist.includes(contentId)) {
      const updated = await api.removeFromWatchlist(user.id, contentId);
      setWatchlist(updated);
    } else {
      const updated = await api.addToWatchlist(user.id, contentId);
      setWatchlist(updated);
    }
  };

  const isInWatchlist = (contentId: string) => {
    return watchlist.includes(contentId);
  };

  const saveProgress = async (progress: WatchProgress) => {
    if (!user?.id) return;
    await api.saveWatchProgress(user.id, progress);
    setHistory(prev => {
      const filtered = prev.filter(p => p.contentId !== progress.contentId);
      return [progress, ...filtered];
    });
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user?.id) return;
    const res = await api.updateProfile(user.id, data);
    setUser(res.user);
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin,
        isSuperAdmin,
        watchlist,
        history,
        login,
        register,
        logout,
        toggleWatchlist,
        isInWatchlist,
        saveProgress,
        updateProfile,
        openAuthModal,
        closeAuthModal,
        authModalOpen,
        authModalMode
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
