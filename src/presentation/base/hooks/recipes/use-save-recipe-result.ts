export interface UseSaveRecipeResult {
  /** True when the given recipe id is in the signed-in user's saved set. */
  isSaved: (recipeId: string) => boolean;
  /**
   * Toggles the saved (favorite) state for a recipe, mirroring the detail
   * screen wiring: no-op while a request is in flight or when signed out.
   */
  toggleSave: (recipeId: string) => Promise<void>;
}
