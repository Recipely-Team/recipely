import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import { ok } from '@core/result/result-helpers';
import type { Page } from '@domain/common/page';
import type { FoodCategory } from '@domain/diary/foods/food-category';
import type { FoodProduct } from '@domain/diary/foods/product/food-product';
import type { FoodDetail } from '@domain/diary/foods/product/food-detail';
import { FoodSearchGroup } from '@domain/diary/foods/search/food-search-group';
import type { RecipeFoodHit } from '@domain/diary/foods/search/recipe-food-hit';
import type { FoodSearchResults } from '@domain/diary/foods/search/food-search-results';
import type { RecipeHitGroupType } from '@domain/diary/foods/search/recipe-hit-group-type';
import type { RecentFoodType } from '@domain/diary/foods/search/recent-food';
import type { FoodCatalogRepositoryInterface } from '@domain/diary/foods/food-catalog-repository-interface';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import { FIRST_PAGE } from '@domain/common/first-page';
import type { PageDto } from '@infrastructure/network/paging/page-dto';
import { toPage } from '@infrastructure/network/paging/to-page';
import { toPageQuery } from '@infrastructure/network/paging/to-page-query';
import type { RecipeHitDto } from '@infrastructure/diary/foods/dtos/recipe-hit-dto';
import type { FoodProductDto } from '@infrastructure/diary/foods/dtos/food-product-dto';
import type { FoodDetailDto } from '@infrastructure/diary/foods/dtos/food-detail-dto';
import type { FoodCategoryDto } from '@infrastructure/diary/foods/dtos/food-category-dto';
import type { FoodSearchDto } from '@infrastructure/diary/foods/dtos/food-search-dto';
import type { RecentFoodDto } from '@infrastructure/diary/dtos/recent-food-dto';
import { toFoodSearchQuery } from '@infrastructure/diary/foods/write/to-food-search-query';
import { toFoodProductsQuery } from '@infrastructure/diary/foods/write/to-food-products-query';
import { toFoodSearchResults } from '@infrastructure/diary/foods/read/to-food-search-results';
import { toRecipeFoodHit } from '@infrastructure/diary/foods/read/to-recipe-food-hit';
import { toFoodProduct } from '@infrastructure/diary/foods/read/to-food-product';
import { toFoodDetail } from '@infrastructure/diary/foods/read/to-food-detail';
import { toFoodCategory } from '@infrastructure/diary/foods/read/to-food-category';
import { toRecentFood } from '@infrastructure/diary/foods/read/to-recent-food';

/**
 * Implements `FoodCatalogRepositoryInterface` against `/diary/foods` (backend
 * #371). Queries come from the `write/` request mappers; every list is a
 * `PageResult` read through `toPage`, which skips an unreadable row.
 */
export class FoodCatalogRepository implements FoodCatalogRepositoryInterface {
  constructor(private readonly http: HttpClient) {}

  async search(query: string, pageSize: number): Promise<Result<FoodSearchResults, Failure>> {
    const params = toFoodSearchQuery({ query, group: null, page: FIRST_PAGE, pageSize });
    const result = await this.http.get<FoodSearchDto>(ApiRoutes.diary.foods.search, { params });
    return result.ok ? toFoodSearchResults(result.value) : result;
  }

  async searchRecipes(
    query: string,
    group: RecipeHitGroupType,
    page: number,
    pageSize: number,
  ): Promise<Result<Page<RecipeFoodHit>, Failure>> {
    const params = toFoodSearchQuery({ query, group, page, pageSize });
    const result = await this.http.get<PageDto<RecipeHitDto>>(ApiRoutes.diary.foods.search, { params });
    return result.ok ? ok(toPage(result.value, toRecipeFoodHit)) : result;
  }

  async searchProducts(query: string, page: number, pageSize: number): Promise<Result<Page<FoodProduct>, Failure>> {
    const params = toFoodSearchQuery({ query, group: FoodSearchGroup.Products, page, pageSize });
    const result = await this.http.get<PageDto<FoodProductDto>>(ApiRoutes.diary.foods.search, { params });
    return result.ok ? ok(toPage(result.value, toFoodProduct)) : result;
  }

  async listCategories(page: number, pageSize: number): Promise<Result<Page<FoodCategory>, Failure>> {
    const params = toPageQuery({ page, pageSize });
    const result = await this.http.get<PageDto<FoodCategoryDto>>(ApiRoutes.diary.foods.categories, { params });
    return result.ok ? ok(toPage(result.value, toFoodCategory)) : result;
  }

  async listProducts(category: string | null, page: number, pageSize: number): Promise<Result<Page<FoodProduct>, Failure>> {
    const params = toFoodProductsQuery({ category, page, pageSize });
    const result = await this.http.get<PageDto<FoodProductDto>>(ApiRoutes.diary.foods.products, { params });
    return result.ok ? ok(toPage(result.value, toFoodProduct)) : result;
  }

  async getProduct(foodId: string): Promise<Result<FoodDetail, Failure>> {
    const result = await this.http.get<FoodDetailDto>(ApiRoutes.diary.foods.product(foodId));
    return result.ok ? toFoodDetail(result.value) : result;
  }

  async getBrandedProduct(barcode: string): Promise<Result<FoodDetail, Failure>> {
    const result = await this.http.get<FoodDetailDto>(ApiRoutes.diary.foods.barcode(barcode));
    return result.ok ? toFoodDetail(result.value) : result;
  }

  async listRecent(page: number, pageSize: number): Promise<Result<Page<RecentFoodType>, Failure>> {
    const params = toPageQuery({ page, pageSize });
    const result = await this.http.get<PageDto<RecentFoodDto>>(ApiRoutes.diary.foods.recent, { params });
    return result.ok ? ok(toPage(result.value, toRecentFood)) : result;
  }
}
