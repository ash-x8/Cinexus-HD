import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import firebaseAppletConfig from '../firebase-applet-config.json';
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  AppCheck
} from "firebase/app-check";
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

// Provisioned Firebase Project Configuration from firebase-applet-config.json
export const firebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey || "AIzaSyAekzhVaPluAKCLRZlrojsPyQEM2lXRp7Q",
  authDomain: firebaseAppletConfig.authDomain || "endless-quote-51ttq.firebaseapp.com",
  projectId: firebaseAppletConfig.projectId || "endless-quote-51ttq",
  storageBucket: firebaseAppletConfig.storageBucket || "endless-quote-51ttq.firebasestorage.app",
  messagingSenderId: firebaseAppletConfig.messagingSenderId || "416026597596",
  appId: firebaseAppletConfig.appId || "1:416026597596:web:322ba35009ebfc0a177c19",
  measurementId: firebaseAppletConfig.measurementId || "G-CGJ0MXGY1G",
  databaseURL: (firebaseAppletConfig as any).databaseURL || `https://${firebaseAppletConfig.projectId || 'endless-quote-51ttq'}-default-rtdb.firebaseio.com`
};

// 1. Initialize Firebase App instance singleton
export const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 2. Initialize Firebase App Check (Google reCAPTCHA v3) only if a valid site key is configured
export const RECAPTCHA_SITE_KEY = firebaseAppletConfig.recaptchaSiteKey || "";

let appCheckInstance: AppCheck | null = null;
if (typeof window !== "undefined" && RECAPTCHA_SITE_KEY && RECAPTCHA_SITE_KEY.trim() !== "") {
  try {
    // Enable debug token for local and staging preview domains if testing off the primary production origin
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.includes('run.app') || host.includes('webcontainer')) {
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    appCheckInstance = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(RECAPTCHA_SITE_KEY),
      isTokenAutoRefreshEnabled: true
    });
    console.info("[Firebase App Check] Initialized with Google reCAPTCHA v3 provider.");
  } catch (err) {
    console.warn("[Firebase App Check] Initialization skipped or already initialized:", err);
  }
}
export const appCheck = appCheckInstance;

// 3. Initialize Firebase Authentication
export const auth: Auth = getAuth(app);

// 4. Initialize Google Auth Provider
export const googleProvider: GoogleAuthProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account"
});

// 5. Initialize Cloud Firestore (targeting the provisioned database ID)
export const db: Firestore = firebaseAppletConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseAppletConfig.firestoreDatabaseId)
  : getFirestore(app);

// 6. Initialize Firebase Storage
export const storage: FirebaseStorage = getStorage(app);

// 7. FCM Web Push Configuration
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
