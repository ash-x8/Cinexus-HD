import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseAppletConfig from '../firebase-applet-config.json';
import { getFriendlyAuthErrorMessage } from './services/authErrors';

// Dual-source configuration: supports both Vite environment variables and firebase-applet-config.json
const env = (import.meta as any).env || {};
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || (firebaseAppletConfig as any).apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || (firebaseAppletConfig as any).authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || (firebaseAppletConfig as any).projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || (firebaseAppletConfig as any).storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || (firebaseAppletConfig as any).messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || (firebaseAppletConfig as any).appId,
  firestoreDatabaseId: (firebaseAppletConfig as any).firestoreDatabaseId
};

// 1. Initialize Firebase App instance singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// 2. Initialize Firebase Auth
export const auth = getAuth(app);

// 3. Initialize Google Auth Provider with recommended settings
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// 4. Initialize Cloud Firestore with dedicated Database ID if configured
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// 5. Initialize Firebase Storage
export const storage = getStorage(app);

/**
 * Helper function: Sign in with Google Popup
 */
export async function signInWithGoogle(): Promise<{ user: FirebaseUser; credential: UserCredential }> {
  try {
    const credential = await signInWithPopup(auth, googleProvider);
    
    // Sync basic profile document into Firestore if new
    try {
      const userRef = doc(db, 'users', credential.user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          id: credential.user.uid,
          email: credential.user.email || '',
          name: credential.user.displayName || credential.user.email?.split('@')[0] || 'Cinema Fan',
          avatarUrl: credential.user.photoURL || '',
          role: credential.user.email === 'kushanashvika216@gmail.com' ? 'ADMIN' : 'USER',
          createdAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (e) {
      console.warn('[Firebase] Firestore user profile sync skipped:', e);
    }
    
    return { user: credential.user, credential };
  } catch (error: any) {
    console.error('[Firebase signInWithGoogle Error]:', error);
    const friendlyMessage = getFriendlyAuthErrorMessage(error);
    const customError = new Error(friendlyMessage);
    (customError as any).code = error.code;
    (customError as any).rawError = error;
    throw customError;
  }
}

/**
 * Helper function: Login with Email & Password
 */
export async function loginWithEmail(email: string, pass: string): Promise<UserCredential> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return credential;
  } catch (error: any) {
    console.error('[Firebase loginWithEmail Error]:', error);
    const friendlyMessage = getFriendlyAuthErrorMessage(error);
    const customError = new Error(friendlyMessage);
    (customError as any).code = error.code;
    (customError as any).rawError = error;
    throw customError;
  }
}

/**
 * Helper function: Register with Email, Password & Display Name
 */
export async function registerWithEmail(email: string, pass: string, name?: string): Promise<UserCredential> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (name?.trim()) {
      try {
        await updateProfile(credential.user, { displayName: name.trim() });
      } catch (e) {
        console.warn('[Firebase] Display name update error:', e);
      }
    }
    // Write profile document
    try {
      await setDoc(doc(db, 'users', credential.user.uid), {
        id: credential.user.uid,
        email: credential.user.email || '',
        name: name?.trim() || credential.user.displayName || 'Cinema Fan',
        role: credential.user.email === 'kushanashvika216@gmail.com' ? 'ADMIN' : 'USER',
        createdAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn('[Firebase] Initial profile set warning:', e);
    }
    return credential;
  } catch (error: any) {
    console.error('[Firebase registerWithEmail Error]:', error);
    const friendlyMessage = getFriendlyAuthErrorMessage(error);
    const customError = new Error(friendlyMessage);
    (customError as any).code = error.code;
    (customError as any).rawError = error;
    throw customError;
  }
}

/**
 * Helper function: Sign out
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('[Firebase logoutUser Error]:', error);
    throw error;
  }
}

/**
 * Helper function: Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error: any) {
    console.error('[Firebase resetPassword Error]:', error);
    const friendlyMessage = getFriendlyAuthErrorMessage(error);
    const customError = new Error(friendlyMessage);
    (customError as any).code = error.code;
    throw customError;
  }
}

export default app;
