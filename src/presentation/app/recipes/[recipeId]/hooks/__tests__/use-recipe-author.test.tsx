import { act } from 'react-test-renderer';
import { fail, ok } from '@core/result/result-helpers';
import { NetworkFailure } from '@core/failure';
import { container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import { UserProfileEntity } from '@domain/user-profile/user-profile-entity';
import type { GetUserProfileInput } from '@application/user-profile/get-user-profile-input';
import { renderComponent } from '@presentation/base/test-support/render-component';
import {
  useRecipeAuthor,
} from '@presentation/app/recipes/[recipeId]/hooks/use-recipe-author';
import type { RecipeAuthorInput } from '@presentation/app/recipes/[recipeId]/model/author/recipe-author-input';
import type { RecipeAuthorState } from '@presentation/app/recipes/[recipeId]/model/author/recipe-author-state';
import type { ResolvedAuthor } from '@presentation/app/recipes/[recipeId]/model/author/resolved-author';

const makeProfile = (overrides: Partial<Parameters<typeof UserProfileEntity.create>[0]> = {}): UserProfileEntity => {
  const result = UserProfileEntity.create({
    id: 'author-9',
    displayName: 'Bob Baker',
    bio: null,
    photoUrl: 'https://cdn.recipely.io/avatars/bob.webp',
    recipeCount: 7,
    totalLikes: 100,
    totalViews: 2000,
    joinedAt: new Date('2026-04-01T12:00:00.000Z'),
    ...overrides,
  });
  if (!result.ok) throw new Error('Test setup expected a valid UserProfile');
  return result.value;
};

/**
 * Drives `useRecipeAuthor` through a probe component (react-test-renderer has
 * no `renderHook`) and captures the latest state plus the `execute` spy so
 * tests can assert both the returned union and whether a fetch was attempted.
 */
const driveHook = (
  input: RecipeAuthorInput,
  executeImpl: (input: GetUserProfileInput) => Promise<ReturnType<typeof ok> | ReturnType<typeof fail>>,
): { latest: () => RecipeAuthorState; execute: jest.Mock } => {
  const execute = jest.fn(executeImpl);
  container.register(TOKENS.GetUserProfileUseCase, () => ({ execute }));

  let latest: RecipeAuthorState = { status: 'loading' };
  const Probe = (): null => {
    latest = useRecipeAuthor(input);
    return null;
  };

  renderComponent(<Probe />);
  return { latest: () => latest, execute };
};

afterEach(() => {
  container.reset();
});

describe('useRecipeAuthor', () => {
  it('resolves immediately from the caller-supplied owner without fetching', () => {
    const owner: ResolvedAuthor = {
      authorName: 'Ada Lovelace',
      authorPhotoUrl: 'https://cdn.recipely.io/avatars/ada.webp',
      recipeCount: 12,
      isOwner: true,
    };

    const { latest, execute } = driveHook(
      { ownerId: 'me', owner, isOwner: true },
      () => Promise.resolve(ok(makeProfile())),
    );

    expect(latest()).toEqual({ status: 'resolved', author: owner });
    expect(execute).not.toHaveBeenCalled();
  });

  it('stays loading for an owned recipe whose own profile has not resolved yet', () => {
    const { latest, execute } = driveHook(
      { ownerId: 'me', owner: null, isOwner: true },
      () => Promise.resolve(ok(makeProfile())),
    );

    expect(latest().status).toBe('loading');
    expect(execute).not.toHaveBeenCalled();
  });

  it('fetches another author by ownerId and resolves a read-only author', async () => {
    const profile = makeProfile({ displayName: 'Bob Baker', recipeCount: 7 });
    const { latest, execute } = driveHook(
      { ownerId: 'author-9', owner: null, isOwner: false },
      () => Promise.resolve(ok(profile)),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(execute).toHaveBeenCalledWith({ userId: 'author-9' });
    expect(latest()).toEqual({
      status: 'resolved',
      author: {
        authorName: 'Bob Baker',
        authorPhotoUrl: 'https://cdn.recipely.io/avatars/bob.webp',
        recipeCount: 7,
        isOwner: false,
      },
    });
  });

  it('maps a missing photoUrl to undefined in the resolved author', async () => {
    const profile = makeProfile({ photoUrl: null });
    const { latest } = driveHook(
      { ownerId: 'author-9', owner: null, isOwner: false },
      () => Promise.resolve(ok(profile)),
    );

    await act(async () => {
      await Promise.resolve();
    });

    const state = latest();
    expect(state.status).toBe('resolved');
    if (state.status === 'resolved') {
      expect(state.author.authorPhotoUrl).toBeUndefined();
    }
  });

  it('becomes unavailable when the profile lookup fails', async () => {
    const { latest } = driveHook(
      { ownerId: 'author-9', owner: null, isOwner: false },
      () => Promise.resolve(fail(new NetworkFailure('offline'))),
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(latest().status).toBe('unavailable');
  });

  it('is unavailable without fetching when there is no ownerId to look up', () => {
    const { latest, execute } = driveHook(
      { ownerId: null, owner: null, isOwner: false },
      () => Promise.resolve(ok(makeProfile())),
    );

    expect(latest().status).toBe('unavailable');
    expect(execute).not.toHaveBeenCalled();
  });
});
