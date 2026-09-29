import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
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
  UserCredential,
  Auth
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import defaultConfig from '../firebase-applet-config.json';

// Safely resolve clean environment variable without corrupted/empty string states
const getEnvVal = (key: string, fallback: string = ''): string => {
  try {
    const val = (import.meta as any).env?.[key];
    if (typeof val === 'string' && val.trim().length > 0) {
      return val.trim();
    }
  } catch {}
  return fallback;
};

// Pristine Firebase configuration
export const firebaseConfig = {
  apiKey: getEnvVal('VITE_FIREBASE_API_KEY', defaultConfig.apiKey),
  authDomain: getEnvVal('VITE_FIREBASE_AUTH_DOMAIN', defaultConfig.authDomain),
  projectId: getEnvVal('VITE_FIREBASE_PROJECT_ID', defaultConfig.projectId),
  storageBucket: getEnvVal('VITE_FIREBASE_STORAGE_BUCKET', defaultConfig.storageBucket),
  messagingSenderId: getEnvVal('VITE_FIREBASE_MESSAGING_SENDER_ID', defaultConfig.messagingSenderId),
  appId: getEnvVal('VITE_FIREBASE_APP_ID', defaultConfig.appId)
};

// 1. Initialize or retrieve existing Firebase App instance
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// 2. Initialize Firebase Authentication
export const auth: Auth = getAuth(app);

// 3. Initialize Google Auth Provider
export const googleProvider: GoogleAuthProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// 4. Initialize Cloud Firestore
export const db: Firestore = (defaultConfig as any).firestoreDatabaseId
  ? getFirestore(app, (defaultConfig as any).firestoreDatabaseId)
  : getFirestore(app);

// 5. Initialize Firebase Storage
export const storage: FirebaseStorage = getStorage(app);

/**
 * Perform real Google Sign-In with popup
 */
export async function signInWithGoogle(): Promise<{ user: FirebaseUser; credential: UserCredential }> {
  try {
    const credential = await signInWithPopup(auth, googleProvider);
    return { user: credential.user, credential };
  } catch (error: any) {
    console.error('[Firebase signInWithGoogle Error]', {
      code: error?.code,
      message: error?.message,
      error
    });
    throw error;
  }
}

/**
 * Perform real Email & Password login
 */
export async function loginWithEmail(email: string, pass: string): Promise<UserCredential> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return credential;
  } catch (error: any) {
    console.error('[Firebase loginWithEmail Error]', {
      code: error?.code,
      message: error?.message,
      error
    });
    throw error;
  }
}

/**
 * Perform real Email & Password registration
 */
export async function registerWithEmail(email: string, pass: string, name?: string): Promise<UserCredential> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (name?.trim()) {
      try {
        await updateProfile(credential.user, { displayName: name.trim() });
      } catch (profileErr) {
        console.warn('[Firebase] Could not set display name:', profileErr);
      }
    }
    return credential;
  } catch (error: any) {
    console.error('[Firebase registerWithEmail Error]', {
      code: error?.code,
      message: error?.message,
      error
    });
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('[Firebase logoutUser Error]', error);
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error: any) {
    console.error('[Firebase resetPassword Error]', {
      code: error?.code,
      message: error?.message,
      error
    });
    throw error;
  }
}

export default app;
