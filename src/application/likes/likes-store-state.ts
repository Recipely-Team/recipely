import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RecipeLikeState } from '@application/likes/recipe-like-state';

export interface LikesStoreState {
  /** Per-recipe like state overlay. Keyed by recipe id. */
  byRecipe: Record<string, RecipeLikeState>;
  /**
   * Seed the store with the like state that arrived from the API. No-op when
   * the entry is already present so that in-flight optimistic updates are not
   * overwritten by a stale network response. Use this from list views.
   */
  seed: (recipeId: string, likeCount: number, likedByMe: boolean) => void;
  /**
   * Sync the store from an API response, dated by `fetchedAt` (epoch ms).
   * Unlike `seed` this overwrites what is held — but only when the payload is
   * NEWER than it, so a cached recipe re-rendered on re-entry cannot rewind a
   * like the user made after that copy was read.
   */
  syncFromApi: (
    recipeId: string,
    likeCount: number,
    likedByMe: boolean,
    fetchedAt: number,
  ) => void;
  /**
   * Toggle like with optimistic update; rolls back on failure. Returns the
   * `Result` so the caller can surface a toast when the toggle is rejected —
   * the optimistic rollback alone is easy to miss.
   */
  toggle: (recipeId: string) => Promise<Result<void, Failure>>;
  /** Drops every per-recipe like overlay. Called when the session ends. */
  clear: () => void;
}
