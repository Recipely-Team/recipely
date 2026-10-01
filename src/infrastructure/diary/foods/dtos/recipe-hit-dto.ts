// A recipe in `GET /diary/foods/search`. Numbers are per serving. Keep in
// sync with recipely-backend `application/diary/dtos/diary-food-search.dto.ts`.
export interface RecipeHitDto {
  id: string;
  name: string;
  image: string | null;
  servings: number;
  caloriesPerServing: number;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  servingWeightGrams: number | null;
  status: string;
  isPublished: boolean;
}
