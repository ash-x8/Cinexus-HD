import React, { useState } from 'react';
import { 
  X, 
  User, 
  Shield, 
  Bookmark, 
  History, 
  Settings, 
  LogOut, 
  Play, 
  Trash2, 
  Check, 
  Sparkles, 
  Film, 
  SlidersHorizontal,
  ExternalLink,
  Tv
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MovieItem, WatchProgress } from '../../types';
import { BRANDING } from '../../config/branding';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  watchlist?: MovieItem[] | string[];
  watchProgressMap?: Record<string, WatchProgress>;
  allMovies?: MovieItem[];
  onPlayMovie?: (movie: MovieItem, episodeId?: string) => void;
  onOpenMovieDetail?: (movie: MovieItem) => void;
  onOpenAdmin?: () => void;
  onClearHistory?: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80'
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  watchlist = [],
  watchProgressMap = {},
  allMovies = [],
  onPlayMovie = () => {},
  onOpenMovieDetail,
  onOpenAdmin = () => {},
  onClearHistory = () => {}
}) => {
  const { user, logout, updateProfile, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'preferences'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatarUrl || PRESET_AVATARS[0]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Preferences
  const [defaultQuality, setDefaultQuality] = useState(user?.preferences?.defaultQuality || '4K');
  const [defaultSubtitle, setDefaultSubtitle] = useState(user?.preferences?.defaultSubtitleLang || 'Sinhala (සිංහල උපසිරැසි)');
  const [autoplayNext, setAutoplayNext] = useState(user?.preferences?.autoplayNext ?? true);

  if (!isOpen) return null;

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="w-full max-w-md bg-[#0b0f17] border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-red-600/10 border border-red-600/30 flex items-center justify-center mx-auto text-red-500">
            <User className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">Sign In to CINEXUS</h3>
          <p className="text-xs text-slate-400">
            Access your personalized 4K cinema profile, saved watchlist, continue watching progress, and VIP playback settings.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onClose();
                openAuthModal();
              }}
              className="flex-1 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-950/50 cursor-pointer"
            >
              Sign In / Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
  const historyList = Object.values(watchProgressMap || {}).sort((a, b) => 
    new Date(b?.lastWatchedAt || 0).getTime() - new Date(a?.lastWatchedAt || 0).getTime()
  );
  const watchlistCount = Array.isArray(watchlist) ? watchlist.length : 0;

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        name: editName,
        avatarUrl: editAvatar,
        preferences: {
          defaultQuality: defaultQuality as any,
          defaultSubtitleLang: defaultSubtitle,
          autoplayNext
        }
      });
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0b0f17] border border-slate-800/90 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800/80 bg-gradient-to-r from-red-950/30 via-slate-900 to-black/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={user.avatarUrl || PRESET_AVATARS[0]}
                alt={user.name}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-red-500/80 shadow-lg shadow-red-950/40"
              />
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-red-600 text-[9px] font-extrabold text-white uppercase tracking-wider">
                {user.role}
              </span>
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>{user.name}</span>
                {isAdmin && <Shield className="w-4 h-4 text-red-400" />}
              </h2>
              <p className="text-xs text-slate-400 font-mono">{user.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800/80 bg-[#07090e] px-4 sm:px-6 gap-2 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'border-red-500 text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile & Account</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'border-red-500 text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Watch History ({historyList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('preferences')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'preferences'
                ? 'border-red-500 text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Cinema Preferences</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {saveSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Profile settings saved successfully!</span>
            </div>
          )}

          {/* TAB 1: Profile & Account Details */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {isEditing ? (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Edit Cinema Profile</h4>
                  
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Display Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-400 font-medium">Choose Cinematic Avatar</label>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {PRESET_AVATARS.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setEditAvatar(url)}
                          className={`relative rounded-xl overflow-hidden border-2 transition-all aspect-square cursor-pointer ${
                            editAvatar === url ? 'border-red-500 scale-105 shadow-md shadow-red-950' : 'border-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={url} alt="Avatar option" className="w-full h-full object-cover" />
                          {editAvatar === url && (
                            <div className="absolute inset-0 bg-red-600/30 flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-950/40"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                    <span className="text-[11px] text-slate-400">Account Type</span>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{user.role === 'SUPER_ADMIN' ? 'Super Administrator' : user.role === 'ADMIN' ? 'Studio Administrator' : 'VIP Member'}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                    <span className="text-[11px] text-slate-400">Member Since</span>
                    <div className="text-xs font-bold text-white">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Active Cinema Subscriber'}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                    <span className="text-[11px] text-slate-400">Saved in Watchlist</span>
                    <div className="text-xs font-bold text-white">{watchlistCount} Titles</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                    <span className="text-[11px] text-slate-400">Stream Playback Engine</span>
                    <div className="text-xs font-bold text-white">4K Dolby Atmos Native</div>
                  </div>
                </div>
              )}

              {/* Account Actions */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditName(user.name);
                      setEditAvatar(user.avatarUrl || PRESET_AVATARS[0]);
                      setIsEditing(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                  >
                    Edit Profile Details
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="ml-auto px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-400 hover:text-red-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Watch History */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Continue Watching ({historyList.length})</span>
                {historyList.length > 0 && (
                  <button
                    onClick={onClearHistory}
                    className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear Watch History</span>
                  </button>
                )}
              </div>

              {historyList.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800/60 space-y-2">
                  <Film className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs text-slate-400">No watched titles yet. Stream any movie or series to track your progress.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {historyList.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {item.posterPath ? (
                          <img
                            src={item.posterPath}
                            alt={item.title || 'Movie'}
                            className="w-10 h-14 rounded-lg object-cover border border-slate-700 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-14 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                            <Film className="w-5 h-5 text-slate-600" />
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <h4 className="text-xs font-bold text-white truncate">{item.title || 'Untitled'}</h4>
                          <p className="text-[10px] text-slate-400">
                            {item.episodeTitle ? `S${item.seasonNumber || 1}:E${item.episodeNumber || 1} • ${item.episodeTitle}` : `${Math.round(item.percentage || 0)}% completed`}
                          </p>
                          <div className="w-24 h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                            <div
                              className="h-full bg-red-600 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(0, item.percentage || 0))}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          const movieObj: any = {
                            id: item.movieId || item.contentId || 'unknown',
                            title: item.title || 'Movie',
                            posterPath: item.posterPath,
                            demoVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
                          };
                          onClose();
                          onPlayMovie(movieObj, item.contentId);
                        }}
                        className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-all shrink-0 cursor-pointer shadow-md shadow-red-950/40"
                        title="Resume Playback"
                      >
                        <Play className="w-4 h-4 fill-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Preferences */}
          {activeTab === 'preferences' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Default Streaming Quality</label>
                <select
                  value={defaultQuality}
                  onChange={(e) => setDefaultQuality(e.target.value as '4K' | '1080p' | 'Auto')}
                  className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="4K">4K Ultra HD (2160p Master)</option>
                  <option value="1080p">1080p Full HD</option>
                  <option value="Auto">Auto (Adaptive Bitrate)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Preferred Subtitle Language</label>
                <select
                  value={defaultSubtitle}
                  onChange={(e) => setDefaultSubtitle(e.target.value)}
                  className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Sinhala (සිංහල උපසිරැසි)">Sinhala (සිංහල උපසිරැසි)</option>
                  <option value="English [CC]">English [CC]</option>
                  <option value="Off">Subtitles Off</option>
                </select>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">Autoplay Next Episode</div>
                  <div className="text-[11px] text-slate-400">Automatically stream the next TV episode when finished</div>
                </div>
                <input
                  type="checkbox"
                  checked={autoplayNext}
                  onChange={(e) => setAutoplayNext(e.target.checked)}
                  className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-950/40 cursor-pointer"
                >
                  Save Cinema Preferences
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
