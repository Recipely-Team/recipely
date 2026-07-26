import type { RecipeDto } from '@infrastructure/recipes/dtos/recipe-dto';

// Wire shape returned by `POST /recipes/refine`: the recipe DTO fields with two
// natural-language fields flattened on top of the recipe payload (not nested).
// Both are optional to stay tolerant of an older backend that omits them.
// Keep in sync with recipely-backend `application/recipes/dtos`.
export interface RefineRecipeResponseDto extends RecipeDto {
  /** 1-2 sentence description of what changed, in the user's language. */
  summary?: string;
  /** One short extra tip related to the refinement. */
  suggestion?: string;
}
