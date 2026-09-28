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

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isAdmin: boolean;
  isLoading: boolean;
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

  // Sync user profile & admin state from Firestore
  const syncUserData = async (fUser: FirebaseUser | null) => {
    if (!fUser) {
      setFirebaseUser(null);
      setUser(null);
      setIsAdmin(false);
      setIsLoading(false);
      return;
    }

    setFirebaseUser(fUser);
    try {
      const isAdm = await checkIsAdmin(fUser.uid, fUser.email || '');
      setIsAdmin(isAdm);

      const userDocRef = doc(db, COLLECTIONS.USERS, fUser.uid);
      const userSnap = await getDoc(userDocRef);

      if (userSnap.exists()) {
        setUser({ id: fUser.uid, ...(userSnap.data() as Omit<UserProfile, 'id'>) });
      } else {
        const newProfile: UserProfile = {
          id: fUser.uid,
          email: fUser.email || '',
          name: fUser.displayName || fUser.email?.split('@')[0] || 'Cinema Fan',
          avatarUrl: fUser.photoURL || undefined,
          role: (isAdm ? 'ADMIN' : 'USER') as UserRole,
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, newProfile, { merge: true });
        setUser(newProfile);
      }
    } catch (err) {
      console.warn('[AuthContext] syncUserData fallback:', err);
      // Fallback in-memory profile
      const isAdm = fUser.email === 'kushanashvika216@gmail.com';
      setIsAdmin(isAdm);
      setUser({
        id: fUser.uid,
        email: fUser.email || '',
        name: fUser.displayName || 'Cinema Fan',
        avatarUrl: fUser.photoURL || undefined,
        role: isAdm ? 'ADMIN' : 'USER',
        createdAt: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fUser) => {
      syncUserData(fUser);
    });
    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string): Promise<UserProfile> => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
    await syncUserData(cred.user);
    return {
      id: cred.user.uid,
      email: cred.user.email || '',
      name: cred.user.displayName || 'Cinema Fan',
      role: 'USER',
      createdAt: new Date().toISOString()
    };
  };

  const signupWithEmail = async (email: string, pass: string, name: string): Promise<UserProfile> => {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (name.trim()) {
      await updateProfile(cred.user, { displayName: name.trim() });
    }
    const profile: UserProfile = {
      id: cred.user.uid,
      email: cred.user.email || '',
      name: name.trim() || 'Cinema Fan',
      role: 'USER',
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, COLLECTIONS.USERS, cred.user.uid), profile);
    await syncUserData(cred.user);
    return profile;
  };

  const loginWithGoogle = async (): Promise<UserProfile> => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      client_id: '1034803141860-6216717n36tf103ucti42jjicpaftkkk.apps.googleusercontent.com',
      prompt: 'select_account'
    });
    const cred = await signInWithPopup(auth, provider);
    await syncUserData(cred.user);
    return {
      id: cred.user.uid,
      email: cred.user.email || '',
      name: cred.user.displayName || 'Cinema Fan',
      role: 'USER',
      avatarUrl: cred.user.photoURL || undefined,
      createdAt: new Date().toISOString()
    };
  };

  const sendPasswordReset = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  // Dedicated Admin Login at /admin
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
            throw new Error(createErr.message || 'Failed to authenticate administrator account.');
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
      return { success: false, error: err.message || 'Authentication failed. Please verify credentials.' };
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
        firebaseUser,
        isAdmin,
        isLoading,
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
