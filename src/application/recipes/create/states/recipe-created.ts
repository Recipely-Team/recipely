import type { StoreStatus } from '@application/store/store-status';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';

export interface RecipeCreated {
  status: typeof StoreStatus.Success;
  recipe: RecipeEntity;
}
