import type { RecipeDetailState } from '@application/recipes/detail/recipe-detail-state';

export interface RecipeDetailStoreState {
  byId: Record<string, RecipeDetailState>;
  load: (id: string) => Promise<void>;
  remove: (id: string) => void;
  /** Drops every cached recipe detail. Called when the session ends. */
  clear: () => void;
}
