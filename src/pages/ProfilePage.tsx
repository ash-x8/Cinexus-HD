import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, LogIn, Mail, Lock, ShieldCheck, LogOut, CheckCircle2, Sliders, Camera, Loader2, Check } from 'lucide-react';
import { AvatarCropperModal } from '../components/profile/AvatarCropperModal';

export const ProfilePage: React.FC = () => {
  const { user, loginWithEmail, signupWithEmail, loginWithGoogle, logout, uploadAvatar } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preference states
  const [defaultQuality, setDefaultQuality] = useState<'4K' | '1080p' | 'Auto'>('4K');
  const [autoplayNext, setAutoplayNext] = useState(true);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
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
    setError(null);
    setUploadLoading(true);
    try {
      await uploadAvatar(croppedBlob);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3500);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile photo.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password, name);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google sign-in was cancelled or encountered an error.');
    }
  };

  if (user) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-6 rounded-3xl bg-zinc-950/80 border border-white/10">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-20 h-20 rounded-full bg-zinc-800 border-2 border-[#D4AF37]/50 flex items-center justify-center text-2xl font-bold text-white uppercase overflow-hidden shadow-xl">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              ) : (
                user.name[0] || 'U'
              )}
            </div>
            
            {/* Camera Overlay Icon */}
            <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[#D4AF37]">
              {uploadLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Camera className="w-6 h-6" />
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white truncate font-display">{user.name}</h1>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] font-bold text-[#D4AF37] border border-[#D4AF37]/30 cursor-pointer flex items-center gap-1"
              >
                <Camera className="w-3 h-3" />
                <span>Change & Crop Avatar</span>
              </button>
            </div>
            <p className="text-xs text-zinc-400 truncate mt-0.5">{user.email}</p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified VIP Streamer Account</span>
              {uploadSuccess && (
                <span className="text-[#D4AF37] font-bold ml-2">· Avatar updated successfully!</span>
              )}
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-red-600/10 text-xs font-semibold text-zinc-300 hover:text-red-400 border border-white/10 transition-colors self-start sm:self-center"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Interactive Avatar Cropper Modal */}
        <AvatarCropperModal
          isOpen={cropModalOpen}
          imageSrc={cropImageSrc}
          onClose={() => setCropModalOpen(false)}
          onCropComplete={handleCropComplete}
        />

        {/* Streaming Preferences */}
        <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10 text-white font-semibold text-sm">
            <Sliders className="w-4 h-4 text-red-500" />
            <span>Playback & Streaming Preferences</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-white">Default Video Quality</h4>
                <p className="text-xs text-zinc-400">Stream in master high-bitrate format when bandwidth allows.</p>
              </div>
              <select
                value={defaultQuality}
                onChange={(e) => setDefaultQuality(e.target.value as any)}
                className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white"
              >
                <option value="4K">4K Ultra HD</option>
                <option value="1080p">1080p FHD</option>
                <option value="Auto">Automatic</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <h4 className="text-sm font-medium text-white">Autoplay Next Episode</h4>
                <p className="text-xs text-zinc-400">Automatically progress to the next television episode.</p>
              </div>
              <input
                type="checkbox"
                checked={autoplayNext}
                onChange={(e) => setAutoplayNext(e.target.checked)}
                className="w-4 h-4 accent-red-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

      </div>
    );
  }

  // Not Logged In: Sign In / Sign Up Form
  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="p-6 sm:p-8 rounded-2xl bg-zinc-950 border border-white/15 shadow-2xl space-y-6">
        
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-white font-display uppercase tracking-wider">
            {mode === 'signin' ? 'Sign In to CINEXUS' : 'Create Free Account'}
          </h1>
          <p className="text-xs text-zinc-400">
            {mode === 'signin'
              ? 'Access saved watchlists, custom streams, and history.'
              : 'Join the next-generation cinema ecosystem.'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-600/10 border border-red-500/20 text-xs text-red-400 leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Cinema Enthusiast"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@cinexus.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white tracking-wider uppercase transition-colors shadow-lg shadow-red-950/50 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="relative flex items-center justify-center py-1">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
          <span className="relative px-3 bg-zinc-950 text-[11px] text-zinc-500 uppercase">Or continue with</span>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white flex items-center justify-center gap-2.5 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
            <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
            <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
            <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.1 7.5 23 12 23z" />
          </svg>
          <span>Google Account</span>
        </button>

        <div className="text-center pt-2">
          {mode === 'signin' ? (
            <p className="text-xs text-zinc-400">
              Don't have an account?{' '}
              <button onClick={() => setMode('signup')} className="text-red-500 font-semibold hover:underline">
                Create one now
              </button>
            </p>
          ) : (
            <p className="text-xs text-zinc-400">
              Already have an account?{' '}
              <button onClick={() => setMode('signin')} className="text-red-500 font-semibold hover:underline">
                Sign in
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
