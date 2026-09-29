import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
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
} from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getMessaging, getToken, Messaging } from "firebase/messaging";

// User's Verified Firebase Project Configuration
export const firebaseConfig = {
  apiKey: "AIzaSyBaVKLUMUG_iHv2zgtX5FHeTBMrsPskgoE",
  authDomain: "cinexus-hd.firebaseapp.com",
  projectId: "cinexus-hd",
  storageBucket: "cinexus-hd.firebasestorage.app",
  messagingSenderId: "1034803141860",
  appId: "1:1034803141860:web:ebb6cc8ba4bc3b84a960f1",
  measurementId: "G-CGJ0MXGY1G",
  databaseURL: "https://cinexus-hd-default-rtdb.firebaseio.com"
};

// 1. Initialize Firebase App instance singleton
export const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 2. Initialize Firebase Authentication
export const auth: Auth = getAuth(app);

// 3. Initialize Google Auth Provider
export const googleProvider: GoogleAuthProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account"
});

// 4. Initialize Cloud Firestore
export const db: Firestore = getFirestore(app);

// 5. Initialize Firebase Storage
export const storage: FirebaseStorage = getStorage(app);

// 6. FCM Web Push Configuration
export const VAPID_KEY = "BMPwkRAMWqQI7SZeugiJqeJIH5JWi06aKyk0I8bDt6ItPK5o4svOqhDAN9Qg1UAjUEk_eNGKpm04gqUgjfUrQiM";

let messagingInstance: Messaging | null = null;
if (typeof window !== "undefined") {
  try {
    messagingInstance = getMessaging(app);
  } catch (err) {
    console.info("[FCM] Push messaging initialized or skipped based on browser context.");
  }
}
export const messaging = messagingInstance;

/**
 * Request notification permission and retrieve FCM Web Push token
 */
export async function requestFCMToken(): Promise<string | null> {
  if (typeof window === "undefined" || !messaging) return null;
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
      return currentToken;
    }
    return null;
  } catch (err) {
    console.warn("[FCM] Failed to acquire push token:", err);
    return null;
  }
}

/**
 * Perform real Google Sign-In with popup
 */
export async function signInWithGoogle(): Promise<{ user: FirebaseUser; credential: UserCredential }> {
  try {
    const credential = await signInWithPopup(auth, googleProvider);
    return { user: credential.user, credential };
  } catch (error: any) {
    console.error("[Firebase signInWithGoogle Error]", {
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
    console.error("[Firebase loginWithEmail Error]", {
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
        console.warn("[Firebase] Could not set display name:", profileErr);
      }
    }
    return credential;
  } catch (error: any) {
    console.error("[Firebase registerWithEmail Error]", {
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
    console.error("[Firebase logoutUser Error]", error);
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
    console.error("[Firebase resetPassword Error]", {
      code: error?.code,
      message: error?.message,
      error
    });
    throw error;
  }
}

export default app;
