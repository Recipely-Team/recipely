/**
 * One planned recipe's ingredients for a range, as `GET /me/meal-plan/ingredients`
 * answers them: the lines as the recipe was written (NOT scaled), with the
 * servings planned and the servings written for, so the client scales them.
 */
export interface PlannedRecipeIngredients {
  readonly recipeId: string;
  readonly recipeName: string;
  readonly plannedServings: number;
  readonly recipeServings: number;
  readonly ingredients: readonly string[];
}
