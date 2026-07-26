import type { TaxonomyItemDto } from '@infrastructure/recipes/taxonomy/dtos/taxonomy-item-dto';

/** Response body of `GET /recipes/categories`. */
export interface CategoriesResponseDto {
  categories: TaxonomyItemDto[];
}
