import type { Failure } from '@core/failure';

export interface FavoritesStoreState {
  /** True while any save is on its way — kept for callers that only need "busy". */
  isLoading: boolean;
  /** Recipe ids whose save or unsave is on its way; each recipe is guarded on its own, so a second card's tap is never dropped. */
  pending: ReadonlySet<string>;
  /** `null` on success (or a tap dropped because that recipe was already pending), else this call's own `Failure`. */
  addFavorite: (userId: string, recipeId: string) => Promise<Failure | null>;
  removeFavorite: (userId: string, recipeId: string) => Promise<Failure | null>;
}
