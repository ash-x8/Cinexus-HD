/**
 * CINEXUS Firebase Authentication Error Handler
 * Translates Firebase Auth error codes into clean, accurate, human-readable messages.
 */

export function getFriendlyAuthErrorMessage(error: any): string {
  if (!error) return 'An unknown authentication error occurred.';
  
  // If it's already a plain user-friendly string without Firebase code prefixes
  if (typeof error === 'string') return error;

  const code = error.code || '';
  const message = error.message || '';

  // Always log raw error details to console for debugging
  console.error(`[Firebase Auth Error] Code: "${code}", Message: "${message}"`, error);

  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is disabled in your Firebase project. Please sign in with "Continue with Google" or enable Email/Password under Authentication > Sign-in method in the Firebase Console.';

    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Invalid email or password. Please verify your credentials and try again.';

    case 'auth/user-not-found':
      return 'No account found with this email address. Please register for a new account.';

    case 'auth/email-already-in-use':
      return 'This email address is already registered. Please sign in or reset your password.';

    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';

    case 'auth/invalid-email':
      return 'Please enter a valid email address.';

    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing authentication.';

    case 'auth/popup-blocked':
      return 'Google sign-in popup was blocked by your browser. Please allow popups for this site.';

    case 'auth/cancelled-popup-request':
      return 'Another authentication popup is already open. Please complete or close it first.';

    case 'auth/network-request-failed':
      return 'Network connection issue. Please check your internet connection.';

    case 'auth/too-many-requests':
      return 'Access temporarily restricted due to many failed attempts. Please try again in a moment.';

    case 'auth/user-disabled':
      return 'This account has been disabled by a system administrator.';

    case 'auth/unauthorized-domain':
      return 'This domain is not listed in your Firebase Authorized Domains (Authentication -> Settings).';

    case 'auth/firebase-app-check-token-is-invalid':
    case 'app-check/invalid-token':
      return 'Firebase App Check security token verification failed. Please refresh the page or ensure this domain is added to Google reCAPTCHA v3.';

    default:
      if (message) {
        return message.replace(/^Firebase:\s*/i, '').replace(/\(auth\/[a-z-]+\)\.?/i, '').trim() || message;
      }
      return 'Authentication could not be completed. Please try again.';
  }
}
