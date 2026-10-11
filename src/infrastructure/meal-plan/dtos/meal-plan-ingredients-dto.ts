interface PlannedRecipeIngredientsDto {
  recipeId: string;
  recipeName: string;
  plannedServings: number;
  recipeServings: number;
  /** As written — NOT scaled; eaten meals included. */
  ingredients: string[];
}

// `GET /me/meal-plan/ingredients?from&to`.
export interface MealPlanIngredientsDto {
  recipes: PlannedRecipeIngredientsDto[];
}
