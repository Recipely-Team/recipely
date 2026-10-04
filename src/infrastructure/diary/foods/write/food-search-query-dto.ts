import type { PageQueryDto } from '@infrastructure/network/paging/page-query-dto';

// Query of `GET /diary/foods/search`. `q` is left out for a group listed
// without a query; `group` is left out for the first page of every group.
export interface FoodSearchQueryDto extends PageQueryDto {
  q?: string;
  group?: string;
}
