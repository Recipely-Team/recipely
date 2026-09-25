/** What {@link usePublishRecipe} hands its screen. */
export interface UsePublishRecipeResult {
  /** Offers the recipe for publishing and says, in a toast, where it landed. */
  publish: (recipeId: string) => Promise<void>;
  /** Takes the recipe back to private, with the same toast. */
  unpublish: (recipeId: string) => Promise<void>;
  isBusy: boolean;
}
