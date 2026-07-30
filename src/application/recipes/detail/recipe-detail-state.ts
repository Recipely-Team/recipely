import type { Failure } from '@core/failure';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';

export type RecipeDetailState =
  | { status: 'idle' }
  | { status: 'loading' }
  /**
   * `fetchedAt` (epoch ms) dates the payload. A screen re-entered from the
   * cache renders a recipe that was read BEFORE the user's last like, and the
   * like overlay uses this to refuse being rewound by it.
   */
  | { status: 'loaded'; recipe: RecipeEntity; fetchedAt: number }
  | { status: 'error'; failure: Failure };
