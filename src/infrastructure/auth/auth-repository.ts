import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { type Failure, UnauthorizedFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { optional } from '@core/guards/type-guards';
import type { RefreshSessionRequestDto } from '@infrastructure/auth/dtos/refresh-session-request-dto';
import { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { AuthRepositoryInterface } from '@domain/auth/auth-repository-interface';
import type { RegistrationChallenge } from '@domain/auth/registration-challenge';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import { REFRESH_RACE_RETRY_MS } from '@infrastructure/constants/api/api-timeouts';
import type { AxiosHttpClient } from '@infrastructure/network/http/axios-http-client';
import type { RecipelyAuthSessionDto } from '@infrastructure/auth/session/recipely-auth-session-dto';
import type { RegistrationChallengeDto } from '@infrastructure/auth/registration/registration-challenge-dto';
import { toUser } from '@infrastructure/auth/user-info-mapper';
import type { SecureTokenStorage } from '@infrastructure/storage/secure-token-storage';
import {
  acquireAppleFirebaseToken,
  acquireGoogleFirebaseToken,
} from '@infrastructure/auth/social/social-auth-provider';
import { toChallenge } from '@infrastructure/auth/registration/to-challenge';
import { expiresAtFromToken } from '@infrastructure/auth/session/expires-at-from-token';
import type { SignInRequestDto } from '@infrastructure/auth/dtos/sign-in-request-dto';
import type { RegisterRequestDto } from '@infrastructure/auth/dtos/register-request-dto';
import type { VerifyRegistrationRequestDto } from '@infrastructure/auth/dtos/verify-registration-request-dto';
import type { VerifyRegistrationLinkRequestDto } from '@infrastructure/auth/dtos/verify-registration-link-request-dto';
import type { EmailOnlyRequestDto } from '@infrastructure/auth/dtos/email-only-request-dto';
import type { ResetPasswordRequestDto } from '@infrastructure/auth/dtos/reset-password-request-dto';
import type { SocialSignInRequestDto } from '@infrastructure/auth/dtos/social-sign-in-request-dto';
import type { DeviceIdentityInterface } from '@domain/device/device-identity-interface';
import type { DeviceContextDto } from '@infrastructure/device/device-context-dto';
import { toDeviceContextDto } from '@infrastructure/device/to-device-context-dto';

/**
 * Implements `AuthRepositoryInterface` against the Recipely backend (email/password)
 * and Firebase Auth (Google / Apple social sign-in). Social sign-in flows
 * obtain a Firebase ID token then exchange it for a backend JWT via
 * `POST /auth/social`, keeping all user records on the backend.
 *
 * @remarks
 * - **Every session-opening request names the device.** Login, registration
 *   verify and social auth carry `device`, so the backend records the install
 *   in the same round-trip. An unreadable identity sends none rather than
 *   failing the sign-in over bookkeeping.
 * - **Sessions renew instead of ending.** An expired access token is traded
 *   for a new one with the refresh token (`refreshSession`); the HTTP client
 *   does the same on a 401. `refreshByCookie` (web) sends no token: the API
 *   reads its HttpOnly cookie.
 */
export class AuthRepository implements AuthRepositoryInterface {
  private renewal: Promise<Result<AuthSessionEntity, Failure>> | null = null;

  constructor(
    private readonly http: AxiosHttpClient,
    private readonly storage: SecureTokenStorage,
    private readonly deviceIdentity: DeviceIdentityInterface,
    private readonly refreshByCookie: boolean = false,
  ) {}

  async signIn(email: string, password: string): Promise<Result<AuthSessionEntity, Failure>> {
    const result = await this.http.post<RecipelyAuthSessionDto>(ApiRoutes.auth.login, { email, password, ...(await this.deviceField()) } satisfies SignInRequestDto);
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
    const result = await this.http.post<RegistrationChallengeDto>(ApiRoutes.auth.register, { email, password, displayName } satisfies RegisterRequestDto);
    if (!result.ok) {
      return result;
    }
    return ok(toChallenge(email, result.value));
  }

  async verifyRegistration(
    email: string,
    code: string,
  ): Promise<Result<AuthSessionEntity, Failure>> {
    const result = await this.http.post<RecipelyAuthSessionDto>(ApiRoutes.auth.registerVerify, { email, code: code.trim(), ...(await this.deviceField()) } satisfies VerifyRegistrationRequestDto);
    if (!result.ok) {
      return result;
    }
    return this.persistSession(result.value);
  }

  async verifyRegistrationLink(token: string): Promise<Result<AuthSessionEntity, Failure>> {
    const result = await this.http.post<RecipelyAuthSessionDto>(ApiRoutes.auth.registerVerifyLink, { token, ...(await this.deviceField()) } satisfies VerifyRegistrationLinkRequestDto);
    if (!result.ok) {
      return result;
    }
    return this.persistSession(result.value);
  }

  async resendRegistrationCode(
    email: string,
  ): Promise<Result<RegistrationChallenge, Failure>> {
    const result = await this.http.post<RegistrationChallengeDto>(ApiRoutes.auth.registerResend, { email } satisfies EmailOnlyRequestDto);
    if (!result.ok) {
      return result;
    }
    return ok(toChallenge(email, result.value));
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

  /** Revokes this sign-in on the server (best effort: signing out never waits on the network to succeed), then forgets it. */
  async signOut(): Promise<Result<void, Failure>> {
    const body = await this.refreshBody();
    if (body !== null) await this.http.post<void>(ApiRoutes.auth.logout, body);
    const clearResult = await this.storage.clear();
    if (!clearResult.ok) {
      return fail(clearResult.failure);
    }
    return ok(undefined);
  }

  /**
   * The stored session, renewed first when its access token has expired, or
   * restored from the refresh cookie on a web reload. A refresh the server
   * refuses means signed out; one that cannot reach it keeps the stored
   * session, so a cold start offline does not sign anyone out.
   */
  async getCurrentSession(): Promise<Result<AuthSessionEntity | null, Failure>> {
    const stored = await this.storage.loadSession();
    if (!stored.ok) return stored;
    const session = stored.value;
    if (session !== null && !session.isExpired()) return stored;
    if (session === null && !(this.refreshByCookie && (await this.storage.hasSignedInMarker()))) return stored;
    const refreshed = await this.refreshSession();
    if (refreshed.ok) return refreshed;
    if (refreshed.failure instanceof UnauthorizedFailure) {
      await this.storage.clear();
      return ok(null);
    }
    return stored;
  }

  /**
   * Trades the refresh token for a new session and stores it, one renewal at a time.
   *
   * @remarks
   * - **Single-flight.** Refresh tokens work once, so a start-up restore and a
   *   401 renewing at the same moment must share one request: the second would
   *   present a spent token, be refused, and `getCurrentSession` would then
   *   clear the session the first had just saved.
   */
  refreshSession(): Promise<Result<AuthSessionEntity, Failure>> {
    this.renewal ??= this.renewSession().finally(() => {
      this.renewal = null;
    });
    return this.renewal;
  }

  private async renewSession(): Promise<Result<AuthSessionEntity, Failure>> {
    const body = await this.refreshBody();
    if (body === null) return fail(new UnauthorizedFailure(DiagnosticMessage.auth.noRefreshToken));
    let result = await this.http.post<RecipelyAuthSessionDto>(ApiRoutes.auth.refresh, body);
    if (!result.ok && this.refreshByCookie && result.failure instanceof UnauthorizedFailure) {
      await new Promise((resolve) => setTimeout(resolve, REFRESH_RACE_RETRY_MS));
      result = await this.http.post<RecipelyAuthSessionDto>(ApiRoutes.auth.refresh, body);
    }
    if (!result.ok) return result;
    return this.persistSession(result.value);
  }

  async requestPasswordReset(email: string): Promise<Result<void, Failure>> {
    const result = await this.http.post<void>(ApiRoutes.auth.forgotPassword, { email } satisfies EmailOnlyRequestDto);
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

  /** Sends a Firebase ID token to the backend and persists the returned backend JWT. */
  private async exchangeFirebaseToken(idToken: string): Promise<Result<AuthSessionEntity, Failure>> {
    const result = await this.http.post<RecipelyAuthSessionDto>(ApiRoutes.auth.social, { idToken, ...(await this.deviceField()) } satisfies SocialSignInRequestDto);
    if (!result.ok) return result;
    return this.persistSession(result.value);
  }

  /** The `device` field for a session-opening body, or nothing when the identity is unreadable. */
  private async deviceField(): Promise<{ device?: DeviceContextDto }> {
    const identity = await this.deviceIdentity.current();
    return identity.ok ? { device: toDeviceContextDto(identity.value) } : {};
  }

  /** What `/auth/refresh` and `/auth/logout` need, or `null` when there is no refresh token to send. */
  private async refreshBody(): Promise<RefreshSessionRequestDto | null> {
    if (this.refreshByCookie) return {};
    const current = await this.storage.loadSession();
    const refreshToken = current.ok ? current.value?.refreshToken : undefined;
    return refreshToken === undefined ? null : { refreshToken };
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
      ...optional('refreshToken', dto.refreshToken),
      expiresAt: expiresAtFromToken(dto.token),
      user: userResult.value,
    });
    if (!sessionResult.ok) return sessionResult;

    const saveResult = await this.storage.saveSession(sessionResult.value);
    if (!saveResult.ok) return fail(saveResult.failure);
    return ok(sessionResult.value);
  }
}
