import type { Failure } from '@core/failure';
import type { StoreStatus } from '@application/store/store-status';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';

export type GenerateRecipeState =
  | { status: typeof StoreStatus.Idle }
  | { status: typeof StoreStatus.Generating }
  | { status: typeof StoreStatus.Success; recipe: RecipeEntity }
  | { status: typeof StoreStatus.Error; failure: Failure };
