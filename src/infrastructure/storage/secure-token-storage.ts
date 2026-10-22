import { fail, ok } from '@core/result/result-helpers';
import { LogTag } from '@infrastructure/constants/log-tag';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { Result } from '@core/result/result';
import { type Failure, UnknownFailure, ValidationFailure } from '@core/failure';
import { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import { UserEntity } from '@domain/auth/user-entity';
import { Email } from '@domain/common/email';
import type { SerializedSession } from '@infrastructure/storage/serialized-session';
import { kvStore } from '@infrastructure/storage/kv-store';
import { optional } from '@core/guards/type-guards';
import type { CreatorClaims } from '@domain/creators/creator-claims';
import type { CreatorClaimDto } from '@infrastructure/creators/dtos/creator-claim-dto';
import { readCreatorClaims } from '@infrastructure/creators/read-creator-claims';
import {
  SESSION_STORAGE_KEY,
  LEGACY_SESSION_STORAGE_KEY,
  SIGNED_IN_MARKER_STORAGE_KEY,
  USER_SCOPED_STORAGE_KEYS,
} from '@infrastructure/constants/storage';

const SIGNED_IN_MARKER = '1';

/** The stored form of the claims — the wire shape, so one reader serves both; absent when there are none. */
const toStoredClaims = (claims: CreatorClaims): CreatorClaimDto[] | undefined =>
  claims.isEmpty
    ? undefined
    : claims.all.map((claim) => ({ platform: claim.tag.platform, handle: claim.tag.handle, status: claim.status }));

/**
 * Persists and restores the authenticated `AuthSessionEntity` using the platform
 * key-value store (Expo SecureStore on native, localStorage on web). The
 * session is serialised as JSON under a versioned key so stale formats can be
 * flushed by bumping the key suffix.
 *
 * @remarks
 * - **Read once, then from memory.** Every request asks for the access token;
 *   the session is kept in memory after the first read or write, so a request
 *   no longer costs a Keychain / Keystore read, a JSON parse and three entity
 *   builds.
 * - **`persistTokens: false` (web) writes no token to disk.** `localStorage` is
 *   readable by any script on the page; the session stays in memory and comes
 *   back on reload from the API's HttpOnly refresh cookie. Only a non-secret
 *   signed-in marker is stored. A session an older build left in
 *   `localStorage` is moved into memory and deleted on first read.
 * **Reads fall back to the legacy key once.** This class used to hold its own
 * `'layerly.session.v1'` while `SESSION_STORAGE_KEY` went unread, so a device
 * that last signed in on an older build still has its session under the old
 * name. `loadSession` moves it across on first read; writing straight to the
 * new key alone would have signed those users out.
 */
export class SecureTokenStorage {
  /** `undefined` until the first read or write; `null` once known to be signed out. */
  private cached: AuthSessionEntity | null | undefined = undefined;

  constructor(private readonly persistTokens: boolean = true) {}

  async saveSession(session: AuthSessionEntity): Promise<Result<void, Failure>> {
    this.cached = session;
    if (!this.persistTokens) return this.markSignedIn();
    try {
      const payload: SerializedSession = {
        id: session.id,
        accessToken: session.accessToken,
        ...optional('refreshToken', session.refreshToken),
        expiresAt: session.expiresAt.toISOString(),
        user: {
          id: session.user.id,
          email: session.user.email.value,
          displayName: session.user.displayName,
          photoUrl: session.user.photoUrl,
          ...optional('creatorTags', toStoredClaims(session.user.creatorClaims)),
        },
      };
      await kvStore.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
      return ok(undefined);
    } catch (error: unknown) {
      if (__DEV__) {
        console.error(`${LogTag.secureTokenStorage} saveSession failed:`, error);
      }
      return fail(new UnknownFailure(DiagnosticMessage.storage.persistFailed, error));
    }
  }

  async loadSession(): Promise<Result<AuthSessionEntity | null, Failure>> {
    if (this.cached !== undefined) return ok(this.cached);
    const loaded = await this.readStoredSession();
    if (!loaded.ok) return loaded;
    this.cached = loaded.value;
    if (!this.persistTokens && loaded.value !== null) {
      // An older web build left tokens in localStorage: keep them in memory only.
      await kvStore.removeItem(SESSION_STORAGE_KEY);
      await kvStore.removeItem(LEGACY_SESSION_STORAGE_KEY);
      await this.markSignedIn();
    }
    return ok(loaded.value);
  }

  /** Web: whether this browser has a sign-in the refresh cookie may restore. */
  async hasSignedInMarker(): Promise<boolean> {
    const read = await kvStore.getItem(SIGNED_IN_MARKER_STORAGE_KEY);
    return read.ok && read.value === SIGNED_IN_MARKER;
  }

  private async readStoredSession(): Promise<Result<AuthSessionEntity | null, Failure>> {
    let raw: string | null;
    try {
      const read = await kvStore.getItem(SESSION_STORAGE_KEY);
      raw = read.ok ? read.value : null;
      if (raw === null) {
        raw = await this.migrateLegacySession();
      }
    } catch (error: unknown) {
      if (__DEV__) {
        console.error(`${LogTag.secureTokenStorage} loadSession failed:`, error);
      }
      return fail(new UnknownFailure(DiagnosticMessage.storage.readFailed, error));
    }
    if (raw === null) {
      return ok(null);
    }
    let parsed: SerializedSession;
    try {
      parsed = JSON.parse(raw) as SerializedSession;
    } catch {
      return fail(new ValidationFailure(DiagnosticMessage.storage.malformedJson));
    }
    const emailResult = Email.create(parsed.user.email);
    if (!emailResult.ok) {
      return fail(emailResult.failure);
    }
    const userResult = UserEntity.create({
      id: parsed.user.id,
      email: emailResult.value,
      displayName: parsed.user.displayName,
      photoUrl: parsed.user.photoUrl,
      // A session stored before per-platform tags held one claim under `creator`.
      creatorClaims: readCreatorClaims(parsed.user.creatorTags ?? (parsed.user.creator === undefined ? undefined : [parsed.user.creator])),
    });
    if (!userResult.ok) {
      return fail(userResult.failure);
    }
    const expiresAt = new Date(parsed.expiresAt);
    const sessionResult = AuthSessionEntity.create({
      id: parsed.id,
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      expiresAt,
      user: userResult.value,
    });
    if (!sessionResult.ok) {
      return fail(sessionResult.failure);
    }
    return ok(sessionResult.value);
  }

  async clear(): Promise<Result<void, Failure>> {
    this.cached = null;
    try {
      await kvStore.removeItem(SESSION_STORAGE_KEY);
      await kvStore.removeItem(LEGACY_SESSION_STORAGE_KEY);
      await kvStore.removeItem(SIGNED_IN_MARKER_STORAGE_KEY);
      for (const key of USER_SCOPED_STORAGE_KEYS) await kvStore.removeItem(key);
      return ok(undefined);
    } catch (error: unknown) {
      return fail(new UnknownFailure(DiagnosticMessage.storage.clearFailed, error));
    }
  }

  private async markSignedIn(): Promise<Result<void, Failure>> {
    const written = await kvStore.setItem(SIGNED_IN_MARKER_STORAGE_KEY, SIGNED_IN_MARKER);
    return written.ok ? ok(undefined) : fail(new UnknownFailure(DiagnosticMessage.storage.persistFailed, written.failure));
  }

  /**
   * Moves a session written by an older build to the current key and returns
   * it, or `null` when there is nothing to move.
   */
  private async migrateLegacySession(): Promise<string | null> {
    const legacy = await kvStore.getItem(LEGACY_SESSION_STORAGE_KEY);
    if (!legacy.ok || legacy.value === null) {
      return null;
    }
    await kvStore.setItem(SESSION_STORAGE_KEY, legacy.value);
    await kvStore.removeItem(LEGACY_SESSION_STORAGE_KEY);
    return legacy.value;
  }
}
