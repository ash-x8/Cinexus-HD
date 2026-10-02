import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBrand } from '../context/BrandContext';
import { auth, db } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { 
  User, 
  Settings, 
  History, 
  Bookmark, 
  Play, 
  Trash2, 
  Save, 
  Sparkles, 
  CheckCircle2, 
  Camera, 
  Sliders, 
  Film, 
  Clock, 
  LogOut, 
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { WatchProgress, MovieItem } from '../types';
import { useNavigate, Link } from 'react-router-dom';

const PRESET_AVATARS = [
  { id: 'av-1', label: 'Gold Cinephile', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80' },
  { id: 'av-2', label: 'Studio Director', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80' },
  { id: 'av-3', label: 'IMAX Pioneer', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80' },
  { id: 'av-4', label: 'Neon Producer', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80' },
  { id: 'av-5', label: 'Velvet Critic', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80' },
  { id: 'av-6', label: 'Cyber Streamer', url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=300&q=80' }
];

export const UserProfile: React.FC = () => {
  const { user, logout, openAuthModal } = useAuth();
  const { branding } = useBrand();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'watchlist' | 'preferences'>('overview');
  
  // Profile update states
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Watch history and Watchlist states
  const [historyList, setHistoryList] = useState<WatchProgress[]>([]);
  const [watchlist, setWatchlist] = useState<MovieItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // User playback preferences
  const [defaultQuality, setDefaultQuality] = useState<'4K' | '1080p' | 'Auto'>('4K');
  const [defaultSubtitle, setDefaultSubtitle] = useState<string>('si');
  const [autoplayNext, setAutoplayNext] = useState<boolean>(true);
  const [theaterModeDefault, setTheaterModeDefault] = useState<boolean>(false);

  // Sync user details on load
  useEffect(() => {
    if (user) {
      setDisplayName(user.name || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  // Load Watch History & Watchlist from Firestore
  useEffect(() => {
    if (!user?.id) return;
    setLoadingData(true);

    const fetchData = async () => {
      try {
        // Fetch History
        const historySnap = await getDocs(collection(db, `users/${user.id}/history`));
        const historyItems: WatchProgress[] = [];
        historySnap.forEach((d) => {
          historyItems.push(d.data() as WatchProgress);
        });
        historyItems.sort((a, b) => new Date(b.lastWatchedAt || 0).getTime() - new Date(a.lastWatchedAt || 0).getTime());
        setHistoryList(historyItems);

        // Fetch Watchlist
        const watchlistSnap = await getDocs(collection(db, `users/${user.id}/watchlist`));
        const watchItems: MovieItem[] = [];
        watchlistSnap.forEach((d) => {
          watchItems.push(d.data() as MovieItem);
        });
        setWatchlist(watchItems);
      } catch (err) {
        console.warn('[UserProfile] Failed to load history/watchlist:', err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [user?.id]);

  // Update Profile Name & Avatar
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      const cleanName = displayName.trim() || 'Cinema Fan';
      const cleanAvatar = avatarUrl.trim();

      // Update Firebase Auth user profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: cleanName,
          photoURL: cleanAvatar || undefined
        });
      }

      // Update Firestore users/{uid} document
      await setDoc(
        doc(db, 'users', user.id),
        {
          name: cleanName,
          displayName: cleanName,
          avatarUrl: cleanAvatar,
          photoURL: cleanAvatar,
          updatedAt: new Date().toISOString(),
          preferences: {
            defaultQuality,
            defaultSubtitleLang: defaultSubtitle,
            autoplayNext,
            theaterModeDefault
          }
        },
        { merge: true }
      );

      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3500);
    } catch (err: any) {
      console.error('[UserProfile] Failed to update profile:', err);
      setUpdateError(err.message || 'Failed to update profile.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Remove single item from history
  const handleRemoveHistory = async (contentId: string, episodeId?: string) => {
    if (!user?.id) return;
    const contentKey = episodeId ? `${contentId}_${episodeId}` : contentId;
    try {
      await deleteDoc(doc(db, `users/${user.id}/history`, contentKey));
      setHistoryList((prev) => prev.filter((item) => (item.episodeId ? `${item.contentId}_${item.episodeId}` : item.contentId) !== contentKey));
      try {
        localStorage.removeItem(`cinexus_progress_${contentKey}`);
      } catch {}
    } catch (err) {
      console.warn('Remove history error:', err);
    }
  };

  // Clear all history
  const handleClearAllHistory = async () => {
    if (!user?.id || !confirm('Are you sure you want to clear your entire watch history?')) return;
    try {
      for (const item of historyList) {
        const key = item.episodeId ? `${item.contentId}_${item.episodeId}` : item.contentId;
        await deleteDoc(doc(db, `users/${user.id}/history`, key));
      }
      setHistoryList([]);
    } catch (err) {
      console.warn('Clear history error:', err);
    }
  };

  // Remove single item from watchlist
  const handleRemoveWatchlist = async (movieId: string) => {
    if (!user?.id) return;
    try {
      await deleteDoc(doc(db, `users/${user.id}/watchlist`, movieId));
      setWatchlist((prev) => prev.filter((item) => item.id !== movieId));
    } catch (err) {
      console.warn('Remove watchlist error:', err);
    }
  };

  // Not Logged In View
  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(212,175,55,0.2)]">
          <User className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-white uppercase tracking-wider font-display mb-2">
          Member Dashboard
        </h1>
        <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
          Sign in or create a Cinexus account to synchronize your 4K watch progress, custom watchlists, and streaming preferences across all your devices.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-950/50 cursor-pointer"
        >
          Sign In / Join Cinexus
        </button>
      </div>
    );
  }

  // Calculate user watch statistics
  const totalWatchHours = Math.round(
    historyList.reduce((acc, cur) => acc + (cur.currentTime || 0), 0) / 3600
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fadeIn">
      
      {/* Top Luxury Hero Card */}
      <div className="relative rounded-3xl bg-[#12151E] border border-[#D4AF37]/25 p-6 sm:p-8 overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.12)]">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          
          {/* Avatar with Gold Border */}
          <div className="relative group">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-zinc-900 border-2 border-[#D4AF37] overflow-hidden shadow-2xl flex items-center justify-center text-3xl font-black text-[#D4AF37]">
              {user.avatarUrl || avatarUrl ? (
                <img
                  src={avatarUrl || user.avatarUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{(user.name || 'U')[0]?.toUpperCase()}</span>
              )}
            </div>
            <button
              onClick={() => setActiveTab('overview')}
              className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-[#D4AF37] text-black hover:bg-amber-300 transition-colors shadow-lg cursor-pointer"
              title="Change Avatar"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* User Information */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight">
                {user.name}
              </h1>
              <span className="self-center sm:self-auto px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                <span>{user.role === 'ADMIN' ? 'Studio Administrator' : 'VIP Cinephile'}</span>
              </span>
            </div>

            <p className="text-xs text-zinc-400 font-mono">{user.email}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-3 text-xs text-zinc-300">
              <div className="flex items-center gap-1.5">
                <Film className="w-4 h-4 text-[#D4AF37]" />
                <span><strong>{historyList.length}</strong> Titles Watched</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span><strong>{totalWatchHours}</strong> Stream Hours</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-emerald-400" />
                <span><strong>{watchlist.length}</strong> In Watchlist</span>
              </div>
            </div>
          </div>

          {/* Quick Sign Out */}
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-red-600/10 text-xs font-bold text-zinc-300 hover:text-red-400 border border-white/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-[#D4AF37] text-black shadow-lg shadow-amber-950/40'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile & Avatar</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-[#D4AF37] text-black shadow-lg shadow-amber-950/40'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Continue Watching ({historyList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('watchlist')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'watchlist'
              ? 'bg-[#D4AF37] text-black shadow-lg shadow-amber-950/40'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>My Watchlist ({watchlist.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'preferences'
              ? 'bg-[#D4AF37] text-black shadow-lg shadow-amber-950/40'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Player Preferences</span>
        </button>
      </div>

      {/* Tab 1: Profile & Avatar Customizer */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Edit Form */}
          <div className="lg:col-span-2 rounded-3xl bg-[#12151E] border border-white/10 p-6 sm:p-8 space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#D4AF37]" />
                <span>Account Customization</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Customize your public theater persona and cinema profile identifier.
              </p>
            </div>

            {updateSuccess && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Profile details successfully updated across Cinexus!</span>
              </div>
            )}

            {updateError && (
              <div className="p-3.5 rounded-2xl bg-red-950/70 border border-red-500/40 text-red-300 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{updateError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/15 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 text-white text-xs outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Custom Avatar Image URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://domain.com/your-avatar.jpg"
                  className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/15 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30 text-white text-xs outline-none transition-all"
                />
                <p className="text-[11px] text-zinc-500 mt-1.5">
                  Direct image links (HTTPS) from Unsplash, Imgur, or your personal CDN.
                </p>
              </div>

              {/* Preset Avatars Selection */}
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                  Or Choose a Luxury Cinema Avatar Preset
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {PRESET_AVATARS.map((preset) => (
                    <button
                      type="button"
                      key={preset.id}
                      onClick={() => setAvatarUrl(preset.url)}
                      className={`relative rounded-2xl p-1 border transition-all cursor-pointer ${
                        avatarUrl === preset.url
                          ? 'border-[#D4AF37] bg-[#D4AF37]/15 scale-105 shadow-lg shadow-amber-950/40'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-full aspect-square rounded-xl object-cover"
                      />
                      <span className="block text-[10px] text-zinc-400 font-bold truncate mt-1 text-center">
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-950/40 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isUpdating ? 'Saving Profile...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Side Info Card */}
          <div className="rounded-3xl bg-[#12151E] border border-white/10 p-6 space-y-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Membership Status</span>
            </h3>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Account Type</span>
                <span className="font-bold text-[#D4AF37]">{user.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Stream Bitrate</span>
                <span className="font-bold text-white">4K Master Uncapped</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Audio Channels</span>
                <span className="font-bold text-white">Dolby Atmos / 5.1</span>
              </div>
            </div>

            <div className="text-[11px] text-zinc-500 leading-relaxed">
              Your Cinexus profile synchronizes playback across all modern web browsers, television displays, and mobile devices without loss of quality.
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Watch History & Continue Watching */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Continue Watching & History</h2>
              <p className="text-xs text-zinc-400">Pick up right where you paused with persistent cloud sync.</p>
            </div>
            {historyList.length > 0 && (
              <button
                onClick={handleClearAllHistory}
                className="px-3.5 py-1.5 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 text-xs font-bold transition-colors cursor-pointer"
              >
                Clear All History
              </button>
            )}
          </div>

          {historyList.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#12151E] border border-white/10 space-y-3">
              <History className="w-10 h-10 text-zinc-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">No stream history yet</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Start watching movies or television series to track your progress and resume effortlessly.
              </p>
              <Link
                to="/movies"
                className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] text-black font-bold text-xs uppercase"
              >
                Explore Cinema Catalog
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {historyList.map((item) => {
                const targetUrl = item.episodeId
                  ? `/watch/${item.contentId}/season/${item.seasonNumber || 1}/episode/${item.episodeNumber || 1}`
                  : `/watch/${item.contentId}`;

                return (
                  <div
                    key={item.episodeId ? `${item.contentId}_${item.episodeId}` : item.contentId}
                    className="relative group rounded-2xl bg-[#12151E] border border-white/10 hover:border-[#D4AF37]/50 overflow-hidden transition-all flex flex-col justify-between"
                  >
                    <div className="relative aspect-video w-full overflow-hidden bg-black">
                      <img
                        src={item.backdropPath || item.posterPath || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80'}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                      
                      {/* Play Action Button */}
                      <Link
                        to={targetUrl}
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40"
                      >
                        <div className="w-12 h-12 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shadow-xl">
                          <Play className="w-6 h-6 fill-current ml-0.5" />
                        </div>
                      </Link>

                      {/* Progress Bar at Bottom of Thumbnail */}
                      <div className="absolute bottom-0 inset-x-0 h-1.5 bg-white/20">
                        <div
                          className="h-full bg-gradient-to-r from-[#D4AF37] to-amber-500"
                          style={{ width: `${Math.min(item.percentage || 0, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                        {item.episodeTitle && (
                          <p className="text-[11px] text-[#D4AF37] truncate mt-0.5">
                            S{item.seasonNumber} E{item.episodeNumber}: {item.episodeTitle}
                          </p>
                        )}
                        <span className="text-[10px] text-zinc-400">
                          {item.percentage}% finished · {new Date(item.lastWatchedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <button
                        onClick={() => handleRemoveHistory(item.contentId, item.episodeId)}
                        className="p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                        title="Remove from history"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: My Watchlist */}
      {activeTab === 'watchlist' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Saved Watchlist</h2>
              <p className="text-xs text-zinc-400">Titles queued for your upcoming movie nights.</p>
            </div>
          </div>

          {watchlist.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-[#12151E] border border-white/10 space-y-3">
              <Bookmark className="w-10 h-10 text-zinc-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">Your watchlist is empty</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Explore Cinexus titles and click the bookmark icon to curate your personal collection.
              </p>
              <Link
                to="/movies"
                className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] text-black font-bold text-xs uppercase"
              >
                Browse Feature Films
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {watchlist.map((movie) => (
                <div
                  key={movie.id}
                  className="relative group rounded-2xl bg-[#12151E] border border-white/10 hover:border-[#D4AF37]/50 overflow-hidden flex flex-col justify-between"
                >
                  <div className="relative aspect-[2/3] w-full overflow-hidden bg-black">
                    <img
                      src={movie.posterPath || movie.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=400&q=80'}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Quality Badge */}
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-black uppercase">
                      {movie.quality || '4K HDR'}
                    </div>

                    <Link
                      to={`/watch/${movie.id}`}
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#D4AF37] text-black flex items-center justify-center shadow-xl">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </Link>
                  </div>

                  <div className="p-3">
                    <h4 className="text-xs font-bold text-white truncate">{movie.title}</h4>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-1">
                      <span>{movie.releaseYear || '2025'}</span>
                      <button
                        onClick={() => handleRemoveWatchlist(movie.id)}
                        className="text-zinc-500 hover:text-red-400 transition-colors"
                        title="Remove from watchlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Player & Audio Preferences */}
      {activeTab === 'preferences' && (
        <div className="max-w-3xl rounded-3xl bg-[#12151E] border border-white/10 p-6 sm:p-8 space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#D4AF37]" />
              <span>High-End Cinema Preferences</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Configure your default stream bitrates, subtitle tracks, and display behaviors.
            </p>
          </div>

          <div className="space-y-5">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div>
                <h4 className="text-sm font-bold text-white">Default Video Resolution</h4>
                <p className="text-xs text-zinc-400">Select preferred playback fidelity when stream begins.</p>
              </div>
              <select
                value={defaultQuality}
                onChange={(e) => setDefaultQuality(e.target.value as any)}
                className="px-3.5 py-2 rounded-xl bg-black/50 border border-white/20 text-xs text-white outline-none focus:border-[#D4AF37]"
              >
                <option value="4K">4K Ultra HD (Master Bitrate)</option>
                <option value="1080p">1080p FHD</option>
                <option value="Auto">Auto Adaptive (Bandwidth Match)</option>
              </select>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div>
                <h4 className="text-sm font-bold text-white">Preferred Subtitle Language</h4>
                <p className="text-xs text-zinc-400">Automatically activate closed captions in preferred tongue.</p>
              </div>
              <select
                value={defaultSubtitle}
                onChange={(e) => setDefaultSubtitle(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-black/50 border border-white/20 text-xs text-white outline-none focus:border-[#D4AF37]"
              >
                <option value="si">Sinhala (සිංහල උපසිරැසි)</option>
                <option value="en">English (CC)</option>
                <option value="off">Disabled by default</option>
              </select>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div>
                <h4 className="text-sm font-bold text-white">Autoplay Next Episode</h4>
                <p className="text-xs text-zinc-400">Seamlessly start consecutive television episodes.</p>
              </div>
              <input
                type="checkbox"
                checked={autoplayNext}
                onChange={(e) => setAutoplayNext(e.target.checked)}
                className="w-5 h-5 accent-[#D4AF37] rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <h4 className="text-sm font-bold text-white">Default Theater View</h4>
                <p className="text-xs text-zinc-400">Expand the player to edge-to-edge cinema container upon opening.</p>
              </div>
              <input
                type="checkbox"
                checked={theaterModeDefault}
                onChange={(e) => setTheaterModeDefault(e.target.checked)}
                className="w-5 h-5 accent-[#D4AF37] rounded cursor-pointer"
              />
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={isUpdating}
              className="px-6 py-2.5 rounded-xl bg-[#D4AF37] text-black font-bold text-xs uppercase tracking-wider cursor-pointer transition-all hover:bg-amber-300"
            >
              {isUpdating ? 'Saving Preferences...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserProfile;
