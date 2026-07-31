// Per-serving macros the backend attaches to a recipe. Optional throughout:
// older recipes predate nutrition, and the AI calculator can fail without
// failing the recipe — see `RecipeDto.nutrition`.
export interface NutritionDto {
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
}
