import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { BRANDING } from '../../config/branding';

interface AdminPortalProps {
  onSuccess?: () => void;
  onExit?: () => void;
  onAccessGranted?: () => void;
  onBackToSite?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ 
  onSuccess, 
  onExit, 
  onAccessGranted, 
  onBackToSite 
}) => {
  const handleSuccess = onSuccess || onAccessGranted || (() => {});
  const handleExit = onExit || onBackToSite || (() => {});
  const { adminLogin, adminLoginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide both authorized administrator email and security password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await adminLogin(email.trim(), password.trim());
      if (res.success) {
        handleSuccess();
      } else {
        setError(res.error || 'Access denied. This account lacks Studio Administrator privileges.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid administrator credentials. Access restricted.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const res = await adminLoginWithGoogle();
      if (res.success) {
        handleSuccess();
      } else {
        setError(res.error || 'Google authentication was not authorized for Studio CMS.');
      }
    } catch (err: any) {
      setError(err.message || 'Google authentication could not be completed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#07090e] flex items-center justify-center p-4 select-none overflow-y-auto">
      {/* Background Ambient Glow */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-25 blur-3xl"
        style={{
          background: 'radial-gradient(circle at center, rgba(229, 9, 20, 0.4) 0%, rgba(15, 23, 42, 0.8) 60%, rgba(7, 9, 14, 1) 100%)'
        }}
      />

      <div className="relative w-full max-w-md bg-[#0b0f17] border border-red-900/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(229,9,20,0.2)] text-white space-y-6">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center space-y-3">
          <Logo size="lg" variant="badge" />
          
          <div className="space-y-1 mt-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-800/60 text-red-400 text-xs font-bold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-red-500" />
              <span>Studio Management Security Gateway</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Administrator Access
            </h2>
            <p className="text-xs text-slate-400 max-w-xs">
              Restricted management console for CINEXUS catalog, streaming feeds, and platform operations.
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold block text-red-200">Access Restricted</span>
              <p>{error}</p>
              {error.includes('Authentication Method Disabled') && (
                <div className="mt-2 p-2 rounded-xl bg-black/50 border border-red-500/30 text-[11px] text-zinc-300">
                  <strong className="text-amber-400 block mb-1">Quick Fix in Firebase Console:</strong>
                  <ol className="list-decimal list-inside space-y-0.5 text-zinc-400">
                    <li>Go to Firebase Console &gt; Authentication &gt; Sign-in method.</li>
                    <li>Toggle <strong>Email/Password</strong> and <strong>Google</strong> to Enabled.</li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Google Sign-In Button */}
        <button
          type="button"
          disabled={loading || googleLoading}
          onClick={handleGoogleSignIn}
          className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-3 transition-colors shadow-lg cursor-pointer disabled:opacity-50"
        >
          {googleLoading ? (
            <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Continue with Google Administrator</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-[#0b0f17] px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            Or Use Master Credentials
          </span>
          <div className="border-t border-slate-800 w-full" />
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-red-400" />
              <span>Admin Email</span>
            </label>
            <input
              type="email"
              placeholder="admin@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 focus:border-red-500 text-white text-sm placeholder:text-slate-600 focus:outline-none transition-colors"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-red-400" />
              <span>Access Key / Password</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 focus:border-red-500 text-white text-sm placeholder:text-slate-600 focus:outline-none transition-colors pr-11"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-red-700 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-950/60 border border-red-400/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Authenticate & Unlock Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleExit}
              className="w-full py-2.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Return to Public Cinema
            </button>
          </div>
        </form>

        <div className="pt-2 border-t border-slate-800/80 text-center">
          <span className="text-[10px] text-slate-400 font-mono">
            {BRANDING.name} Master v3.5 • High Security Encrypted Session
          </span>
        </div>
      </div>
    </div>
  );
};
