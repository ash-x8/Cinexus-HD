/**
 * CINEXUS Firebase Authentication Error Handler
 * Translates Firebase Auth error codes into clear, friendly, actionable messages.
 */

export function getFriendlyAuthErrorMessage(error: any): string {
  if (!error) return 'An unknown authentication error occurred.';
  
  const code = error.code || (typeof error.message === 'string' && error.message.includes('auth/') 
    ? error.message.match(/auth\/[a-z-]+/)?.[0] 
    : '');

  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Authentication Method Disabled: Email/Password or Google Sign-In is not yet enabled in your Firebase Console. Please open Firebase Console -> Authentication -> Sign-in method, and toggle Email/Password and Google providers to Enabled.';

    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Invalid credentials. Please verify your email and password, or use Google Sign-In.';

    case 'auth/user-not-found':
      return 'No account exists with this email address. Please click Register to create a new CINEXUS account.';

    case 'auth/email-already-in-use':
      return 'An account with this email address is already registered. Please sign in or reset your password.';

    case 'auth/weak-password':
      return 'Password is too weak. Please choose a password with at least 6 characters.';

    case 'auth/invalid-email':
      return 'The email address provided is not properly formatted.';

    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing authentication.';

    case 'auth/popup-blocked':
      return 'Authentication popup was blocked by your browser. Please allow popups for this site and try again.';

    case 'auth/cancelled-popup-request':
      return 'Another authentication popup is already open. Please complete or close it first.';

    case 'auth/network-request-failed':
      return 'Network connectivity issue. Please check your internet connection and try again.';

    case 'auth/too-many-requests':
      return 'Too many failed login attempts. Access is temporarily restricted. Please try again in a few minutes or reset your password.';

    case 'auth/user-disabled':
      return 'This account has been disabled by a system administrator.';

    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in your Firebase Console for OAuth operations. Add this domain to Firebase Console -> Authentication -> Settings -> Authorized domains.';

    default:
      if (typeof error.message === 'string' && error.message.trim()) {
        return error.message.replace(/^Firebase:\s*/i, '').replace(/\(auth\/[a-z-]+\)\.?/i, '').trim() || error.message;
      }
      return 'Authentication could not be completed. Please try again.';
  }
}
