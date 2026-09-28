import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { PublishOutcome } from '@domain/recipes/publishing/publish-outcome';
import type { RecipeRepositoryInterface } from '@domain/recipes/recipe-repository-interface';

/**
 * Offers a private recipe for publishing.
 *
 * @remarks
 * - **The answer is the moderator's**, not a yes: approved goes public, pending
 *   waits for review, rejected stays private for good.
 * - **A website import can be refused outright** (`publish_blocked_copyright`)
 *   until it carries the owner's own photo and wording.
 */
export class PublishRecipeUseCase {
  constructor(private readonly repo: RecipeRepositoryInterface) {}

  execute(id: string): Promise<Result<PublishOutcome, Failure>> {
    return this.repo.publishRecipe(id);
  }
}
