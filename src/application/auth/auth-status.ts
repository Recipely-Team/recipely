import type { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { StoreStatus } from '@application/store/store-status';

/**
 * Session lifecycle — the only auth state that is genuinely global (the auth
 * guard and redirect effects watch it). Transient operation failures (a wrong
 * password, a taken email, a bad code) are NOT modelled here: each screen owns
 * its own error via local state / the `Failure` returned by the store action,
 * so an error on one auth screen never bleeds into the next (page-scoped, like
 * a per-page Cubit). See `configure-auth-store.ts`.
 */
export type AuthStatus =
  | { status: typeof StoreStatus.Idle }
  | { status: typeof StoreStatus.Loading }
  | { status: typeof StoreStatus.Authenticated; session: AuthSessionEntity }
  | { status: typeof StoreStatus.Unauthenticated };
