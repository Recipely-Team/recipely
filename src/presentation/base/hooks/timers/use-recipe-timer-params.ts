export interface UseRecipeTimerParams {
  /** Stable unique key, e.g. `${recipeId}:prep` or `${recipeId}:step3:5min`. */
  timerId: string;
  recipeId: string;
  recipeName: string;
  minutes: number;
}
