// One item of `GET /diary/recent`, already normalised by the server to ONE
// serving (`servings` is always 1).
export interface RecentFoodDto {
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
