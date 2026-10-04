import type { PageQueryDto } from '@infrastructure/network/paging/page-query-dto';

// Query of `GET /diary/foods/products`; no `category` lists every shelf.
export interface FoodProductsQueryDto extends PageQueryDto {
  category?: string;
}
