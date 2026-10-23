import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { AccountRepositoryInterface } from '@domain/auth/account-repository-interface';
import type { UpdateProfileInput } from '@domain/auth/update-profile-input';
import { AVATAR_UPLOAD_URL } from '@infrastructure/constants/api/api-hosts';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import type { AxiosHttpClient } from '@infrastructure/network/http/axios-http-client';
import { appendFilePart } from '@infrastructure/network/upload/append-file-part';
import type { RecipelyUserDto } from '@infrastructure/auth/dtos/recipely-user-dto';
import type { UserResponseDto } from '@infrastructure/auth/dtos/user-response-dto';
import type { UpdateProfileRequestDto } from '@infrastructure/auth/dtos/update-profile-request-dto';
import { rebuildSessionWithUser } from '@infrastructure/auth/session/rebuild-session-with-user';
import type { SecureTokenStorage } from '@infrastructure/storage/secure-token-storage';

/**
 * Implements `AccountRepositoryInterface` against the Recipely backend.
 *
 * @remarks
 * - **The stored session follows the server.** A changed avatar or profile
 *   comes back as the user; the session is rebuilt around it and saved, so the
 *   next cold start shows what the server holds.
 * - **Deletion clears only once confirmed.** A failed delete keeps the session,
 *   so the user stays signed in and can retry.
 */
export class AccountRepository implements AccountRepositoryInterface {
  constructor(
    private readonly http: AxiosHttpClient,
    private readonly storage: SecureTokenStorage,
  ) {}

  async uploadAvatar(
    fileUri: string,
    fileName: string,
    mimeType: string,
  ): Promise<Result<AuthSessionEntity, Failure>> {
    const formData = new FormData();
    await appendFilePart(formData, 'avatar', { uri: fileUri, fileName, mimeType });

    const result = await this.http.uploadMultipart<{ user: RecipelyUserDto }>(
      AVATAR_UPLOAD_URL,
      formData,
    );
    if (!result.ok) {
      return result;
    }
    return rebuildSessionWithUser(this.storage, result.value.user);
  }

  async updateProfile(input: UpdateProfileInput): Promise<Result<AuthSessionEntity, Failure>> {
    const result = await this.http.patch<UserResponseDto>(ApiRoutes.me.profile, input satisfies UpdateProfileRequestDto);
    if (!result.ok) {
      return result;
    }
    return rebuildSessionWithUser(this.storage, result.value.user);
  }

  async deleteAccount(): Promise<Result<void, Failure>> {
    const result = await this.http.delete<void>(ApiRoutes.me.root);
    // Keep the session on failure; clear only once the server confirms.
    if (!result.ok) {
      return result;
    }
    const clearResult = await this.storage.clear();
    if (!clearResult.ok) {
      return fail(clearResult.failure);
    }
    return ok(undefined);
  }
}
