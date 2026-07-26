import type { AuthSessionEntity } from '@domain/auth/auth-session-entity';

/**
 * Session lifecycle — the only auth state that is genuinely global (the auth
 * guard and redirect effects watch it). Transient operation failures (a wrong
 * password, a taken email, a bad code) are NOT modelled here: each screen owns
 * its own error via local state / the `Failure` returned by the store action,
 * so an error on one auth screen never bleeds into the next (page-scoped, like
 * a per-page Cubit). See `configure-auth-store.ts`.
 */
export type AuthStatus =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'authenticated'; session: AuthSessionEntity }
  | { status: 'unauthenticated' };
