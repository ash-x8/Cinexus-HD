import React, { useState, useEffect } from 'react';
import { auth, googleProvider, db } from '../../firebase';
import { 
  signInWithRedirect, 
  getRedirectResult, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { checkIsAdmin, sanitizeData, sanitizeMovieData } from '../../services/firestore';
export { sanitizeData, sanitizeMovieData };

/**
 * Data Sanitization before Firestore Write
 * Converts all undefined values to empty strings
 */
export const sanitizePayload = (data: Record<string, any>): Record<string, any> => {
  const cleanObj: Record<string, any> = {};
  Object.keys(data).forEach((key) => {
    cleanObj[key] = data[key] === undefined ? "" : data[key];
  });
  return cleanObj;
};

/**
 * Helper to save movie record with sanitizePayload
 */
export const saveMovieToFirestore = async (movieId: string, payload: Record<string, any>) => {
  const cleanPayload = sanitizePayload(payload);
  await setDoc(doc(db, "movies", movieId), cleanPayload, { merge: true });
  return cleanPayload;
};
import { Logo } from '../common/Logo';
import { Lock, Mail, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';
import { getFriendlyAuthErrorMessage } from '../../services/authErrors';

interface AdminCMSProps {
  onSuccess?: () => void;
  onExit?: () => void;
}

export const AdminCMS: React.FC<AdminCMSProps> = ({ 
  onSuccess = () => {}, 
  onExit = () => {} 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [initialChecking, setInitialChecking] = useState(true);

  // Monitor auth state and capture Google redirect result on mount
  useEffect(() => {
    let isMounted = true;

    // Safety timeout: ensure loading state never gets stuck indefinitely
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
        setInitialChecking(false);
      }
    }, 1500);

    // Capture incoming redirect result from Google authentication
    getRedirectResult(auth)
      .then(async (result) => {
        if (!isMounted || !result?.user) return;
        const user = result.user;
        try {
          await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            id: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            role: 'ADMIN',
            lastLogin: new Date().toISOString()
          }, { merge: true });
        } catch (dbErr) {
          console.warn('[AdminCMS Google Redirect Firestore sync warning]', dbErr);
        }

        const isAdm = await checkIsAdmin(user.uid, user.email || '');
        if (!isAdm) {
          setError(`Access Denied: Account (${user.email}) does not have Studio Administrator clearance.`);
          return;
        }
        onSuccess();
      })
      .catch((err: any) => {
        if (!isMounted) return;
        console.error('[AdminCMS getRedirectResult Error]', { code: err?.code, message: err?.message, err });
        setError(err?.code || err?.message || 'Authentication error occurred.');
      });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;

      try {
        if (currentUser) {
          const isAdm = await checkIsAdmin(currentUser.uid, currentUser.email || '');
          if (isAdm && isMounted) {
            onSuccess();
            return;
          }
        }
      } catch (err) {
        console.error('[AdminCMS onAuthStateChanged error]', err);
      } finally {
        // ALWAYS called in both success and error blocks
        if (isMounted) {
          setLoading(false);
          setInitialChecking(false);
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, [onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const cleanEmail = email.trim();
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      
      const isAdm = await checkIsAdmin(cred.user.uid, cleanEmail);
      if (!isAdm) {
        setError('Access Denied: This account lacks Studio Administrator privileges.');
        return;
      }
      onSuccess();
    } catch (err: any) {
      console.error('[AdminCMS Email Login Error]', { code: err?.code, message: err?.message, err });
      setError(err?.code || err?.message || 'Login failed.');
    } finally {
      // ALWAYS called to render form cleanly
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      // Standard Firebase redirect authentication flow
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectErr: any) {
        // Fallback for sandboxed iframe environments where redirect navigation may be restricted
        if (redirectErr?.code === 'auth/operation-not-supported-in-this-environment') {
          const result = await signInWithPopup(auth, googleProvider);
          const user = result.user;
          const isAdm = await checkIsAdmin(user.uid, user.email || '');
          if (!isAdm) {
            setError(`Access Denied: Account (${user.email}) does not have Studio Administrator clearance.`);
            return;
          }
          onSuccess();
        } else {
          throw redirectErr;
        }
      }
    } catch (err: any) {
      console.error('[AdminCMS Google Login Error]', { code: err?.code, message: err?.message, err });
      setError(err?.code || err?.message || 'Authentication error.');
    } finally {
      setGoogleLoading(false);
      setLoading(false);
    }
  };

  if (initialChecking) {
    return (
      <div className="min-h-screen bg-[#0B0D12] text-white flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <p className="text-xs text-zinc-400">Verifying administrator credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0D12] text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-3xl bg-[#12151E] border border-amber-500/20 shadow-[0_0_50px_rgba(229,169,60,0.15)] space-y-6">
        
        {/* Brand Lockup with Official Logo */}
        <div className="text-center flex flex-col items-center space-y-2">
          <Logo size="lg" className="mb-2" />
          <h1 className="text-lg font-bold tracking-wider uppercase font-display text-amber-400">
            Studio CMS Console
          </h1>
          <p className="text-xs text-zinc-400">
            Administrative Access Control & Realtime Media Manager
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-600/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2.5 leading-relaxed">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <div className="space-y-0.5 flex-1">
              <span className="font-semibold block text-red-300">Access Restricted</span>
              <p className="text-zinc-300">{error}</p>
            </div>
          </div>
        )}

        {/* Google Sign-In for Admin */}
        <button
          type="button"
          disabled={loading || googleLoading}
          onClick={handleGoogleLogin}
          className="w-full py-3 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs flex items-center justify-center gap-3 transition-colors shadow-lg cursor-pointer disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-zinc-900" />
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
          <div className="border-t border-white/10 w-full" />
          <span className="bg-[#12151E] px-3 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
            Or Use Master Credentials
          </span>
          <div className="border-t border-white/10 w-full" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kushanashvika216@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Security Key / Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-xs font-bold text-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Authenticating Studio...</span>
              </>
            ) : (
              <>
                <span>Access CMS Console</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onExit}
            className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            ← Return to Public Cinema
          </button>
        </div>

      </div>
    </div>
  );
};

export default AdminCMS;
