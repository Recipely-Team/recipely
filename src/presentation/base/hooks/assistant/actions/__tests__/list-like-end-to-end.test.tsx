import { act } from 'react-test-renderer';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import { configureLikesStore } from '@application/likes/likes-store';
import { StoreStatus } from '@application/store/store-status';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import { useAssistantListRecipeActions } from '@presentation/base/hooks/assistant/actions/use-assistant-list-recipe-actions';
import type { LikeRecipeUseCase } from '@application/likes/like-recipe-use-case';
import type { UnlikeRecipeUseCase } from '@application/likes/unlike-recipe-use-case';
import type { LikedRecipesStoreState } from '@application/recipes/liked/liked-recipes-store-state';
import type { BoundStore } from '@application/store/bound-store';
import { ok } from '@core/result/result-helpers';

/**
 * The handler wired to the REAL likes store, which the earlier test did not do:
 * it stubbed `setLiked` to return ok, so it could only ever prove the handler
 * called something. Three reports said the heart did not move while the
 * assistant said it had, and the store itself tests clean — so the question is
 * what happens between them.
 */
const ROWS = [{ id: 'r-ratatouille', name: 'Ratatuy' }];

const mount = (seeded: { count: number; liked: boolean } | null) => {
  const calls: string[] = [];
  const likes = configureLikesStore({
    likeRecipe: { execute: async (id: string) => { calls.push(`like:${id}`); return ok(undefined); } } as unknown as LikeRecipeUseCase,
    unlikeRecipe: { execute: async (id: string) => { calls.push(`unlike:${id}`); return ok(undefined); } } as unknown as UnlikeRecipeUseCase,
    likedRecipesStore: { getState: () => ({ removeLocal: () => undefined }) } as unknown as BoundStore<LikedRecipesStoreState>,
  });
  if (seeded !== null) likes.getState().seed(ROWS[0]!.id, seeded.count, seeded.liked);

  const registry = new AssistantActionRegistry();
  const stores = {
    assistantActionRegistry: registry,
    likesStore: likes,
    authStore: (select: (s: { state: unknown }) => unknown) =>
      select({ state: { status: StoreStatus.Authenticated, session: { user: { id: 'u1' } } } }),
    // Saving rides in the same hook; stubbed so the like path can be exercised.
    savedRecipesStore: (select: (s: unknown) => unknown) =>
      select({ savedIds: new Set<string>(), listState: { status: StoreStatus.Loaded } }),
    favoritesStore: (select: (s: unknown) => unknown) =>
      select({ addFavorite: async () => undefined, removeFavorite: async () => undefined }),
  } as unknown as Stores;

  const Probe = (): null => {
    useAssistantListRecipeActions(ROWS);
    return null;
  };
  renderComponent(
    <StoresProvider value={stores}>
      <Probe />
    </StoresProvider>,
  );
  return { registry, likes, calls };
};

describe('liking a feed row, end to end', () => {
  it('flips the heart the card reads from', async () => {
    const { registry, likes } = mount({ count: 0, liked: false });

    await act(async () => {
      await expect(registry.run(AssistantAction.Like, 'Ratatuy')).resolves.toMatchObject({ ok: true });
    });

    expect(likes.getState().byRecipe[ROWS[0]!.id]?.likedByMe).toBe(true);
  });

  it('un-flips it, and the count with it', async () => {
    const { registry, likes } = mount({ count: 1, liked: true });

    await act(async () => {
      await expect(registry.run(AssistantAction.Unlike, 'Ratatuy')).resolves.toMatchObject({ ok: true });
    });

    expect(likes.getState().byRecipe[ROWS[0]!.id]?.likedByMe).toBe(false);
    expect(likes.getState().byRecipe[ROWS[0]!.id]?.likeCount).toBe(0);
  });

  // The reported symptom, stated as an assertion: never say yes over a heart
  // that did not move.
  it('refuses rather than reporting success when the row was never seeded', async () => {
    const { registry, likes } = mount(null);

    await act(async () => {
      await expect(registry.run(AssistantAction.Unlike, 'Ratatuy')).resolves.toMatchObject({ ok: false });
    });

    expect(likes.getState().byRecipe[ROWS[0]!.id]).toBeUndefined();
  });
});
