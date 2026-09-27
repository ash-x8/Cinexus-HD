import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';
import { X, Mail, Lock, User, AlertCircle, Sparkles } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { authModalOpen, authModalMode, closeAuthModal, openAuthModal, login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide your cinema email and password.');
      return;
    }

    if (authModalMode === 'register' && !name.trim()) {
      setError('Please enter your preferred cinema display name.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      if (authModalMode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0b0f17] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-red-600/10 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          id="btn-close-auth-modal"
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-900/80 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Brand Logo */}
        <div className="flex flex-col items-center text-center mb-6">
          <Logo size="md" showSubtitle={false} className="mb-2" />
          <h2 className="text-xl font-bold font-display text-white tracking-wide mt-2">
            {authModalMode === 'login' ? 'Sign In to CINEXUS' : 'Join CINEXUS'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            {authModalMode === 'login' 
              ? 'Access your synchronized 4K watchlist, continue watching history, and personalized stream feeds.' 
              : 'Create your account to unlock 4K HDR playback, custom audio tracks, and private watchlists.'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-950/60 border border-red-600/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {authModalMode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Display Name</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full bg-[#07090e] border border-slate-800 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none transition-all"
                required
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@cinexus.app"
              className="w-full bg-[#07090e] border border-slate-800 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none transition-all"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Security Password</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#07090e] border border-slate-800 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none transition-all"
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-950/60 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>{authModalMode === 'login' ? 'Authenticate Account' : 'Create Free Account'}</span>
              )}
            </button>
          </div>
        </form>

        {/* Toggle Mode */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 text-center">
          {authModalMode === 'login' ? (
            <p className="text-xs text-slate-400">
              New to CINEXUS?{' '}
              <button
                type="button"
                onClick={() => openAuthModal('register')}
                className="text-red-400 hover:text-red-300 font-bold ml-1 cursor-pointer transition-colors"
              >
                Register Now
              </button>
            </p>
          ) : (
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="text-red-400 hover:text-red-300 font-bold ml-1 cursor-pointer transition-colors"
              >
                Sign In
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
