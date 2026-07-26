import type { Failure } from '@core/failure';
import type { Result } from '@core/result/result';
import type { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { RegistrationChallenge } from '@domain/auth/registration-challenge';

export interface FakeAuthRepositoryConfig {
  signInResult?: Result<AuthSessionEntity, Failure>;
  requestRegistrationResult?: Result<RegistrationChallenge, Failure>;
  verifyRegistrationResult?: Result<AuthSessionEntity, Failure>;
  resendRegistrationCodeResult?: Result<RegistrationChallenge, Failure>;
  signOutResult?: Result<void, Failure>;
  currentSessionResult?: Result<AuthSessionEntity | null, Failure>;
  signInWithGoogleResult?: Result<AuthSessionEntity, Failure>;
  signInWithAppleResult?: Result<AuthSessionEntity, Failure>;
  uploadAvatarResult?: Result<AuthSessionEntity, Failure>;
  updateProfileResult?: Result<AuthSessionEntity, Failure>;
  deleteAccountResult?: Result<void, Failure>;
}
