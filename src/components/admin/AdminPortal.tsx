import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../common/Logo';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { BRANDING } from '../../config/branding';

interface AdminPortalProps {
  onSuccess: () => void;
  onExit: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onSuccess, onExit }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide both authorized administrator email and security password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const user = await login(email.trim(), password.trim());
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        onSuccess();
      } else {
        setError('Access denied. This account lacks Studio Administrator privileges.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid administrator credentials. Access restricted.');
    } finally {
      setLoading(false);
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
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-red-400" />
              <span>Admin Email</span>
            </label>
            <input
              type="email"
              placeholder="kushanashvika216@gmail.com"
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
              onClick={onExit}
              className="w-full py-2.5 rounded-2xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors"
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
