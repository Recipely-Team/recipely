import { create } from 'zustand';
import type { BoundStore } from '@application/store/bound-store';
import type { AuthStoreState } from '@application/auth/auth-store-state';
import { StoreStatus } from '@application/store/store-status';
import { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import type { UserEntity } from '@domain/auth/user-entity';

/** An hour ahead: a session that is valid for the whole test. */
const SESSION_TTL_MS = 3_600_000;

/**
 * An auth store for a component test: signed in as `user`, or a guest for
 * `null`. Every action is a `jest.fn` answering "no failure" unless the test
 * overrides it.
 */
export const authStoreOf = (user: UserEntity | null, overrides: Partial<AuthStoreState> = {}): BoundStore<AuthStoreState> => {
  const session =
    user === null
      ? null
      : AuthSessionEntity.create({ id: 'session-1', accessToken: 'token', expiresAt: new Date(Date.now() + SESSION_TTL_MS), user });
  if (session !== null && !session.ok) throw new Error('fixture session invalid');
  const noFailure = jest.fn(async () => null);
  return create<AuthStoreState>(() => ({
    state: session === null ? { status: StoreStatus.Unauthenticated } : { status: StoreStatus.Authenticated, session: session.value },
    signIn: noFailure,
    register: jest.fn(),
    verifyRegistration: noFailure,
    resendRegistrationCode: jest.fn(),
    signOut: noFailure,
    expireSession: jest.fn(async () => undefined),
    hydrate: jest.fn(async () => undefined),
    signInWithGoogle: noFailure,
    signInWithApple: noFailure,
    requestPasswordReset: noFailure,
    resetPassword: noFailure,
    uploadAvatar: noFailure,
    updateProfile: noFailure,
    deleteAccount: noFailure,
    requestCreatorTag: jest.fn(async () => null),
    removeCreatorTag: jest.fn(async () => null),
    refreshCreatorClaim: jest.fn(async () => null),
    ...overrides,
  }));
};
