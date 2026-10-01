import type { RecentFoodProductDto } from '@infrastructure/diary/foods/dtos/recent-food-product-dto';

// One item of `GET /diary/recent` and `GET /diary/foods/recent`. A recipe or
// quick-add row is normalised to ONE serving (`servings` is 1); a product row
// keeps its quantity and its totals, with the per-unit figures in `product`.
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
  product?: RecentFoodProductDto | null;
}
