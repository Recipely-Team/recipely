import type { AuthIdle } from '@application/auth/states/auth-idle';
import type { AuthLoading } from '@application/auth/states/auth-loading';
import type { Authenticated } from '@application/auth/states/authenticated';
import type { Unauthenticated } from '@application/auth/states/unauthenticated';

/**
 * Session lifecycle — the only auth state that is genuinely global (the auth
 * guard and redirect effects watch it). Transient operation failures (a wrong
 * password, a taken email, a bad code) are NOT modelled here: each screen owns
 * its own error via local state / the `Failure` returned by the store action,
 * so an error on one auth screen never bleeds into the next (page-scoped, like
 * a per-page Cubit). See `configure-auth-store.ts`.
 */
export type AuthStatusType =
  | AuthIdle
  | AuthLoading
  | Authenticated
  | Unauthenticated;
