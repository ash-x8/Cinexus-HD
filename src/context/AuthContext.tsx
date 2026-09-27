import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile as updateFirebaseProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, WatchProgress, UserRole } from '../types';
import { 
  getUserWatchlistFromFirestore, 
  toggleUserWatchlistInFirestore,
  getUserWatchHistoryFromFirestore,
  saveUserWatchProgressToFirestore,
  logAdminAction
} from '../services/firestore';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
  watchlist: string[];
  history: Record<string, WatchProgress>;
  login: (email: string, pass: string) => Promise<UserProfile>;
  register: (email: string, pass: string, name: string) => Promise<UserProfile>;
  logout: () => Promise<void>;
  toggleWatchlist: (contentId: string) => Promise<void>;
  isInWatchlist: (contentId: string) => boolean;
  saveProgress: (progress: WatchProgress) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
  authModalMode: 'login' | 'register';
}

const ADMIN_EMAILS = new Set([
  'kushanashvika216@gmail.com'
]);

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [history, setHistory] = useState<Record<string, WatchProgress>>({});
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const isAdminEmail = (email?: string | null): boolean => {
    if (!email) return false;
    return ADMIN_EMAILS.has(email.toLowerCase().trim());
  };

  // Sync user profile from Firestore or create default on auth state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const isMasterAdmin = isAdminEmail(fbUser.email);
        const role: UserRole = isMasterAdmin ? 'SUPER_ADMIN' : 'USER';

        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          let userProfile: UserProfile;
          if (userDocSnap.exists()) {
            userProfile = {
              id: fbUser.uid,
              ...userDocSnap.data()
            } as UserProfile;

            // Ensure role is preserved as SUPER_ADMIN for master email
            if (isMasterAdmin && userProfile.role !== 'SUPER_ADMIN') {
              userProfile.role = 'SUPER_ADMIN';
              await setDoc(userDocRef, { role: 'SUPER_ADMIN' }, { merge: true });
            }
          } else {
            userProfile = {
              id: fbUser.uid,
              email: fbUser.email || '',
              name: fbUser.displayName || (isMasterAdmin ? 'Kushan Ashvika' : 'Cinema Subscriber'),
              avatarUrl: fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
              role,
              createdAt: new Date().toISOString(),
              preferences: {
                defaultQuality: '4K',
                defaultSubtitleLang: 'Sinhala (සිංහල උපසිරැසි)',
                autoplayNext: true
              }
            };
            await setDoc(userDocRef, userProfile);
          }

          setUser(userProfile);

          // Fetch persistent watchlist & history from Firestore
          const [savedWatchlist, savedHistory] = await Promise.all([
            getUserWatchlistFromFirestore(fbUser.uid),
            getUserWatchHistoryFromFirestore(fbUser.uid)
          ]);
          setWatchlist(savedWatchlist);
          setHistory(savedHistory);
        } catch (err) {
          console.warn('[CINEXUS Auth] Profile sync fallback:', err);
          setUser({
            id: fbUser.uid,
            email: fbUser.email || '',
            name: fbUser.displayName || 'Cinema User',
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
            role,
            createdAt: new Date().toISOString()
          });
        }
      } else {
        setUser(null);
        setWatchlist([]);
        setHistory({});
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string): Promise<UserProfile> => {
    const cleanEmail = email.trim();
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      const isMasterAdmin = isAdminEmail(cleanEmail);
      
      const userProfile: UserProfile = {
        id: cred.user.uid,
        email: cleanEmail,
        name: cred.user.displayName || (isMasterAdmin ? 'Kushan Ashvika' : 'Cinema Enthusiast'),
        avatarUrl: cred.user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        role: isMasterAdmin ? 'SUPER_ADMIN' : 'USER',
        createdAt: new Date().toISOString()
      };

      if (isMasterAdmin) {
        logAdminAction('ADMIN_LOGIN', 'auth', cred.user.uid, 'Administrator authenticated successfully via Firebase Auth', cleanEmail);
      }

      setAuthModalOpen(false);
      return userProfile;
    } catch (err: any) {
      // If user doesn't exist yet in this Firebase project (e.g. initial setup for admin)
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        if (isAdminEmail(cleanEmail)) {
          // Provision the initial administrator account in Firebase Authentication securely
          try {
            const newCred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
            await updateFirebaseProfile(newCred.user, { displayName: 'Kushan Ashvika' });
            
            const adminProfile: UserProfile = {
              id: newCred.user.uid,
              email: cleanEmail,
              name: 'Kushan Ashvika',
              avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
              role: 'SUPER_ADMIN',
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', newCred.user.uid), adminProfile);
            logAdminAction('ADMIN_ACCOUNT_INITIALIZED', 'auth', newCred.user.uid, 'First-time Administrator account created in Firebase', cleanEmail);
            
            setAuthModalOpen(false);
            return adminProfile;
          } catch (createErr: any) {
            throw new Error(createErr.message || 'Failed to authenticate administrator');
          }
        }
      }
      throw new Error(err.message || 'Invalid email or password');
    }
  };

  const register = async (email: string, pass: string, name: string): Promise<UserProfile> => {
    const cleanEmail = email.trim();
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    await updateFirebaseProfile(cred.user, { displayName: name });

    const isMasterAdmin = isAdminEmail(cleanEmail);
    const userProfile: UserProfile = {
      id: cred.user.uid,
      email: cleanEmail,
      name,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
      role: isMasterAdmin ? 'SUPER_ADMIN' : 'USER',
      createdAt: new Date().toISOString(),
      preferences: {
        defaultQuality: '4K',
        defaultSubtitleLang: 'Sinhala (සිංහල උපසිරැසි)',
        autoplayNext: true
      }
    };

    await setDoc(doc(db, 'users', cred.user.uid), userProfile);
    setAuthModalOpen(false);
    return userProfile;
  };

  const logout = async (): Promise<void> => {
    if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
      logAdminAction('ADMIN_LOGOUT', 'auth', user.id, 'Administrator logged out', user.email);
    }
    await signOut(auth);
    setUser(null);
  };

  const toggleWatchlist = async (contentId: string) => {
    if (!firebaseUser) {
      setAuthModalMode('login');
      setAuthModalOpen(true);
      return;
    }
    const updated = await toggleUserWatchlistInFirestore(firebaseUser.uid, contentId);
    setWatchlist(updated);
  };

  const isInWatchlist = (contentId: string): boolean => {
    return watchlist.includes(contentId);
  };

  const saveProgress = async (progress: WatchProgress) => {
    if (!firebaseUser) return;
    await saveUserWatchProgressToFirestore(firebaseUser.uid, progress);
    const key = progress.movieId || progress.contentId || 'unknown';
    setHistory(prev => ({
      ...prev,
      [key]: {
        ...progress,
        lastWatchedAt: new Date().toISOString()
      }
    }));
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!firebaseUser) return;
    setUser(prev => prev ? { ...prev, ...data } : null);
    try {
      await setDoc(doc(db, 'users', firebaseUser.uid), data, { merge: true });
      if (data.name) {
        await updateFirebaseProfile(firebaseUser, { displayName: data.name });
      }
    } catch (e) {
      console.warn('[CINEXUS Auth] Profile update error:', e);
    }
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || isAdminEmail(user?.email);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || isAdminEmail(user?.email);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        isAuthenticated: !!user,
        isAdmin,
        isSuperAdmin,
        loading,
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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
