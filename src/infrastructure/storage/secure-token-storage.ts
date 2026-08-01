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
import {
  SESSION_STORAGE_KEY,
  LEGACY_SESSION_STORAGE_KEY,
} from '@infrastructure/constants/storage';

/**
 * Persists and restores the authenticated `AuthSessionEntity` using the platform
 * key-value store (Expo SecureStore on native, localStorage on web). The
 * session is serialised as JSON under a versioned key so stale formats can be
 * flushed by bumping the key suffix.
 *
 * @remarks
 * **Reads fall back to the legacy key once.** This class used to hold its own
 * `'layerly.session.v1'` while `SESSION_STORAGE_KEY` went unread, so a device
 * that last signed in on an older build still has its session under the old
 * name. `loadSession` moves it across on first read; writing straight to the
 * new key alone would have signed those users out.
 */
export class SecureTokenStorage {
  async saveSession(session: AuthSessionEntity): Promise<Result<void, Failure>> {
    try {
      const payload: SerializedSession = {
        id: session.id,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        expiresAt: session.expiresAt.toISOString(),
        user: {
          id: session.user.id,
          email: session.user.email.value,
          displayName: session.user.displayName,
          photoUrl: session.user.photoUrl,
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
    try {
      await kvStore.removeItem(SESSION_STORAGE_KEY);
      await kvStore.removeItem(LEGACY_SESSION_STORAGE_KEY);
      return ok(undefined);
    } catch (error: unknown) {
      return fail(new UnknownFailure(DiagnosticMessage.storage.clearFailed, error));
    }
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
