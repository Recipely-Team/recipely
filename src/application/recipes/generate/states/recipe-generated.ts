import type { StoreStatus } from '@application/store/store-status';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';

export interface RecipeGenerated {
  status: typeof StoreStatus.Success;
  recipe: RecipeEntity;
}
