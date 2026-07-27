import type { Failure } from '@core/failure';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';

export interface SavedRecipesStoreState {
  /**
   * The saved recipes themselves, in favourite order — what the My Recipes
   * saved grid renders. Held here rather than derived from the discover feed's
   * loaded page, which is scoped by that screen's search, filters and sort.
   */
  savedRecipes: readonly RecipeSummaryEntity[];
  savedIds: ReadonlySet<string>;
  isLoading: boolean;
  error: Failure | null;
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  addLocal: (id: string) => void;
  removeLocal: (id: string) => void;
  /** Replaces both the rows and the id set from one favourites response. */
  setSaved: (recipes: readonly RecipeSummaryEntity[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: Failure | null) => void;
  clearError: () => void;
}
