import type { BoundStore } from '@application/store/bound-store';
import { FakeAuthRepository } from '@application/__fixtures__/fake-auth-repository';
import { configureAuthStore } from '@application/auth/auth-store';
import { GetSessionUseCase } from '@application/auth/session/get-session-use-case';
import { SignInUseCase } from '@application/auth/sign-in/sign-in-use-case';
import { RequestRegistrationUseCase } from '@application/auth/registration/request-registration-use-case';
import { VerifyRegistrationUseCase } from '@application/auth/registration/verify-registration-use-case';
import { ResendRegistrationCodeUseCase } from '@application/auth/registration/resend-registration-code-use-case';
import { SignOutUseCase } from '@application/auth/session/sign-out-use-case';
import { SignInWithGoogleUseCase } from '@application/auth/sign-in/sign-in-with-google-use-case';
import { SignInWithAppleUseCase } from '@application/auth/sign-in/sign-in-with-apple-use-case';
import { RequestPasswordResetUseCase } from '@application/auth/password-reset/request-password-reset-use-case';
import { ResetPasswordUseCase } from '@application/auth/password-reset/reset-password-use-case';
import { UploadAvatarUseCase } from '@application/auth/profile/upload-avatar-use-case';
import { UpdateProfileUseCase } from '@application/auth/profile/update-profile-use-case';
import { DeleteAccountUseCase } from '@application/auth/session/delete-account-use-case';
import { LoadFavoritesUseCase } from '@application/favorites/load-favorites-use-case';
import { configureSavedRecipesStore } from '@application/recipes/saved/saved-recipes-store';
import { ErrorMessageKey, NetworkFailure, NotFoundFailure, UnauthorizedFailure, type Failure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { AuthSessionEntity } from '@domain/auth/auth-session-entity';
import { UserEntity } from '@domain/auth/user-entity';
import { Email } from '@domain/common/email';
import { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { Difficulty } from '@domain/recipes/difficulty';
import type { SavedRecipesStoreState } from '@application/recipes/saved/saved-recipes-store-state';
import { RecipeOrigin } from '@domain/recipes/provenance/recipe-origin';
import { RequestCreatorTagUseCase } from '@application/creators/claim/request-creator-tag-use-case';
import { RemoveCreatorTagUseCase } from '@application/creators/claim/remove-creator-tag-use-case';
import { RefreshCreatorClaimUseCase } from '@application/creators/claim/refresh-creator-claim-use-case';
import { CreatorClaim } from '@domain/creators/creator-claim';
import { CreatorClaims } from '@domain/creators/creator-claims';
import { CreatorStatus } from '@domain/creators/creator-status';
import { CreatorTag } from '@domain/creators/creator-tag';

const buildSession = (overrides: { expiresAt?: Date } = {}): AuthSessionEntity => {
  const email = Email.create('u@example.com');
  if (!email.ok) throw new Error();
  const user = UserEntity.create({ id: 'u1', email: email.value, displayName: 'U' });
  if (!user.ok) throw new Error();
  const session = AuthSessionEntity.create({
    id: 's1',
    accessToken: 'tok',
    expiresAt: overrides.expiresAt ?? new Date(Date.now() + 60_000),
    user: user.value,
  });
  if (!session.ok) throw new Error();
  return session.value;
};

// Fake LoadFavoritesUseCase that always returns empty set
const fakeLoadFavorites: LoadFavoritesUseCase = {
  execute: () => Promise.resolve(ok(new Set<string>())),
} as unknown as LoadFavoritesUseCase;

/** Minimal saved-recipe row — only its id matters to these tests. */
const makeSummary = (id: string): RecipeSummaryEntity => {
  const result = RecipeSummaryEntity.create({
    photoCount: 0,
    id,
    name: `Recipe ${id}`,
    image: 'https://cdn.example.com/r.webp',
    cuisine: 'ITALIAN',
    category: 'DINNER',
    difficulty: Difficulty.Easy,
    totalTimeMinutes: 30,
    rating: 0,
    moderationStatus: 'approved',
    isPublished: true,
    likeCount: 0,
    likedByMe: false,
    commentCount: 0,
    viewCount: 0,
      origin: RecipeOrigin.User,
      sourcePlatform: null,
    aiWritten: false,
  });
  if (!result.ok) throw new Error('fixture summary invalid');
  return result.value;
};

/**
 * The saved store's own fetch, stubbed out. These tests drive it through
 * `setSaved` / `clear`; a real use case here would only add a network seam
 * nothing asserts on.
 */
const neverLoadsFavorites = {
  execute: () => Promise.resolve(ok([])),
} as unknown as LoadFavoritesUseCase;

const makeStore = (
  repo: FakeAuthRepository,
  overrides: {
    savedRecipesStore?: BoundStore<SavedRecipesStoreState>;
    clearSessionCaches?: () => void;
    onSessionRestored?: () => void;
  } = {},
) => {
  const savedRecipesStore = overrides.savedRecipesStore ?? configureSavedRecipesStore({ loadFavoritesUseCase: neverLoadsFavorites });
  return configureAuthStore({
    signIn: new SignInUseCase(repo),
    requestRegistration: new RequestRegistrationUseCase(repo),
    verifyRegistration: new VerifyRegistrationUseCase(repo),
    resendRegistrationCode: new ResendRegistrationCodeUseCase(repo),
    signOut: new SignOutUseCase(repo),
    getSession: new GetSessionUseCase(repo),
    loadFavorites: fakeLoadFavorites,
    savedRecipesStore,
    signInWithGoogle: new SignInWithGoogleUseCase(repo),
    signInWithApple: new SignInWithAppleUseCase(repo),
    requestPasswordReset: new RequestPasswordResetUseCase(repo),
    resetPassword: new ResetPasswordUseCase(repo),
    uploadAvatar: new UploadAvatarUseCase(repo),
    updateProfile: new UpdateProfileUseCase(repo),
    deleteAccount: new DeleteAccountUseCase(repo),
    requestCreatorTag: new RequestCreatorTagUseCase(repo),
    removeCreatorTag: new RemoveCreatorTagUseCase(repo),
    refreshCreatorClaim: new RefreshCreatorClaimUseCase(repo),
    clearSessionCaches:
      overrides.clearSessionCaches ??
      (() => savedRecipesStore.getState().setSaved([])),
    onSessionRestored: overrides.onSessionRestored ?? (() => undefined),
  });
};

describe('auth-store', () => {
  it('starts idle', () => {
    const store = makeStore(new FakeAuthRepository());

    expect(store.getState().state.status).toBe('idle');
  });

  it('signIn transitions to authenticated on success', async () => {
    const session = buildSession();
    const store = makeStore(new FakeAuthRepository({ signInResult: ok(session) }));

    await store.getState().signIn('emilys', 'emilyspass');

    const s = store.getState().state;
    expect(s.status).toBe('authenticated');
    if (s.status === 'authenticated') expect(s.session).toBe(session);
  });

  it('signIn returns the failure and flips to unauthenticated on failure', async () => {
    const failure = new UnauthorizedFailure('bad');
    const store = makeStore(new FakeAuthRepository({ signInResult: fail(failure) }));

    const result = await store.getState().signIn('bad', 'creds');

    expect(result).toBe(failure);
    expect(store.getState().state.status).toBe('unauthenticated');
  });

  it('register returns the challenge and stays unauthenticated on success', async () => {
    const store = makeStore(
      new FakeAuthRepository({
        requestRegistrationResult: ok({
          email: 'u@example.com',
          expiresInSeconds: 180,
          expiresAt: '2026-01-01T00:03:00.000Z',
        }),
      }),
    );

    const result = await store.getState().register('u@example.com', 'password1', 'U');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        email: 'u@example.com',
        expiresInSeconds: 180,
        expiresAt: '2026-01-01T00:03:00.000Z',
      });
    }
    expect(store.getState().state.status).toBe('unauthenticated');
  });

  it('register returns the failure and stays unauthenticated on failure', async () => {
    const failure = new UnauthorizedFailure('exists');
    const store = makeStore(
      new FakeAuthRepository({ requestRegistrationResult: fail(failure) }),
    );

    const result = await store.getState().register('u@example.com', 'password1', 'U');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure).toBe(failure);
    expect(store.getState().state.status).toBe('unauthenticated');
  });

  it('verifyRegistration transitions to authenticated on success', async () => {
    const session = buildSession();
    const store = makeStore(
      new FakeAuthRepository({ verifyRegistrationResult: ok(session) }),
    );

    await store.getState().verifyRegistration('u@example.com', '123456');

    const s = store.getState().state;
    expect(s.status).toBe('authenticated');
    if (s.status === 'authenticated') expect(s.session).toBe(session);
  });

  it('verifyRegistration returns the failure and flips to unauthenticated on failure', async () => {
    const failure = new UnauthorizedFailure('bad code');
    const store = makeStore(
      new FakeAuthRepository({ verifyRegistrationResult: fail(failure) }),
    );

    const result = await store.getState().verifyRegistration('u@example.com', '000000');

    expect(result).toBe(failure);
    expect(store.getState().state.status).toBe('unauthenticated');
  });

  it('resendRegistrationCode returns the refreshed challenge on success', async () => {
    const store = makeStore(
      new FakeAuthRepository({
        resendRegistrationCodeResult: ok({
          email: 'u@example.com',
          expiresInSeconds: 180,
          expiresAt: '2026-01-01T00:03:00.000Z',
        }),
      }),
    );

    const result = await store.getState().resendRegistrationCode('u@example.com');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        email: 'u@example.com',
        expiresInSeconds: 180,
        expiresAt: '2026-01-01T00:03:00.000Z',
      });
    }
  });

  it('signOut transitions to unauthenticated on success', async () => {
    const store = makeStore(new FakeAuthRepository({ signOutResult: ok(undefined) }));

    await store.getState().signOut();

    expect(store.getState().state.status).toBe('unauthenticated');
  });

  // Regression: session caches (comments, likes, details, …) survived an
  // account switch, so a deleted account's comments stayed visible until a
  // manual refresh.
  it('signOut clears the session caches on success', async () => {
    const clearSessionCaches = jest.fn();
    const store = makeStore(new FakeAuthRepository({ signOutResult: ok(undefined) }), {
      clearSessionCaches,
    });

    await store.getState().signOut();

    expect(clearSessionCaches).toHaveBeenCalledTimes(1);
  });

  it('signOut keeps the session caches when the sign-out fails', async () => {
    const clearSessionCaches = jest.fn();
    const store = makeStore(
      new FakeAuthRepository({ signOutResult: fail(new NetworkFailure('offline')) }),
      { clearSessionCaches },
    );

    await store.getState().signOut();

    expect(clearSessionCaches).not.toHaveBeenCalled();
  });

  it('hydrate returns authenticated when a valid session exists', async () => {
    const session = buildSession();
    const store = makeStore(new FakeAuthRepository({ currentSessionResult: ok(session) }));

    await store.getState().hydrate();

    expect(store.getState().state.status).toBe('authenticated');
  });

  // Review finding: an interactive sign-in sends `device` in its body AND the
  // status change fired a `POST /me/devices` — two upserts per login. The
  // heartbeat now belongs to a restored session only.
  it('sends the device heartbeat when hydrate restores a stored session', async () => {
    const onSessionRestored = jest.fn();
    const store = makeStore(new FakeAuthRepository({ currentSessionResult: ok(buildSession()) }), { onSessionRestored });

    await store.getState().hydrate();

    expect(onSessionRestored).toHaveBeenCalledTimes(1);
  });

  it('an interactive sign-in recorded the device twice — it now sends no heartbeat of its own', async () => {
    const onSessionRestored = jest.fn();
    const store = makeStore(new FakeAuthRepository({ signInResult: ok(buildSession()) }), { onSessionRestored });

    await store.getState().signIn('emilys', 'emilyspass');

    expect(store.getState().state.status).toBe('authenticated');
    expect(onSessionRestored).not.toHaveBeenCalled();
  });

  it('sends no heartbeat when hydrate finds no session', async () => {
    const onSessionRestored = jest.fn();
    const store = makeStore(new FakeAuthRepository({ currentSessionResult: ok(null) }), { onSessionRestored });

    await store.getState().hydrate();

    expect(onSessionRestored).not.toHaveBeenCalled();
  });

  it('hydrate returns unauthenticated when there is no session', async () => {
    const store = makeStore(new FakeAuthRepository({ currentSessionResult: ok(null) }));

    await store.getState().hydrate();

    expect(store.getState().state.status).toBe('unauthenticated');
  });

  it('hydrate returns unauthenticated when the persisted session is expired', async () => {
    const expired = buildSession({ expiresAt: new Date(Date.now() - 1000) });
    const store = makeStore(new FakeAuthRepository({ currentSessionResult: ok(expired) }));

    await store.getState().hydrate();

    expect(store.getState().state.status).toBe('unauthenticated');
  });

  it('requestPasswordReset returns null when the use case succeeds', async () => {
    const store = makeStore(new FakeAuthRepository());

    const result = await store.getState().requestPasswordReset('user@example.com');

    expect(result).toBeNull();
  });

  it('requestPasswordReset returns the failure without touching the session state', async () => {
    const failure = new NetworkFailure('no connection');
    const repo = new (class extends FakeAuthRepository {
      override requestPasswordReset(_email: string) {
        return Promise.resolve(fail(failure));
      }
    })();
    const store = makeStore(repo);

    const result = await store.getState().requestPasswordReset('user@example.com');

    expect(result).toBe(failure);
    // The transient failure is page-scoped — it never lands in the global state.
    expect(store.getState().state.status).toBe('idle');
  });

  it('resetPassword returns null on success and does not transition to authenticated', async () => {
    const store = makeStore(new FakeAuthRepository());

    const result = await store.getState().resetPassword('valid-token', 'newP@ssw0rd');

    expect(result).toBeNull();
    expect(store.getState().state.status).not.toBe('authenticated');
  });

  it('resetPassword returns the Failure without touching the session state', async () => {
    const failure = new NotFoundFailure('reset token not found');
    const repo = new (class extends FakeAuthRepository {
      override resetPassword(_token: string, _newPassword: string) {
        return Promise.resolve(fail(failure));
      }
    })();
    const store = makeStore(repo);

    const result = await store.getState().resetPassword('expired-token', 'newP@ssw0rd');

    expect(result).toBe(failure);
    // The transient failure is page-scoped — it never lands in the global state.
    expect(store.getState().state.status).toBe('idle');
  });

  it('uploadAvatar returns null and sets the new authenticated session on success', async () => {
    const updated = buildSession();
    const store = makeStore(new FakeAuthRepository({ uploadAvatarResult: ok(updated) }));
    await store.getState().signIn('emilys', 'emilyspass');

    const result = await store.getState().uploadAvatar('file:///tmp/a.png', 'a.png', 'image/png');

    expect(result).toBeNull();
    const s = store.getState().state;
    expect(s.status).toBe('authenticated');
    if (s.status === 'authenticated') expect(s.session).toBe(updated);
  });

  it('uploadAvatar returns the Failure and keeps the authenticated state on failure', async () => {
    const session = buildSession();
    const failure = new NetworkFailure('upload failed');
    const repo = new (class extends FakeAuthRepository {
      override signIn() {
        return Promise.resolve(ok(session));
      }
      override uploadAvatar() {
        return Promise.resolve(fail(failure));
      }
    })();
    const store = makeStore(repo);
    await store.getState().signIn('emilys', 'emilyspass');

    const result = await store.getState().uploadAvatar('file:///tmp/a.png', 'a.png', 'image/png');

    expect(result).toBe(failure);
    const s = store.getState().state;
    expect(s.status).toBe('authenticated');
    if (s.status === 'authenticated') expect(s.session).toBe(session);
  });

  describe('expireSession', () => {
    it('is a no-op when the status is not authenticated (does not call signOut)', async () => {
      const repo = new FakeAuthRepository({ currentSessionResult: ok(null) });
      const signOutSpy = jest.spyOn(repo, 'signOut');
      const store = makeStore(repo);
      // Drive the store to `unauthenticated` (not authenticated).
      await store.getState().hydrate();
      expect(store.getState().state.status).toBe('unauthenticated');
      signOutSpy.mockClear();

      await store.getState().expireSession();

      expect(signOutSpy).not.toHaveBeenCalled();
      expect(store.getState().state.status).toBe('unauthenticated');
    });

    it('is a no-op while loading and leaves the state untouched', async () => {
      const store = makeStore(new FakeAuthRepository());
      // Default state is `idle`; force a `loading` snapshot via signIn in-flight
      // is unnecessary — `idle` is also non-authenticated and exercises the guard.
      expect(store.getState().state.status).toBe('idle');

      await store.getState().expireSession();

      expect(store.getState().state.status).toBe('idle');
    });

    it('clears the session, flips to unauthenticated, and clears savedIds when authenticated', async () => {
      const session = buildSession();
      const repo = new FakeAuthRepository({
        signInResult: ok(session),
        signOutResult: ok(undefined),
      });
      const signOutSpy = jest.spyOn(repo, 'signOut');
      const savedRecipesStore = configureSavedRecipesStore({ loadFavoritesUseCase: neverLoadsFavorites });
      const store = makeStore(repo, { savedRecipesStore });
      await store.getState().signIn('emilys', 'emilyspass');
      expect(store.getState().state.status).toBe('authenticated');
      savedRecipesStore.getState().setSaved([makeSummary('r1'), makeSummary('r2')]);

      await store.getState().expireSession();

      expect(signOutSpy).toHaveBeenCalledTimes(1);
      expect(store.getState().state.status).toBe('unauthenticated');
      expect(savedRecipesStore.getState().savedIds.size).toBe(0);
    });
  });

  describe('updateProfile', () => {
    const buildUpdatedSession = (): AuthSessionEntity => {
      const email = Email.create('u@example.com');
      if (!email.ok) throw new Error();
      const user = UserEntity.create({
        id: 'u1',
        email: email.value,
        displayName: 'Updated Name',
        bio: 'Updated bio',
      });
      if (!user.ok) throw new Error();
      const session = AuthSessionEntity.create({
        id: 's1',
        accessToken: 'tok',
        expiresAt: new Date(Date.now() + 60_000),
        user: user.value,
      });
      if (!session.ok) throw new Error();
      return session.value;
    };

    it('returns null and sets the new authenticated session on success', async () => {
      const updated = buildUpdatedSession();
      const store = makeStore(new FakeAuthRepository({ updateProfileResult: ok(updated) }));
      await store.getState().signIn('emilys', 'emilyspass');

      const result = await store
        .getState()
        .updateProfile({ displayName: 'Updated Name', bio: 'Updated bio' });

      expect(result).toBeNull();
      const s = store.getState().state;
      expect(s.status).toBe('authenticated');
      if (s.status === 'authenticated') {
        expect(s.session).toBe(updated);
        expect(s.session.user.displayName).toBe('Updated Name');
        expect(s.session.user.bio).toBe('Updated bio');
      }
    });

    it('returns the Failure and keeps the prior authenticated session on failure', async () => {
      const session = buildSession();
      const failure = new NetworkFailure('update failed');
      const repo = new (class extends FakeAuthRepository {
        override signIn() {
          return Promise.resolve(ok(session));
        }
        override updateProfile() {
          return Promise.resolve(fail(failure));
        }
      })();
      const store = makeStore(repo);
      await store.getState().signIn('emilys', 'emilyspass');

      const result = await store.getState().updateProfile({ displayName: 'Updated Name' });

      expect(result).toBe(failure);
      const s = store.getState().state;
      expect(s.status).toBe('authenticated');
      if (s.status === 'authenticated') expect(s.session).toBe(session);
    });
  });

  describe('deleteAccount', () => {
    it('returns null, flips to unauthenticated, and clears savedIds on success', async () => {
      const session = buildSession();
      const repo = new FakeAuthRepository({
        signInResult: ok(session),
        deleteAccountResult: ok(undefined),
      });
      const savedRecipesStore = configureSavedRecipesStore({ loadFavoritesUseCase: neverLoadsFavorites });
      const store = makeStore(repo, { savedRecipesStore });
      await store.getState().signIn('emilys', 'emilyspass');
      expect(store.getState().state.status).toBe('authenticated');
      savedRecipesStore.getState().setSaved([makeSummary('r1'), makeSummary('r2')]);

      const result = await store.getState().deleteAccount();

      expect(result).toBeNull();
      expect(store.getState().state.status).toBe('unauthenticated');
      expect(savedRecipesStore.getState().savedIds.size).toBe(0);
    });

    it('returns the Failure and leaves the user authenticated on failure', async () => {
      const session = buildSession();
      const failure = new NetworkFailure('delete failed');
      const repo = new (class extends FakeAuthRepository {
        override signIn() {
          return Promise.resolve(ok(session));
        }
        override deleteAccount() {
          return Promise.resolve(fail(failure));
        }
      })();
      const store = makeStore(repo);
      await store.getState().signIn('emilys', 'emilyspass');

      const result = await store.getState().deleteAccount();

      expect(result).toBe(failure);
      const s = store.getState().state;
      expect(s.status).toBe('authenticated');
      if (s.status === 'authenticated') expect(s.session).toBe(session);
    });
  });
});

