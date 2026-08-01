import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { UnknownFailure, type Failure } from '@core/failure';
import { GOOGLE_WEB_CLIENT_ID } from '@infrastructure/constants/api';
import { generateNonce, hashNonce } from '@infrastructure/auth/social/nonce-generator';
import type { GoogleSigninMod } from '@infrastructure/auth/social/google-signin-mod';
import type { FirebaseAuthMod } from '@infrastructure/auth/social/firebase-auth-mod';
import * as AppleAuthentication from 'expo-apple-authentication';

// WHY: static imports of @react-native-google-signin and @react-native-firebase/auth
// trigger TurboModule / RNFBAppModule initialisation at module-load time, crashing
// Expo Go before any try/catch can intervene. The IIFE catches that throw once;
// the provider functions return a graceful Failure when the module is unavailable.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const googleSigninMod: GoogleSigninMod | null = (() => { try { return require('@react-native-google-signin/google-signin') as GoogleSigninMod; } catch { return null; } })();
// eslint-disable-next-line @typescript-eslint/no-require-imports
const firebaseAuthMod: FirebaseAuthMod | null = (() => { try { return require('@react-native-firebase/auth') as FirebaseAuthMod; } catch { return null; } })();

let googleConfigured = false;

/**
 * Runs the native Google Sign-In flow (Play Services check + Firebase
 * credential exchange) and resolves to a Firebase ID token the backend can
 * verify via `POST /auth/social`. Returns a graceful Failure when the native
 * modules aren't present (e.g. Expo Go) or the user cancels.
 */
export const acquireGoogleFirebaseToken = async (): Promise<Result<string, Failure>> => {
  if (googleSigninMod === null || firebaseAuthMod === null) {
    return fail(new UnknownFailure('Google Sign-In is not available in this build'));
  }
  const { GoogleSignin, isSuccessResponse } = googleSigninMod;
  const auth = firebaseAuthMod.default;
  if (!googleConfigured) {
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
    googleConfigured = true;
  }
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) {
      return fail(new UnknownFailure('Google sign-in was cancelled')); // TO DO: static error message problem
    }
    const { idToken } = response.data;
    if (!idToken) {
      return fail(new UnknownFailure('Google did not return an ID token')); // TO DO: static error message problem
    }
    const credential = auth.GoogleAuthProvider.credential(idToken);
    const { user } = await auth().signInWithCredential(credential);
    return ok(await user.getIdToken());
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Google sign-in failed'; // TO DO: static error message problem
    return fail(new UnknownFailure(msg));
  }
};

/**
 * Runs the native Apple Sign-In flow with a hashed nonce and resolves to a
 * Firebase ID token. Returns a graceful Failure when Apple Sign-In or the
 * Firebase module is unavailable on the device/build.
 */
export const acquireAppleFirebaseToken = async (): Promise<Result<string, Failure>> => {
  if (firebaseAuthMod === null) {
    return fail(new UnknownFailure('Apple Sign-In is not available in this build'));
  }
  const auth = firebaseAuthMod.default;
  try {
    const available = await AppleAuthentication.isAvailableAsync();
    if (!available) {
      return fail(new UnknownFailure('Apple Sign-In is not available on this device')); // TO DO: static error message problem
    }
    const rawNonce = generateNonce();
    const hashedNonce = await hashNonce(rawNonce);
    const appleCredential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
    const { identityToken } = appleCredential;
    if (!identityToken) {
      return fail(new UnknownFailure('Apple did not return an identity token')); // TO DO: static error message problem
    }
    const credential = auth.AppleAuthProvider.credential(identityToken, rawNonce);
    const { user } = await auth().signInWithCredential(credential);
    return ok(await user.getIdToken());
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Apple sign-in failed'; // TO DO: static error message problem
    return fail(new UnknownFailure(msg));
  }
};
