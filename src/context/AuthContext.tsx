import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile, UserRole } from '../types';
import { checkIsAdmin, COLLECTIONS } from '../services/firestore';
import { uploadUserProfilePhoto } from '../services/storage';
import { getFriendlyAuthErrorMessage } from '../services/authErrors';

interface AuthContextType {
  user: UserProfile | null;
  currentUser: FirebaseUser | null;
  firebaseUser: FirebaseUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  loading: boolean;
  authModalOpen: boolean;
  authModalMode: 'login' | 'register' | 'forgot_password';
  openAuthModal: (mode?: 'login' | 'register' | 'forgot_password') => void;
  closeAuthModal: () => void;
  login: (email: string, pass: string) => Promise<UserProfile>;
  register: (email: string, pass: string, name?: string) => Promise<UserProfile>;
  loginWithEmail: (email: string, pass: string) => Promise<UserProfile>;
  signupWithEmail: (email: string, pass: string, name: string) => Promise<UserProfile>;
  loginWithGoogle: () => Promise<UserProfile>;
  sendPasswordReset: (email: string) => Promise<void>;
  adminLogin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  adminLoginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  removeAvatar: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot_password'>('login');

  const openAuthModal = (mode: 'login' | 'register' | 'forgot_password' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  // Sync user profile & admin state from Firestore without blocking UI
  const syncUserData = async (fUser: FirebaseUser | null) => {
    if (!fUser) {
      setFirebaseUser(null);
      setUser(null);
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    setFirebaseUser(fUser);
    
    // Quick in-memory baseline so UI immediately unblocks
    const isMasterAdmin = (fUser.email === 'kushanashvika216@gmail.com');
    const baselineProfile: UserProfile = {
      id: fUser.uid,
      email: fUser.email || '',
      name: fUser.displayName || fUser.email?.split('@')[0] || 'Cinema Fan',
      avatarUrl: fUser.photoURL || undefined,
      role: isMasterAdmin ? 'ADMIN' : 'USER',
      createdAt: new Date().toISOString()
    };
    setUser(baselineProfile);
    setIsAdmin(isMasterAdmin);

    // Asynchronously verify with Firestore
    try {
      const isAdm = isMasterAdmin || await checkIsAdmin(fUser.uid, fUser.email || '');
      setIsAdmin(isAdm);

      const userDocRef = doc(db, COLLECTIONS.USERS, fUser.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setUser({ 
          id: fUser.uid, 
          email: data.email || fUser.email || '',
          name: data.displayName || data.name || fUser.displayName || 'Cinema Fan',
          avatarUrl: data.photoURL || data.avatarUrl || fUser.photoURL || undefined,
          role: (isAdm ? 'ADMIN' : data.role || 'USER') as UserRole,
          createdAt: data.createdAt || new Date().toISOString()
        });
      } else {
        const newProfile: UserProfile = {
          ...baselineProfile,
          role: isAdm ? 'ADMIN' : 'USER'
        };
        await setDoc(userDocRef, {
          uid: fUser.uid,
          id: fUser.uid,
          email: fUser.email,
          displayName: newProfile.name,
          name: newProfile.name,
          photoURL: fUser.photoURL || null,
          avatarUrl: fUser.photoURL || null,
          role: newProfile.role,
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }, { merge: true });
        setUser(newProfile);
      }
    } catch (err) {
      console.warn('[AuthContext] syncUserData background fetch warning:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Safety timeout: ensure loading state never gets stuck indefinitely
    const safetyTimer = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 1500);

    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      if (!isMounted) return;
      await syncUserData(fUser);
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, []);

  const loginWithEmail = async (email: string, pass: string): Promise<UserProfile> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      await syncUserData(cred.user);
      return {
        id: cred.user.uid,
        email: cred.user.email || '',
        name: cred.user.displayName || 'Cinema Fan',
        role: 'USER',
        createdAt: new Date().toISOString()
      };
    } catch (err: any) {
      throw new Error(getFriendlyAuthErrorMessage(err));
    }
  };

  const signupWithEmail = async (email: string, pass: string, name: string): Promise<UserProfile> => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (name.trim()) {
        try {
          await updateProfile(cred.user, { displayName: name.trim() });
        } catch {}
      }
      const profile: UserProfile = {
        id: cred.user.uid,
        email: cred.user.email || '',
        name: name.trim() || 'Cinema Fan',
        role: 'USER',
        createdAt: new Date().toISOString()
      };
      try {
        await setDoc(doc(db, COLLECTIONS.USERS, cred.user.uid), profile);
      } catch {}
      await syncUserData(cred.user);
      return profile;
    } catch (err: any) {
      throw new Error(getFriendlyAuthErrorMessage(err));
    }
  };

  const loginWithGoogle = async (): Promise<UserProfile> => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      const result = await signInWithPopup(auth, provider);
      const fUser = result.user;

      const isAdm = (fUser.email === 'kushanashvika216@gmail.com') || await checkIsAdmin(fUser.uid, fUser.email || '');
      const profile: UserProfile = {
        id: fUser.uid,
        email: fUser.email || '',
        name: fUser.displayName || fUser.email?.split('@')[0] || 'Cinema Fan',
        role: (isAdm ? 'ADMIN' : 'USER') as UserRole,
        avatarUrl: fUser.photoURL || undefined,
        createdAt: new Date().toISOString()
      };

      // Ensure Firestore user document creation doesn't block the UI or fail login
      try {
        await setDoc(doc(db, "users", fUser.uid), {
          uid: fUser.uid,
          id: fUser.uid,
          email: fUser.email,
          displayName: profile.name,
          name: profile.name,
          photoURL: fUser.photoURL || null,
          avatarUrl: fUser.photoURL || null,
          role: profile.role,
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch (dbErr) {
        console.warn('[AuthContext] Firestore sync warning:', dbErr);
      }

      setFirebaseUser(fUser);
      setUser(profile);
      setIsAdmin(isAdm);
      setIsLoading(false);
      return profile;
    } catch (err: any) {
      console.error("Auth Error:", err?.code, err?.message);
      throw new Error(getFriendlyAuthErrorMessage(err));
    }
  };

  const sendPasswordReset = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err: any) {
      throw new Error(getFriendlyAuthErrorMessage(err));
    }
  };

  // Dedicated Admin Login at /admin via Email/Password
  const adminLogin = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim();
    try {
      let cred;
      try {
        cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      } catch (signInErr: any) {
        // If initial admin account hasn't been created yet in Firebase Auth
        if (cleanEmail === 'kushanashvika216@gmail.com' && (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential')) {
          try {
            cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
          } catch (createErr: any) {
            throw new Error(getFriendlyAuthErrorMessage(createErr));
          }
        } else {
          throw signInErr;
        }
      }

      const isAdm = await checkIsAdmin(cred.user.uid, cleanEmail);
      if (!isAdm) {
        await signOut(auth);
        return { success: false, error: 'Access Denied: This account lacks Studio Administrator privileges.' };
      }

      await syncUserData(cred.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: getFriendlyAuthErrorMessage(err) };
    }
  };

  // Dedicated Admin Login at /admin via Google OAuth
  const adminLoginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      const cred = await signInWithPopup(auth, provider);
      const isAdm = await checkIsAdmin(cred.user.uid, cred.user.email || '');
      if (!isAdm) {
        await signOut(auth);
        return {
          success: false,
          error: `Access Denied: Account (${cred.user.email}) does not have Studio Administrator clearance.`
        };
      }

      await syncUserData(cred.user);
      return { success: true };
    } catch (err: any) {
      console.error('[Admin Google Login error]:', err);
      return { success: false, error: getFriendlyAuthErrorMessage(err) };
    }
  };

  const login = async (email: string, pass: string): Promise<UserProfile> => {
    return loginWithEmail(email, pass);
  };

  const register = async (email: string, pass: string, name?: string): Promise<UserProfile> => {
    return signupWithEmail(email, pass, name || '');
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!firebaseUser && !user) return;
    const uid = firebaseUser?.uid || user?.id;
    if (!uid) return;

    if (firebaseUser && (updates.name || updates.avatarUrl)) {
      try {
        await updateProfile(firebaseUser, {
          displayName: updates.name || firebaseUser.displayName,
          photoURL: updates.avatarUrl || firebaseUser.photoURL
        });
      } catch (e) {
        console.warn('Firebase profile update warning:', e);
      }
    }

    try {
      const userRef = doc(db, COLLECTIONS.USERS, uid);
      await setDoc(userRef, updates, { merge: true });
    } catch (e) {
      console.warn('Firestore profile update warning:', e);
    }

    setUser(prev => prev ? { ...prev, ...updates } : null);
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    if (!firebaseUser && !user) throw new Error('You must be logged in to upload an avatar.');
    const uid = firebaseUser?.uid || user?.id;
    if (!uid) throw new Error('User identifier not found.');
    const url = await uploadUserProfilePhoto(uid, file);
    await updateUserProfile({ avatarUrl: url });
    return url;
  };

  const removeAvatar = async (): Promise<void> => {
    if (!firebaseUser && !user) return;
    await updateUserProfile({ avatarUrl: '' });
  };

  const logout = async () => {
    await signOut(auth);
    setFirebaseUser(null);
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentUser: firebaseUser,
        firebaseUser,
        isAdmin,
        isLoading,
        loading: isLoading,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        sendPasswordReset,
        adminLogin,
        adminLoginWithGoogle,
        logout,
        updateProfile: updateUserProfile,
        uploadAvatar,
        removeAvatar
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
