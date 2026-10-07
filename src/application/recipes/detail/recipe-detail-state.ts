import type { Failure } from '@core/failure';
import type { StoreStatus } from '@application/store/store-status';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';

export type RecipeDetailState =
  | { status: typeof StoreStatus.Idle }
  | { status: typeof StoreStatus.Loading }
  /**
   * `fetchedAt` (epoch ms) dates `likedByMe`: when the server last said it. A screen
   * re-entered from the cache renders a like read BEFORE the user's last tap, and the
   * like overlay uses this to refuse being rewound by it. `put` keeps the cached age.
   */
  | { status: typeof StoreStatus.Loaded; recipe: RecipeEntity; likedByMe: boolean; fetchedAt: number }
  | { status: typeof StoreStatus.Error; failure: Failure };
