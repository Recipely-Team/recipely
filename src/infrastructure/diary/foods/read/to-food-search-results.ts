import type { Mapper } from '@core/mapper/mapper';
import { ok } from '@core/result/result-helpers';
import type { FoodSearchResults } from '@domain/diary/foods/search/food-search-results';
import type { FoodSearchDto } from '@infrastructure/diary/foods/dtos/food-search-dto';
import { toPage } from '@infrastructure/network/paging/to-page';
import { toRecipeFoodHit } from '@infrastructure/diary/foods/read/to-recipe-food-hit';
import { toFoodProduct } from '@infrastructure/diary/foods/read/to-food-product';

/** The grouped first page → `FoodSearchResults`, each group through `toPage`. */
export const toFoodSearchResults: Mapper<FoodSearchDto, FoodSearchResults> = (dto) =>
  ok({
    query: dto.query,
    saved: toPage(dto.saved, toRecipeFoodHit),
    mine: toPage(dto.mine, toRecipeFoodHit),
    products: toPage(dto.products, toFoodProduct),
    recipes: toPage(dto.recipes, toRecipeFoodHit),
  });
