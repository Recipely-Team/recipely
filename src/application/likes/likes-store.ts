import type { StoreApi, UseBoundStore } from 'zustand';
import { create } from 'zustand';
import { ok } from '@core/result/result-helpers';
import type { RecipeLikeState } from '@application/likes/recipe-like-state';
import type { LikesStoreState } from '@application/likes/likes-store-state';
import type { LikesStoreDeps } from '@application/likes/likes-store-deps';

export const configureLikesStore = (deps: LikesStoreDeps): LikesStore =>
  create<LikesStoreState>((set, get) => ({
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
      // WHY: skip when an optimistic toggle is in-flight — we don't want a
      // concurrent detail-fetch to clobber the count the user just changed.
      const current = get().byRecipe[recipeId];
      if (current?.isLoading) return;
      // WHY: skip a payload OLDER than what we hold. Re-entering a recipe
      // re-renders it from the detail cache, and that cached copy was read
      // before the user's like — publishing it would rewind the heart to empty
      // and the user would find their like gone every time they came back.
      if (current !== undefined && fetchedAt <= current.updatedAt) return;
      // WHY: skip when values are identical — calling set() unconditionally
      // triggers a re-render on every call, which feeds an infinite loop when
      // the caller's useEffect has a non-primitive dependency on recipeState.
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
      const optimistic: RecipeLikeState = {
        likeCount: wasLiked ? current.likeCount - 1 : current.likeCount + 1,
        likedByMe: !wasLiked,
        isLoading: true,
        // The user's own action is the newest truth there is until a response
        // read AFTER it arrives.
        updatedAt: Date.now(),
      };

      set((s) => ({ byRecipe: { ...s.byRecipe, [recipeId]: optimistic } }));

      const result = wasLiked
        ? await deps.unlikeRecipe.execute(recipeId)
        : await deps.likeRecipe.execute(recipeId);

      set((s) => ({
        byRecipe: {
          ...s.byRecipe,
          [recipeId]: result.ok
            ? { ...optimistic, isLoading: false }
            : { ...current, isLoading: false }, // rollback
        },
      }));

      return result;
    },

    clear: () => set({ byRecipe: {} }),
  }));

/** Bound Zustand store handle produced by `configureLikesStore`. */
export type LikesStore = UseBoundStore<StoreApi<LikesStoreState>>;
