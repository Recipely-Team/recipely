import type { BoundStore } from '@application/store/bound-store';
import type { SignInUseCase } from '@application/auth/sign-in/sign-in-use-case';
import type { RequestRegistrationUseCase } from '@application/auth/registration/request-registration-use-case';
import type { VerifyRegistrationUseCase } from '@application/auth/registration/verify-registration-use-case';
import type { ResendRegistrationCodeUseCase } from '@application/auth/registration/resend-registration-code-use-case';
import type { SignOutUseCase } from '@application/auth/session/sign-out-use-case';
import type { GetSessionUseCase } from '@application/auth/session/get-session-use-case';
import type { SignInWithGoogleUseCase } from '@application/auth/sign-in/sign-in-with-google-use-case';
import type { SignInWithAppleUseCase } from '@application/auth/sign-in/sign-in-with-apple-use-case';
import type { RequestPasswordResetUseCase } from '@application/auth/password-reset/request-password-reset-use-case';
import type { ResetPasswordUseCase } from '@application/auth/password-reset/reset-password-use-case';
import type { UploadAvatarUseCase } from '@application/auth/profile/upload-avatar-use-case';
import type { UpdateProfileUseCase } from '@application/auth/profile/update-profile-use-case';
import type { DeleteAccountUseCase } from '@application/auth/session/delete-account-use-case';
import type { LoadFavoritesUseCase } from '@application/favorites/load-favorites-use-case';
import type { SavedRecipesStoreState } from '@application/recipes/saved/saved-recipes-store-state';

export interface AuthStoreDeps {
  signIn: SignInUseCase;
  requestRegistration: RequestRegistrationUseCase;
  verifyRegistration: VerifyRegistrationUseCase;
  resendRegistrationCode: ResendRegistrationCodeUseCase;
  signOut: SignOutUseCase;
  getSession: GetSessionUseCase;
  loadFavorites: LoadFavoritesUseCase;
  savedRecipesStore: BoundStore<SavedRecipesStoreState>;
  signInWithGoogle: SignInWithGoogleUseCase;
  signInWithApple: SignInWithAppleUseCase;
  requestPasswordReset: RequestPasswordResetUseCase;
  resetPassword: ResetPasswordUseCase;
  uploadAvatar: UploadAvatarUseCase;
  updateProfile: UpdateProfileUseCase;
  deleteAccount: DeleteAccountUseCase;
  /**
   * Clears every session-scoped cache (comments, likes, recipe details,
   * notifications, saved/created recipes, viewed profile) so nothing from the
   * previous account survives into the next session. Invoked on sign-out,
   * account deletion, and session expiry.
   */
  clearSessionCaches: () => void;
}
