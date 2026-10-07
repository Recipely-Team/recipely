import type { Container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import type { ApplicationStores } from '@application/di/application-stores';
import type { AuthRepositoryInterface } from '@domain/auth/auth-repository-interface';
import { SignInUseCase } from '@application/auth/sign-in/sign-in-use-case';
import { RequestRegistrationUseCase } from '@application/auth/registration/request-registration-use-case';
import { VerifyRegistrationUseCase } from '@application/auth/registration/verify-registration-use-case';
import { ResendRegistrationCodeUseCase } from '@application/auth/registration/resend-registration-code-use-case';
import { SignOutUseCase } from '@application/auth/session/sign-out-use-case';
import { GetSessionUseCase } from '@application/auth/session/get-session-use-case';
import { SignInWithGoogleUseCase } from '@application/auth/sign-in/sign-in-with-google-use-case';
import { SignInWithAppleUseCase } from '@application/auth/sign-in/sign-in-with-apple-use-case';
import { RequestPasswordResetUseCase } from '@application/auth/password-reset/request-password-reset-use-case';
import { ResetPasswordUseCase } from '@application/auth/password-reset/reset-password-use-case';
import { UploadAvatarUseCase } from '@application/auth/profile/upload-avatar-use-case';
import { UpdateProfileUseCase } from '@application/auth/profile/update-profile-use-case';
import { DeleteAccountUseCase } from '@application/auth/session/delete-account-use-case';
import { configureAuthStore } from '@application/auth/auth-store';
import type { DeviceIdentityInterface } from '@domain/device/device-identity-interface';
import type { DeviceRepositoryInterface } from '@domain/device/device-repository-interface';
import { RecordDeviceUseCase } from '@application/device/record-device-use-case';
import { RequestCreatorTagUseCase } from '@application/creators/claim/request-creator-tag-use-case';
import { RemoveCreatorTagUseCase } from '@application/creators/claim/remove-creator-tag-use-case';
import { RefreshCreatorClaimUseCase } from '@application/creators/claim/refresh-creator-claim-use-case';
import { recordDeviceOnSessionRestore } from '@application/device/record-device-on-session-restore';

interface AuthCompositionDeps {
  readonly savedRecipesStore: ApplicationStores['savedRecipesStore'];
  readonly loadFavoritesUseCase: ApplicationStores['loadFavoritesUseCase'];
  readonly clearSessionCaches: () => void;
}

/**
 * **Auth composition** — the session store, built last because sign-out, account deletion
 * and session expiry wipe every user-scoped store through `clearSessionCaches`.
 */
export const registerAuth = (
  container: Container,
  { savedRecipesStore, loadFavoritesUseCase, clearSessionCaches }: AuthCompositionDeps,
): ApplicationStores['authStore'] => {
  const authRepo = container.resolve<AuthRepositoryInterface>(TOKENS.AuthRepository);
  const signIn = new SignInUseCase(authRepo);
  const requestRegistration = new RequestRegistrationUseCase(authRepo);
  const verifyRegistration = new VerifyRegistrationUseCase(authRepo);
  const resendRegistrationCode = new ResendRegistrationCodeUseCase(authRepo);
  const signOut = new SignOutUseCase(authRepo);
  const getSession = new GetSessionUseCase(authRepo);
  const signInWithGoogle = new SignInWithGoogleUseCase(authRepo);
  const signInWithApple = new SignInWithAppleUseCase(authRepo);
  const requestPasswordReset = new RequestPasswordResetUseCase(authRepo);
  const resetPassword = new ResetPasswordUseCase(authRepo);
  const uploadAvatar = new UploadAvatarUseCase(authRepo);
  const updateProfile = new UpdateProfileUseCase(authRepo);
  const deleteAccount = new DeleteAccountUseCase(authRepo);
  const onSessionRestored = recordDeviceOnSessionRestore(
    new RecordDeviceUseCase(
      container.resolve<DeviceIdentityInterface>(TOKENS.DeviceIdentity),
      container.resolve<DeviceRepositoryInterface>(TOKENS.DeviceRepository),
    ),
  );
  const authStore = configureAuthStore({ signIn, requestRegistration, verifyRegistration, resendRegistrationCode, signOut, getSession, loadFavorites: loadFavoritesUseCase, savedRecipesStore, signInWithGoogle, signInWithApple, requestPasswordReset, resetPassword, uploadAvatar, updateProfile, deleteAccount, requestCreatorTag: new RequestCreatorTagUseCase(authRepo), removeCreatorTag: new RemoveCreatorTagUseCase(authRepo), refreshCreatorClaim: new RefreshCreatorClaimUseCase(authRepo), clearSessionCaches, onSessionRestored });
  return authStore;
};
