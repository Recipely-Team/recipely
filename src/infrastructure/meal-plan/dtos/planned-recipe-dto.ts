// The recipe on a meal plan entry (backend #392).
export interface PlannedRecipeDto {
  id: string;
  name: string;
  imageUrl: string | null;
  caloriesPerServing: number | null;
  servings: number;
  totalTimeMinutes: number | null;
}
