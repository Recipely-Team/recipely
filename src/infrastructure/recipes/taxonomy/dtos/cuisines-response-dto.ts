import type { TaxonomyItemDto } from '@infrastructure/recipes/taxonomy/dtos/taxonomy-item-dto';

/** Response body of `GET /recipes/cuisines`. */
export interface CuisinesResponseDto {
  cuisines: TaxonomyItemDto[];
}
