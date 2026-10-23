import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { AccountRepositoryInterface } from '@domain/auth/account-repository-interface';

/**
 * Uploads a new profile avatar for the signed-in user from a local file URI and
 * returns the updated, persisted `AuthSessionEntity` (with the new `photoUrl`).
 */
export class UploadAvatarUseCase {
  constructor(private readonly repo: AccountRepositoryInterface) {}

  execute(
    fileUri: string,
    fileName: string,
    mimeType: string,
  ): Promise<Result<AuthSessionEntity, Failure>> {
    return this.repo.uploadAvatar(fileUri, fileName, mimeType);
  }
}
