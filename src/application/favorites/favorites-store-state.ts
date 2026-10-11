import type { Failure } from '@core/failure';

export interface FavoritesStoreState {
  /** True while any save is on its way — kept for callers that only need "busy". */
  isLoading: boolean;
  /** Recipe ids whose save or unsave is on its way; each recipe is guarded on its own, so a second card's tap is never dropped. */
  pending: ReadonlySet<string>;
  error: Failure | null;
  addFavorite: (userId: string, recipeId: string) => Promise<void>;
  removeFavorite: (userId: string, recipeId: string) => Promise<void>;
  clearError: () => void;
}
