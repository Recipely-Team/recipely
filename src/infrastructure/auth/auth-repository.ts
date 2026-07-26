import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { IAuthRepository } from '@domain/auth/i-auth-repository';
import type { RegistrationChallenge } from '@domain/auth/registration-challenge';
import { AVATAR_UPLOAD_URL } from '@infrastructure/constants/api';
import { ApiRoutes } from '@infrastructure/constants/api-routes';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import { appendFilePart } from '@infrastructure/network/upload/append-file-part';
import type { RecipelyAuthSessionDto } from '@infrastructure/auth/session/recipely-auth-session-dto';
import type { RecipelyUserDto } from '@infrastructure/auth/recipely-user-dto';
import type { RegistrationChallengeDto } from '@infrastructure/auth/registration/registration-challenge-dto';
import { toUser } from '@infrastructure/auth/user-info-mapper';
import type { SecureTokenStorage } from '@infrastructure/storage/secure-token-storage';
import {
  acquireAppleFirebaseToken,
  acquireGoogleFirebaseToken,
} from '@infrastructure/auth/social/social-auth-provider';
import { toChallenge } from '@infrastructure/auth/registration/to-challenge';
import { expiresAtFromToken } from '@infrastructure/auth/session/expires-at-from-token';
import { rebuildSessionWithUser } from '@infrastructure/auth/session/rebuild-session-with-user';

/**
 * Implements `IAuthRepository` against the Recipely backend (email/password)
 * and Firebase Auth (Google / Apple social sign-in). Social sign-in flows
 * obtain a Firebase ID token then exchange it for a backend JWT via
 * `POST /auth/social`, keeping all user records on the backend.
 */
export class AuthRepository implements IAuthRepository {
  constructor(
    private readonly http: HttpClient,
    private readonly storage: SecureTokenStorage,
  ) {}

  async signIn(email: string, password: string): Promise<Result<AuthSessionEntity, Failure>> {
    const result = await this.http.request<RecipelyAuthSessionDto>({
      method: 'POST',
      url: ApiRoutes.auth.login,
      data: { email: email.trim(), password },
    });
    if (!result.ok) {
      return result;
    }
    return this.persistSession(result.value);
  }

  async requestRegistration(
    email: string,
    password: string,
    displayName: string,
  ): Promise<Result<RegistrationChallenge, Failure>> {
    const result = await this.http.request<RegistrationChallengeDto>({
      method: 'POST',
      url: ApiRoutes.auth.register,
      data: { email: email.trim(), password, displayName },
    });
    if (!result.ok) {
      return result;
    }
    return ok(toChallenge(email.trim(), result.value));
  }

  async verifyRegistration(
    email: string,
    code: string,
  ): Promise<Result<AuthSessionEntity, Failure>> {
    const result = await this.http.request<RecipelyAuthSessionDto>({
      method: 'POST',
      url: ApiRoutes.auth.registerVerify,
      data: { email: email.trim(), code: code.trim() },
    });
    if (!result.ok) {
      return result;
    }
    return this.persistSession(result.value);
  }

  async resendRegistrationCode(
    email: string,
  ): Promise<Result<RegistrationChallenge, Failure>> {
    const result = await this.http.request<RegistrationChallengeDto>({
      method: 'POST',
      url: ApiRoutes.auth.registerResend,
      data: { email: email.trim() },
    });
    if (!result.ok) {
      return result;
    }
    return ok(toChallenge(email.trim(), result.value));
  }

  async signInWithGoogle(): Promise<Result<AuthSessionEntity, Failure>> {
    const tokenResult = await acquireGoogleFirebaseToken();
    if (!tokenResult.ok) return tokenResult;
    return this.exchangeFirebaseToken(tokenResult.value);
  }

  async signInWithApple(): Promise<Result<AuthSessionEntity, Failure>> {
    const tokenResult = await acquireAppleFirebaseToken();
    if (!tokenResult.ok) return tokenResult;
    return this.exchangeFirebaseToken(tokenResult.value);
  }

  async signOut(): Promise<Result<void, Failure>> {
    const clearResult = await this.storage.clear();
    if (!clearResult.ok) {
      return fail(clearResult.failure);
    }
    return ok(undefined);
  }

  async getCurrentSession(): Promise<Result<AuthSessionEntity | null, Failure>> {
    return this.storage.loadSession();
  }

  async requestPasswordReset(email: string): Promise<Result<void, Failure>> {
    const result = await this.http.request<void>({
      method: 'POST',
      url: ApiRoutes.auth.forgotPassword,
      data: { email: email.trim() },
    });
    if (!result.ok) {
      return result;
    }
    return ok(undefined);
  }

  async resetPassword(token: string, newPassword: string): Promise<Result<void, Failure>> {
    const result = await this.http.request<void>({
      method: 'POST',
      url: ApiRoutes.auth.resetPassword,
      data: { token, newPassword },
    });
    if (!result.ok) {
      return result;
    }
    return ok(undefined);
  }

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

  async updateProfile(input: {
    displayName?: string;
    bio?: string;
  }): Promise<Result<AuthSessionEntity, Failure>> {
    const result = await this.http.request<{ user: RecipelyUserDto }>({
      method: 'PATCH',
      url: ApiRoutes.me.profile,
      data: input,
    });
    if (!result.ok) {
      return result;
    }
    return rebuildSessionWithUser(this.storage, result.value.user);
  }

  async deleteAccount(): Promise<Result<void, Failure>> {
    const result = await this.http.request<void>({
      method: 'DELETE',
      url: ApiRoutes.me.root,
    });
    // Keep the session on any HTTP/network failure so the user stays signed in
    // and can retry — only clear local credentials once the server confirms.
    if (!result.ok) {
      return result;
    }
    const clearResult = await this.storage.clear();
    if (!clearResult.ok) {
      return fail(clearResult.failure);
    }
    return ok(undefined);
  }

  /** Sends a Firebase ID token to the backend and persists the returned backend JWT. */
  private async exchangeFirebaseToken(idToken: string): Promise<Result<AuthSessionEntity, Failure>> {
    const result = await this.http.request<RecipelyAuthSessionDto>({
      method: 'POST',
      url: ApiRoutes.auth.social,
      data: { idToken },
    });
    if (!result.ok) return result;
    return this.persistSession(result.value);
  }

  /** Maps a backend session DTO to an `AuthSessionEntity` and persists it to storage. */
  private async persistSession(
    dto: RecipelyAuthSessionDto,
  ): Promise<Result<AuthSessionEntity, Failure>> {
    const userResult = toUser(dto.user);
    if (!userResult.ok) return userResult;

    const sessionResult = AuthSessionEntity.create({
      id: dto.user.id,
      accessToken: dto.token,
      expiresAt: expiresAtFromToken(dto.token),
      user: userResult.value,
    });
    if (!sessionResult.ok) return sessionResult;

    const saveResult = await this.storage.saveSession(sessionResult.value);
    if (!saveResult.ok) return fail(saveResult.failure);
    return ok(sessionResult.value);
  }
}
