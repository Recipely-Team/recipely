// One logged food. Keep in sync with recipely-backend
// `application/diary/dtos/food-log-entry.dto.ts`. Macros are nullable: an
// entry logged from a calories-only recipe has none.
export interface FoodLogEntryDto {
  id: string;
  date: string;
  meal: string;
  name: string;
  servings: number;
  calories: number;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  recipeId: string | null;
  recipeImageUrl: string | null;
}
