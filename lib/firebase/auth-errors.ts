import { FirebaseError } from "firebase/app";

const authErrorMessages: Record<string, string> = {
  "auth/operation-not-allowed":
    "Email/Password sign-in is disabled in Firebase Console. Enable it in Authentication > Sign-in method.",
  "auth/email-already-in-use": "This email is already registered.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/weak-password": "Password should be at least 6 characters.",
  "auth/invalid-api-key": "Firebase API key is invalid. Check NEXT_PUBLIC_FIREBASE_API_KEY.",
  "auth/network-request-failed": "Network error. Please check your connection and retry.",
  "auth/user-not-found": "No account found with this email.",
  "auth/wrong-password": "Incorrect password.",
  "auth/invalid-credential": "Invalid email/password combination.",
};

export function getFirebaseAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return authErrorMessages[error.code] ?? `Authentication error: ${error.code}`;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Authentication failed. Please try again.";
}
