import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { UpdateProfileInput } from '@domain/auth/update-profile-input';

/** What the signed-in user changes about their own account: avatar, profile fields, the account's existence. */
export interface AccountRepositoryInterface {
  /**
   * Uploads a new avatar image for the signed-in user and returns the updated,
   * persisted session (its `user.photoUrl` reflects the new image). The image is
   * a local file URI from the device gallery/camera.
   */
  uploadAvatar(
    fileUri: string,
    fileName: string,
    mimeType: string,
  ): Promise<Result<AuthSessionEntity, Failure>>;
  /**
   * Updates the signed-in user's editable profile fields (display name, bio)
   * and returns the refreshed, persisted session.
   */
  updateProfile(input: UpdateProfileInput): Promise<Result<AuthSessionEntity, Failure>>;
  /**
   * Permanently deletes the signed-in user's account and all of its data on the
   * server, then clears the local session on success. On failure the local
   * session is left intact so the user stays signed in and can retry.
   */
  deleteAccount(): Promise<Result<void, Failure>>;
}
