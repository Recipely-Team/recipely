import { fail, ok } from '@core/result/result-helpers';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { Result } from '@core/result/result';
import { CancelledFailure, UnknownFailure, type Failure } from '@core/failure';
import { GOOGLE_WEB_CLIENT_ID } from '@infrastructure/constants/build-secrets';
import { generateNonce, hashNonce } from '@infrastructure/auth/social/nonce-generator';
import { isCancellationError } from '@infrastructure/auth/social/is-cancellation-error';
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
 * modules aren't present (e.g. Expo Go).
 *
 * @remarks
 * - **Dismissing the sheet is a `CancelledFailure`**, not an error. The module
 *   reports it two ways depending on where the user backed out — a
 *   non-success `SignInResponse` (`SignInResponse` is success-or-cancelled), or
 *   a throw carrying `statusCodes.SIGN_IN_CANCELLED` — so both are mapped.
 */
export const acquireGoogleFirebaseToken = async (): Promise<Result<string, Failure>> => {
  if (googleSigninMod === null || firebaseAuthMod === null) {
    return fail(new UnknownFailure(DiagnosticMessage.auth.googleUnavailableInBuild));
  }
  const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = googleSigninMod;
  const auth = firebaseAuthMod.default;
  if (!googleConfigured) {
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
    googleConfigured = true;
  }
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) {
      return fail(new CancelledFailure(DiagnosticMessage.socialAuth.googleCancelled));
    }
    const { idToken } = response.data;
    if (!idToken) {
      return fail(new UnknownFailure(DiagnosticMessage.socialAuth.googleNoIdToken));
    }
    const credential = auth.GoogleAuthProvider.credential(idToken);
    const { user } = await auth().signInWithCredential(credential);
    return ok(await user.getIdToken());
  } catch (e) {
    if (isErrorWithCode(e) && e.code === statusCodes.SIGN_IN_CANCELLED) {
      return fail(new CancelledFailure(DiagnosticMessage.socialAuth.googleCancelled));
    }
    const msg = e instanceof Error ? e.message : DiagnosticMessage.socialAuth.googleFailed;
    return fail(new UnknownFailure(msg));
  }
};

/**
 * Runs the native Apple Sign-In flow with a hashed nonce and resolves to a
 * Firebase ID token. Returns a graceful Failure when Apple Sign-In or the
 * Firebase module is unavailable on the device/build.
 *
 * @remarks
 * - **Dismissing the sheet is a `CancelledFailure`**, not an error:
 *   `signInAsync` rejects with `ERR_REQUEST_CANCELED` and the screen must stay
 *   silent for it.
 */
export const acquireAppleFirebaseToken = async (): Promise<Result<string, Failure>> => {
  if (firebaseAuthMod === null) {
    return fail(new UnknownFailure(DiagnosticMessage.auth.appleUnavailableInBuild));
  }
  const auth = firebaseAuthMod.default;
  try {
    const available = await AppleAuthentication.isAvailableAsync();
    if (!available) {
      return fail(new UnknownFailure(DiagnosticMessage.socialAuth.appleUnavailable));
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
      return fail(new UnknownFailure(DiagnosticMessage.socialAuth.appleNoIdentityToken));
    }
    const credential = auth.AppleAuthProvider.credential(identityToken, rawNonce);
    const { user } = await auth().signInWithCredential(credential);
    return ok(await user.getIdToken());
  } catch (e) {
    if (isCancellationError(e)) {
      return fail(new CancelledFailure(DiagnosticMessage.socialAuth.appleCancelled));
    }
    const msg = e instanceof Error ? e.message : DiagnosticMessage.socialAuth.appleFailed;
    return fail(new UnknownFailure(msg));
  }
};
