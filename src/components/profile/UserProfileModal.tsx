import React, { useState, useRef } from 'react';
import { 
  X, 
  User, 
  Bookmark, 
  History, 
  LogOut, 
  Play, 
  Trash2, 
  Check, 
  Film, 
  SlidersHorizontal,
  Upload,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MovieItem, WatchProgress } from '../../types';
import { AvatarCropperModal } from './AvatarCropperModal';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  watchlist?: MovieItem[] | string[];
  watchProgressMap?: Record<string, WatchProgress>;
  allMovies?: MovieItem[];
  onPlayMovie?: (movie: MovieItem, episodeId?: string) => void;
  onOpenMovieDetail?: (movie: MovieItem) => void;
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
  onClearHistory = () => {}
}) => {
  const { user, logout, updateProfile, openAuthModal, uploadAvatar, removeAvatar } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'preferences'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatarUrl || PRESET_AVATARS[0]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const historyList = Object.values(watchProgressMap || {}).sort((a, b) => 
    new Date(b?.lastWatchedAt || 0).getTime() - new Date(a?.lastWatchedAt || 0).getTime()
  );
  const watchlistCount = Array.isArray(watchlist) ? watchlist.length : 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedDataUrl: string, croppedBlob: Blob) => {
    setErrorMessage(null);
    setUploadLoading(true);
    try {
      const downloadUrl = await uploadAvatar(croppedBlob);
      setEditAvatar(downloadUrl);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload image.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await removeAvatar();
      setEditAvatar(PRESET_AVATARS[0]);
    } catch (err: any) {
      console.warn('Remove avatar error:', err);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        name: editName.trim() || user.name,
        avatarUrl: editAvatar,
        preferences: {
          defaultQuality: defaultQuality as any,
          defaultSubtitleLang: defaultSubtitle,
          autoplayNext
        }
      });
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setErrorMessage('Could not update profile details.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#0b0f17] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Header Card */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-r from-red-950/40 via-slate-900/60 to-[#0b0f17] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img
                src={user.avatarUrl || PRESET_AVATARS[0]}
                alt={user.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-red-500/50 shadow-lg shadow-red-950/40"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0b0f17] flex items-center justify-center text-[10px] text-black font-black" title="Verified Member">
                ✓
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-[10px] font-bold uppercase tracking-wider">
                  CINEXUS Premier Member
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-display text-white mt-1">
                {user.name}
              </h2>
              <p className="text-xs text-slate-400 font-mono">{user.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-white transition-all cursor-pointer"
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

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-950/60 border border-red-700/60 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{errorMessage}</span>
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

                  {/* Profile Photo Upload / Choose */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-slate-400 font-medium">Profile Photo</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadLoading}
                          className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Upload className="w-3 h-3" />
                          <span>{uploadLoading ? 'Uploading...' : 'Upload from Device'}</span>
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                        {user.avatarUrl && (
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold cursor-pointer"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500">Or select from curated cinema presets:</p>
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
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-950/40 cursor-pointer"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                    <span className="text-[11px] text-slate-400">Membership Tier</span>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>CINEXUS Premier Member</span>
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
                <span className="text-xs text-slate-400">
                  Showing your resume progress across all devices
                </span>
                {historyList.length > 0 && (
                  <button
                    onClick={onClearHistory}
                    className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {historyList.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <Film className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-xs font-medium">No watch history yet</p>
                  <p className="text-[11px] text-slate-600">Start watching any title to track resume progress.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {historyList.map((hist) => {
                    const matchedMovie = allMovies.find((m) => m.id === hist.contentId || m.id === hist.movieId);
                    const title = hist.title || matchedMovie?.title || 'Featured Cinema';
                    const poster = hist.posterPath || matchedMovie?.posterUrl || matchedMovie?.posterPath;
                    const percent = Math.round(hist.percentage || 0);

                    return (
                      <div
                        key={hist.contentId + (hist.episodeId || '')}
                        className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800/80 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-14 rounded-lg overflow-hidden bg-slate-800 shrink-0">
                            {poster ? (
                              <img src={poster} alt={title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-600">
                                <Film className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{title}</h4>
                            {hist.episodeTitle && (
                              <p className="text-[10px] text-slate-400 truncate">
                                S{hist.seasonNumber} E{hist.episodeNumber}: {hist.episodeTitle}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full bg-red-600 rounded-full"
                                  style={{ width: `${Math.min(100, Math.max(5, percent))}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-slate-400">{percent}%</span>
                            </div>
                          </div>
                        </div>

                        {matchedMovie && (
                          <button
                            onClick={() => {
                              onClose();
                              onPlayMovie(matchedMovie, hist.episodeId);
                            }}
                            className="p-2 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white transition-all cursor-pointer"
                            title="Resume Playback"
                          >
                            <Play className="w-4 h-4 fill-current" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Preferences */}
          {activeTab === 'preferences' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Default Video Resolution</h4>
                    <p className="text-[11px] text-slate-400">Preferred streaming quality when available</p>
                  </div>
                  <select
                    value={defaultQuality}
                    onChange={(e) => setDefaultQuality(e.target.value as any)}
                    className="bg-[#07090e] border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 outline-none cursor-pointer"
                  >
                    <option value="4K">4K Ultra HD (2160p)</option>
                    <option value="1080p">Full HD (1080p)</option>
                    <option value="Auto">Adaptive Bitrate (Auto)</option>
                  </select>
                </div>

                <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Default Subtitle Language</h4>
                    <p className="text-[11px] text-slate-400">Automatically activate closed captions in this language</p>
                  </div>
                  <select
                    value={defaultSubtitle}
                    onChange={(e) => setDefaultSubtitle(e.target.value)}
                    className="bg-[#07090e] border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 outline-none cursor-pointer"
                  >
                    <option value="Sinhala (සිංහල උපසිරැසි)">Sinhala (සිංහල උපසිරැසි)</option>
                    <option value="English">English (Original Audio CC)</option>
                    <option value="Tamil">Tamil (தமிழ்)</option>
                    <option value="Off">Subtitles Off</option>
                  </select>
                </div>

                <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Continuous Auto-Play Next Episode</h4>
                    <p className="text-[11px] text-slate-400">Queue and launch the next sequential chapter automatically</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoplayNext}
                    onChange={(e) => setAutoplayNext(e.target.checked)}
                    className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-950/40 cursor-pointer"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Interactive Avatar Cropper Modal */}
      <AvatarCropperModal
        isOpen={cropModalOpen}
        imageSrc={cropImageSrc}
        onClose={() => setCropModalOpen(false)}
        onCropComplete={handleCropComplete}
      />

    </div>
  );
};