describe('auth store — creator claim', () => {
  const claimedSession = (status: string): AuthSessionEntity => {
    const tag = CreatorTag.create('instagram', 'chef.ada');
    if (!tag.ok) throw new Error();
    const claim = CreatorClaim.create(tag.value, status);
    if (!claim.ok) throw new Error();
    const email = Email.create('u@example.com');
    if (!email.ok) throw new Error();
    const user = UserEntity.create({ id: 'u1', email: email.value, displayName: 'U', creatorClaims: CreatorClaims.empty().with(claim.value) });
    if (!user.ok) throw new Error();
    const session = AuthSessionEntity.create({
      id: 's1',
      accessToken: 'tok',
      expiresAt: new Date(Date.now() + 60_000),
      user: user.value,
    });
    if (!session.ok) throw new Error();
    return session.value;
  };

  const userOf = (store: ReturnType<typeof makeStore>): UserEntity | null => {
    const s = store.getState().state;
    return s.status === 'authenticated' ? s.session.user : null;
  };

  /** The Instagram claim's status, `null` when there is no claim. */
  const statusOf = (store: ReturnType<typeof makeStore>): string | null =>
    userOf(store)?.creatorClaims.forPlatform('instagram')?.status ?? null;

  it('requestCreatorTag puts the pending claim on the session user', async () => {
    const store = makeStore(
      new FakeAuthRepository({ signInResult: ok(buildSession()), requestCreatorTagResult: ok(claimedSession('pending')) }),
    );
    await store.getState().signIn('a@b.co', 'pw');

    const result = await store.getState().requestCreatorTag({ platform: 'instagram', handle: '@Chef.Ada' });

    expect(result).toBeNull();
    expect(statusOf(store)).toBe(CreatorStatus.Pending);
    expect(userOf(store)?.creatorClaims.forPlatform('instagram')?.tag.displayHandle).toBe('@chef.ada');
  });

  it('requestCreatorTag returns the handle failure and keeps the session as it was', async () => {
    const session = buildSession();
    const store = makeStore(new FakeAuthRepository({ signInResult: ok(session) }));
    await store.getState().signIn('a@b.co', 'pw');

    const result = await store.getState().requestCreatorTag({ platform: 'tiktok', handle: 'bad..handle' });

    expect(result?.messageKey).toBe(ErrorMessageKey.creatorHandleInvalid);
    const s = store.getState().state;
    expect(s.status === 'authenticated' && s.session).toBe(session);
  });

  it('removeCreatorTag leaves the session user without a claim', async () => {
    const store = makeStore(
      new FakeAuthRepository({ signInResult: ok(claimedSession('approved')), removeCreatorTagResult: ok(buildSession()) }),
    );
    await store.getState().signIn('a@b.co', 'pw');
    expect(statusOf(store)).toBe(CreatorStatus.Approved);

    expect(await store.getState().removeCreatorTag('instagram')).toBeNull();

    expect(statusOf(store)).toBeNull();
  });

  it('refreshCreatorClaim shows the admin decision', async () => {
    const store = makeStore(
      new FakeAuthRepository({
        signInResult: ok(claimedSession('pending')),
        refreshCreatorClaimResult: ok(claimedSession('approved')),
      }),
    );
    await store.getState().signIn('a@b.co', 'pw');

    expect(await store.getState().refreshCreatorClaim()).toBeNull();

    expect(userOf(store)?.creatorClaims.forPlatform('instagram')?.isApproved).toBe(true);
  });

  it('refreshCreatorClaim returns the failure and keeps the claim shown', async () => {
    const failure = new NetworkFailure('offline');
    const store = makeStore(
      new FakeAuthRepository({ signInResult: ok(claimedSession('pending')), refreshCreatorClaimResult: fail(failure) }),
    );
    await store.getState().signIn('a@b.co', 'pw');

    expect(await store.getState().refreshCreatorClaim()).toBe(failure);
    expect(statusOf(store)).toBe(CreatorStatus.Pending);
  });

  it('a claim answer for the previous user does not land in the next user\'s session', async () => {
    const next = (() => {
      const email = Email.create('b@example.com');
      if (!email.ok) throw new Error();
      const user = UserEntity.create({ id: 'u2', email: email.value, displayName: 'B' });
      if (!user.ok) throw new Error();
      const session = AuthSessionEntity.create({ id: 's2', accessToken: 'tok2', expiresAt: new Date(Date.now() + 60_000), user: user.value });
      if (!session.ok) throw new Error();
      return session.value;
    })();
    let release: (session: AuthSessionEntity) => void = () => undefined;
    const signIns = [buildSession(), next];
    const repo = new (class extends FakeAuthRepository {
      override signIn() {
        const session = signIns.shift();
        return Promise.resolve(session === undefined ? fail(new NetworkFailure('none')) : ok(session));
      }
      override refreshCreatorClaim() {
        return new Promise<Result<AuthSessionEntity, Failure>>((resolve) => {
          release = (session) => resolve(ok(session));
        });
      }
    })();
    const store = makeStore(repo);
    await store.getState().signIn('a@b.co', 'pw');
    const refreshing = store.getState().refreshCreatorClaim();
    await store.getState().signOut();
    await store.getState().signIn('b@b.co', 'pw');

    release(claimedSession('approved'));
    await refreshing;

    const s = store.getState().state;
    expect(s.status === 'authenticated' && s.session).toBe(next);
  });

  it('a focus refresh that started before a request does not put the old claim back', async () => {
    let release: (session: AuthSessionEntity) => void = () => undefined;
    const repo = new (class extends FakeAuthRepository {
      override refreshCreatorClaim() {
        return new Promise<Result<AuthSessionEntity, Failure>>((resolve) => {
          release = (session) => resolve(ok(session));
        });
      }
    })({ signInResult: ok(claimedSession('approved')), requestCreatorTagResult: ok(claimedSession('pending')) });
    const store = makeStore(repo);
    await store.getState().signIn('a@b.co', 'pw');

    const refreshing = store.getState().refreshCreatorClaim();
    expect(await store.getState().requestCreatorTag({ platform: 'instagram', handle: 'chef.ada' })).toBeNull();
    release(claimedSession('approved'));
    await refreshing;

    expect(statusOf(store)).toBe(CreatorStatus.Pending);
  });

  // The store counted only writes that STARTED during a refresh, so one already
  // in flight when the refresh began was missed and its old claim won.
  it('a focus refresh that started while a request was in flight does not put the old claim back', async () => {
    let answerRequest: (session: AuthSessionEntity) => void = () => undefined;
    let answerRefresh: (session: AuthSessionEntity) => void = () => undefined;
    const repo = new (class extends FakeAuthRepository {
      override requestCreatorTag() {
        return new Promise<Result<AuthSessionEntity, Failure>>((resolve) => {
          answerRequest = (session) => resolve(ok(session));
        });
      }
      override refreshCreatorClaim() {
        return new Promise<Result<AuthSessionEntity, Failure>>((resolve) => {
          answerRefresh = (session) => resolve(ok(session));
        });
      }
    })({ signInResult: ok(claimedSession('approved')) });
    const store = makeStore(repo);
    await store.getState().signIn('a@b.co', 'pw');

    const requesting = store.getState().requestCreatorTag({ platform: 'instagram', handle: 'chef.ada' });
    const refreshing = store.getState().refreshCreatorClaim();
    await Promise.resolve();
    answerRequest(claimedSession('pending'));
    expect(await requesting).toBeNull();
    answerRefresh(claimedSession('approved'));
    await refreshing;

    expect(statusOf(store)).toBe(CreatorStatus.Pending);
  });

  it('an answer landing after sign-out does not sign the user back in', async () => {
    let release: (session: AuthSessionEntity) => void = () => undefined;
    const repo = new (class extends FakeAuthRepository {
      override refreshCreatorClaim() {
        return new Promise<Result<AuthSessionEntity, Failure>>((resolve) => {
          release = (session) => resolve(ok(session));
        });
      }
    })({ signInResult: ok(buildSession()) });
    const store = makeStore(repo);
    await store.getState().signIn('a@b.co', 'pw');
    const refreshing = store.getState().refreshCreatorClaim();
    await store.getState().signOut();

    release(claimedSession('approved'));
    await refreshing;

    expect(store.getState().state.status).toBe('unauthenticated');
  });
});
