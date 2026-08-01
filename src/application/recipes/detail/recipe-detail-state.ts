import type { Failure } from '@core/failure';
import type { StoreStatus } from '@application/store/store-status';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';

export type RecipeDetailState =
  | { status: typeof StoreStatus.Idle }
  | { status: typeof StoreStatus.Loading }
  /**
   * `fetchedAt` (epoch ms) dates the payload. A screen re-entered from the
   * cache renders a recipe that was read BEFORE the user's last like, and the
   * like overlay uses this to refuse being rewound by it.
   */
  | { status: typeof StoreStatus.Loaded; recipe: RecipeEntity; fetchedAt: number }
  | { status: typeof StoreStatus.Error; failure: Failure };
