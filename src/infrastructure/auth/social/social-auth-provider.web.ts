import {
  GoogleAuthProvider,
  OAuthProvider,
  getAuth,
  signInWithPopup,
} from 'firebase/auth';
import { fail, ok } from '@core/result/result-helpers';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { Result } from '@core/result/result';
import { UnknownFailure, type Failure } from '@core/failure';
import { getFirebaseApp } from '@infrastructure/firebase/firebase-init';

/**
 * Runs Google Sign-In via the Firebase JS SDK popup flow on web and resolves
 * to a Firebase ID token the backend can verify via `POST /auth/social`.
 * Returns a graceful Failure when the Firebase web config isn't injected at
 * build time or the user closes the popup.
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
    const msg = e instanceof Error ? e.message : DiagnosticMessage.socialAuth.googleFailed;
    return fail(new UnknownFailure(msg));
  }
};

/**
 * Runs Apple Sign-In via the Firebase JS SDK popup flow on web (the
 * `apple.com` OAuth provider). Requires Apple to be enabled in the Firebase
 * console. Returns a graceful Failure when Firebase isn't configured or the
 * user closes the popup.
 */
export const acquireAppleFirebaseToken = async (): Promise<Result<string, Failure>> => {
  const app = getFirebaseApp();
  if (app === null) {
    return fail(new UnknownFailure(DiagnosticMessage.socialAuth.firebaseNotConfiguredOnWeb));
  }
  try {
    const provider = new OAuthProvider('apple.com'); // TO DO: static provider ID problem
    provider.addScope('email'); // TO DO: static scope problem
    provider.addScope('name'); // TO DO: static scope problem
    const { user } = await signInWithPopup(getAuth(app), provider);
    return ok(await user.getIdToken());
  } catch (e) {
    const msg = e instanceof Error ? e.message : DiagnosticMessage.socialAuth.appleFailed;
    return fail(new UnknownFailure(msg));
  }
};
