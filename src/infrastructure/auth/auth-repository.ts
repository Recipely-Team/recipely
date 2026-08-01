import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { AuthRepositoryInterface } from '@domain/auth/auth-repository-interface';
import type { RegistrationChallenge } from '@domain/auth/registration-challenge';
import { AVATAR_UPLOAD_URL } from '@infrastructure/constants/api/api-hosts';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import { appendFilePart } from '@infrastructure/network/upload/append-file-part';
import type { RecipelyAuthSessionDto } from '@infrastructure/auth/session/recipely-auth-session-dto';
import type { RecipelyUserDto } from '@infrastructure/auth/dtos/recipely-user-dto';
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
import type { UpdateProfileInput } from '@domain/auth/update-profile-input';
import type { UserResponseDto } from '@infrastructure/auth/dtos/user-response-dto';
import type { SignInRequestDto } from '@infrastructure/auth/dtos/sign-in-request-dto';
import type { RegisterRequestDto } from '@infrastructure/auth/dtos/register-request-dto';
import type { VerifyRegistrationRequestDto } from '@infrastructure/auth/dtos/verify-registration-request-dto';
import type { EmailOnlyRequestDto } from '@infrastructure/auth/dtos/email-only-request-dto';
import type { ResetPasswordRequestDto } from '@infrastructure/auth/dtos/reset-password-request-dto';
import type { SocialSignInRequestDto } from '@infrastructure/auth/dtos/social-sign-in-request-dto';
import type { UpdateProfileRequestDto } from '@infrastructure/auth/dtos/update-profile-request-dto';

/**
 * Implements `AuthRepositoryInterface` against the Recipely backend (email/password)
 * and Firebase Auth (Google / Apple social sign-in). Social sign-in flows
 * obtain a Firebase ID token then exchange it for a backend JWT via
 * `POST /auth/social`, keeping all user records on the backend.
 */
export class AuthRepository implements AuthRepositoryInterface {
  constructor(
    private readonly http: HttpClient,
    private readonly storage: SecureTokenStorage,
  ) {}

  async signIn(email: string, password: string): Promise<Result<AuthSessionEntity, Failure>> {
    const result = await this.http.post<RecipelyAuthSessionDto>(ApiRoutes.auth.login, { email: email.trim(), password } satisfies SignInRequestDto);
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
    const result = await this.http.post<RegistrationChallengeDto>(ApiRoutes.auth.register, { email: email.trim(), password, displayName } satisfies RegisterRequestDto);
    if (!result.ok) {
      return result;
    }
    return ok(toChallenge(email.trim(), result.value));
  }

  async verifyRegistration(
    email: string,
    code: string,
  ): Promise<Result<AuthSessionEntity, Failure>> {
    const result = await this.http.post<RecipelyAuthSessionDto>(ApiRoutes.auth.registerVerify, { email: email.trim(), code: code.trim() } satisfies VerifyRegistrationRequestDto);
    if (!result.ok) {
      return result;
    }
    return this.persistSession(result.value);
  }

  async resendRegistrationCode(
    email: string,
  ): Promise<Result<RegistrationChallenge, Failure>> {
    const result = await this.http.post<RegistrationChallengeDto>(ApiRoutes.auth.registerResend, { email: email.trim() } satisfies EmailOnlyRequestDto);
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
    const result = await this.http.post<void>(ApiRoutes.auth.forgotPassword, { email: email.trim() } satisfies EmailOnlyRequestDto);
    if (!result.ok) {
      return result;
    }
    return ok(undefined);
  }

  async resetPassword(token: string, newPassword: string): Promise<Result<void, Failure>> {
    const result = await this.http.post<void>(ApiRoutes.auth.resetPassword, { token, newPassword } satisfies ResetPasswordRequestDto);
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

  async updateProfile(input: UpdateProfileInput): Promise<Result<AuthSessionEntity, Failure>> {
    const result = await this.http.patch<UserResponseDto>(ApiRoutes.me.profile, input satisfies UpdateProfileRequestDto);
    if (!result.ok) {
      return result;
    }
    return rebuildSessionWithUser(this.storage, result.value.user);
  }

  async deleteAccount(): Promise<Result<void, Failure>> {
    const result = await this.http.delete<void>(ApiRoutes.me.root);
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
    const result = await this.http.post<RecipelyAuthSessionDto>(ApiRoutes.auth.social, { idToken } satisfies SocialSignInRequestDto);
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
