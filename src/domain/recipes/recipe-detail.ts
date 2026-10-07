import type { RecipeEntity } from '@domain/recipes/recipe-entity';

/**
 * A recipe as one viewer opened it: the aggregate plus whether that viewer liked it.
 *
 * @remarks
 * - **Viewer-relative data stays out of the entity** (rule 19): the same recipe is liked by
 *   one reader and not another, so `likedByMe` rides beside it, never inside it.
 */
export interface RecipeDetail {
  readonly recipe: RecipeEntity;
  readonly likedByMe: boolean;
}
