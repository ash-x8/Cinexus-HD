export {
  app,
  auth,
  googleProvider,
  db,
  storage,
  messaging,
  VAPID_KEY,
  requestFCMToken,
  signInWithGoogle,
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  resetPassword
} from '../firebase';

import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from '../firebase';
import app from '../firebase';

// Connection check to verify Firestore connectivity
export async function verifyFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'system', 'connection_test'));
    return true;
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.warn('[CINEXUS Firebase] Client is offline or database initializing.');
      return false;
    }
    // Any other error (like not found) means connection succeeded
    return true;
  }
}

export default app;
