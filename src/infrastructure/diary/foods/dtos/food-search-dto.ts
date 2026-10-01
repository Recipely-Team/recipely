import type { PageDto } from '@infrastructure/network/paging/page-dto';
import type { FoodProductDto } from '@infrastructure/diary/foods/dtos/food-product-dto';
import type { RecipeHitDto } from '@infrastructure/diary/foods/dtos/recipe-hit-dto';

// `GET /diary/foods/search` without `group=`: the first page of every group.
export interface FoodSearchDto {
  query: string;
  saved: PageDto<RecipeHitDto>;
  mine: PageDto<RecipeHitDto>;
  products: PageDto<FoodProductDto>;
  recipes: PageDto<RecipeHitDto>;
}
