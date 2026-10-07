import type { BoundStore } from '@application/store/bound-store';
import { create } from 'zustand';
import { fail, ok } from '@core/result/result-helpers';
import { ConflictFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { RecipeLikeState } from '@application/likes/recipe-like-state';
import type { LikesStoreState } from '@application/likes/likes-store-state';
import type { SetRecipeLikeUseCase } from '@application/likes/set-recipe-like-use-case';
import type { LikedRecipesStoreState } from '@application/recipes/liked/liked-recipes-store-state';
import { ViewerReaction } from '@domain/common/viewer-reaction';
import { RequestEpoch } from '@application/store/request-epoch';

interface LikesStoreDeps {
  setRecipeLike: SetRecipeLikeUseCase;
  likedRecipesStore: BoundStore<LikedRecipesStoreState>;
}

/**
 * **Likes store** — like count and the viewer's like per recipe, toggled optimistically.
 *
 * @remarks
 * - **Session guard**: `clear()` on sign-out drops a toggle answer still in
 *   flight, so the previous account's like is never written back.
 */
export const configureLikesStore = (deps: LikesStoreDeps): BoundStore<LikesStoreState> => {
  const session = new RequestEpoch();
  return create<LikesStoreState>((set, get) => ({
    byRecipe: {},

    seed: (recipeId, likeCount, likedByMe) => {
      if (get().byRecipe[recipeId] !== undefined) return;
      set((s) => ({
        byRecipe: {
          ...s.byRecipe,
          [recipeId]: { likeCount, likedByMe, isLoading: false, updatedAt: Date.now() },
        },
      }));
    },

    syncFromApi: (recipeId, likeCount, likedByMe, fetchedAt) => {
      // Skip while an optimistic toggle is in flight.
      const current = get().byRecipe[recipeId];
      if (current?.isLoading) return;
      // Skip a payload older than what we hold (the detail cache predates the like).
      if (current !== undefined && fetchedAt <= current.updatedAt) return;
      // Skip identical values: an unconditional set re-renders and can loop.
      if (
        current !== undefined &&
        current.likeCount === likeCount &&
        current.likedByMe === likedByMe
      )
        return;
      set((s) => ({
        byRecipe: {
          ...s.byRecipe,
          [recipeId]: { likeCount, likedByMe, isLoading: false, updatedAt: fetchedAt },
        },
      }));
    },

    toggle: async (recipeId) => {
      const current = get().byRecipe[recipeId];
      if (!current || current.isLoading) return ok(undefined);

      const wasLiked = current.likedByMe;
      const next = ViewerReaction.of(current.likeCount, wasLiked).toggled();
      const optimistic: RecipeLikeState = {
        likeCount: next.count,
        likedByMe: next.mine,
        isLoading: true,
        updatedAt: Date.now(),
      };

      set((s) => ({ byRecipe: { ...s.byRecipe, [recipeId]: optimistic } }));

      const isSession = session.current();
      const result = await deps.setRecipeLike.execute(recipeId, next.mine);
      if (!isSession()) return result;

      set((s) => ({
        byRecipe: {
          ...s.byRecipe,
          [recipeId]: result.ok
            ? { ...optimistic, isLoading: false }
            : { ...current, isLoading: false }, // rollback
        },
      }));

      // Unlike removes the row from the Liked grid; a new like appears on its next load.
      if (result.ok && wasLiked) {
        deps.likedRecipesStore.getState().removeLocal(recipeId);
      }

      return result;
    },

    setLiked: async (recipeId, wanted) => {
      const current = get().byRecipe[recipeId];

      // No entry means unknown, not "done": report not-ready.
      if (current === undefined) {
        return fail(new ConflictFailure(DiagnosticMessage.assistant.likeStateNotLoaded));
      }
      if (current.isLoading) {
        return fail(new ConflictFailure(DiagnosticMessage.assistant.likeAlreadyInFlight));
      }
      // Already the wanted outcome: the user asked for a state, and it holds.
      if (current.likedByMe === wanted) return ok(undefined);

      return get().toggle(recipeId);
    },

    clear: () => {
      session.invalidate();
      set({ byRecipe: {} });
    },
  }));
};
