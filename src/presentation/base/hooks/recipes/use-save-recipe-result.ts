export interface UseSaveRecipeResult {
  /**
   * Toggles the saved (favorite) state for a recipe, mirroring the detail
   * screen wiring: no-op while a request is in flight or when signed out.
   */
  toggleSave: (recipeId: string) => Promise<void>;
}
