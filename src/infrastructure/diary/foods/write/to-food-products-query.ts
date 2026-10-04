import type { RequestMapper } from '@core/mapper/request-mapper';
import type { FoodProductsQueryDto } from '@infrastructure/diary/foods/write/food-products-query-dto';
import { toPageQuery } from '@infrastructure/network/paging/to-page-query';

/** What a products caller knows. */
interface FoodProductsRequest {
  category: string | null;
  page: number;
  pageSize: number;
}

/** A shelf and a page → `GET /diary/foods/products` query. */
export const toFoodProductsQuery: RequestMapper<FoodProductsRequest, FoodProductsQueryDto> = ({ category, page, pageSize }) => ({
  ...(category === null ? {} : { category }),
  ...toPageQuery({ page, pageSize }),
});
