import {
  GoogleAuthProvider,
  OAuthProvider,
  getAuth,
  signInWithPopup,
} from 'firebase/auth';
import { fail, ok } from '@core/result/result-helpers';
import { AppleAuth } from '@infrastructure/constants/apple-auth';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { Result } from '@core/result/result';
import { CancelledFailure, UnknownFailure, type Failure } from '@core/failure';
import { getFirebaseApp } from '@infrastructure/firebase/firebase-init';
import { isCancellationError } from '@infrastructure/auth/social/is-cancellation-error';

/**
 * Runs Google Sign-In via the Firebase JS SDK popup flow on web and resolves
 * to a Firebase ID token the backend can verify via `POST /auth/social`.
 * Returns a graceful Failure when the Firebase web config isn't injected at
 * build time, and a `CancelledFailure` — which no screen renders — when the
 * user closes the popup.
 */
export const acquireGoogleFirebaseToken = async (): Promise<Result<string, Failure>> => {
  const app = getFirebaseApp();
  if (app === null) {
    return fail(new UnknownFailure(DiagnosticMessage.socialAuth.firebaseNotConfiguredOnWeb));
  }
  try {
    const provider = new GoogleAuthProvider();
    const { user } = await signInWithPopup(getAuth(app), provider);
    return ok(await user.getIdToken());
  } catch (e) {
    if (isCancellationError(e)) {
      return fail(new CancelledFailure(DiagnosticMessage.socialAuth.googleCancelled));
    }
    const msg = e instanceof Error ? e.message : DiagnosticMessage.socialAuth.googleFailed;
    return fail(new UnknownFailure(msg));
  }
};

/**
 * Runs Apple Sign-In via the Firebase JS SDK popup flow on web (the
 * `apple.com` OAuth provider). Requires Apple to be enabled in the Firebase
 * console. Returns a graceful Failure when Firebase isn't configured, and a
 * `CancelledFailure` — which no screen renders — when the user closes the popup.
 */
export const acquireAppleFirebaseToken = async (): Promise<Result<string, Failure>> => {
  const app = getFirebaseApp();
  if (app === null) {
    return fail(new UnknownFailure(DiagnosticMessage.socialAuth.firebaseNotConfiguredOnWeb));
  }
  try {
    const provider = new OAuthProvider(AppleAuth.providerId);
    for (const scope of AppleAuth.scopes) provider.addScope(scope);
    const { user } = await signInWithPopup(getAuth(app), provider);
    return ok(await user.getIdToken());
  } catch (e) {
    if (isCancellationError(e)) {
      return fail(new CancelledFailure(DiagnosticMessage.socialAuth.appleCancelled));
    }
    const msg = e instanceof Error ? e.message : DiagnosticMessage.socialAuth.appleFailed;
    return fail(new UnknownFailure(msg));
  }
};
