import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';
import { X, Mail, Lock, User, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { getFriendlyAuthErrorMessage } from '../../services/authErrors';

export const AuthModal: React.FC = () => {
  const { 
    authModalOpen, 
    authModalMode, 
    closeAuthModal, 
    openAuthModal, 
    login, 
    register, 
    loginWithGoogle,
    sendPasswordReset 
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setError('Please provide your email address.');
      return;
    }

    if (authModalMode === 'forgot_password') {
      setLoading(true);
      try {
        await sendPasswordReset(email.trim());
        setSuccessMessage('Password reset link sent! Please check your inbox.');
      } catch (err: any) {
        setError(getFriendlyAuthErrorMessage(err));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password.trim()) {
      setError('Please provide your password.');
      return;
    }

    if (authModalMode === 'register' && !name.trim()) {
      setError('Please enter your preferred display name.');
      return;
    }

    setLoading(true);
    try {
      if (authModalMode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      closeAuthModal();
    } catch (err: any) {
      setError(getFriendlyAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      closeAuthModal();
    } catch (err: any) {
      setError(getFriendlyAuthErrorMessage(err));
    } finally {
      setGoogleLoading(false);
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
            {authModalMode === 'login' && 'Sign In to CINEXUS'}
            {authModalMode === 'register' && 'Join CINEXUS'}
            {authModalMode === 'forgot_password' && 'Reset Password'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            {authModalMode === 'login' && 'Access your synchronized 4K watchlist, continue watching history, and personalized stream feeds.'}
            {authModalMode === 'register' && 'Create your account to unlock 4K HDR playback, custom audio tracks, and private watchlists.'}
            {authModalMode === 'forgot_password' && 'Enter your registered email address and we will dispatch a secure reset link.'}
          </p>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-red-950/60 border border-red-600/40 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Authentication Button */}
        {authModalMode !== 'forgot_password' && (
          <div className="mb-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-white text-xs font-semibold flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.86c2.26-2.09 3.68-5.17 3.68-9.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.26v3.09C3.26 21.36 7.37 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.61H1.26C.46 8.23 0 10.06 0 12s.46 3.77 1.26 5.39l4.01-3.1z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.64 1.26 6.61l4.01 3.1c.95-2.85 3.6-4.96 6.73-4.96z"
                />
              </svg>
              <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <span className="relative bg-[#0b0f17] px-3 text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                Or with Email
              </span>
            </div>
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

          {authModalMode !== 'forgot_password' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Password</span>
                </label>
                {authModalMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => openAuthModal('forgot_password')}
                    className="text-[11px] text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#07090e] border border-slate-800 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none transition-all"
                required
              />
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-950/60 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>
                  {authModalMode === 'login' && 'Sign In'}
                  {authModalMode === 'register' && 'Create Free Account'}
                  {authModalMode === 'forgot_password' && 'Send Reset Link'}
                </span>
              )}
            </button>
          </div>
        </form>

        {/* Toggle Mode */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 text-center">
          {authModalMode === 'forgot_password' ? (
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </button>
          ) : authModalMode === 'login' ? (
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
