import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';

/** Repository port for toggling recipe likes. */
export interface LikeRepositoryInterface {
  like(recipeId: string): Promise<Result<void, Failure>>;
  unlike(recipeId: string): Promise<Result<void, Failure>>;
}
