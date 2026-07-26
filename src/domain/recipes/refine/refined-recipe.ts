import type { RecipeEntity } from '@domain/recipes/recipe-entity';

/**
 * Read model returned by the refine flow — NOT an entity: it has no identity of
 * its own and just pairs the refined preview `Recipe` with the AI's
 * natural-language commentary. `summary` / `suggestion` may be absent when the
 * backend predates them.
 */
export interface RefinedRecipe {
  recipe: RecipeEntity;
  /** 1-2 sentence description of what changed, in the user's language. */
  summary?: string;
  /** One short extra tip related to the refinement. */
  suggestion?: string;
}
