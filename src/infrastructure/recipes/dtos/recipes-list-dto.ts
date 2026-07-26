import type { RecipeListItemDto } from '@infrastructure/recipes/dtos/recipe-list-item-dto';

// Recipely paged envelope. Replaces DummyJSON's { recipes, total, skip, limit }.
// Used only by the list/my-recipes/trending endpoints, which return the lean
// `RecipeListItemDto` shape (backend commit 3c9106b) — the full `RecipeDto` is
// reserved for the single recipe detail endpoint.
export interface RecipesListDto {
  items: RecipeListItemDto[];
  total: number;
  page: number;
  pageSize: number;
}
