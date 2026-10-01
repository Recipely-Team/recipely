import type { FoodSearchGroup, FoodSearchGroupType } from '@domain/diary/foods/search/food-search-group';

/** The search groups that list recipes — every group but Products. */
export type RecipeHitGroupType = Exclude<FoodSearchGroupType, typeof FoodSearchGroup.Products>;
