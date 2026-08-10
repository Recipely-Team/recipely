import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RecipeDraftRepositoryInterface } from '@domain/drafts/recipe-draft-repository-interface';

/** Deletes a recipe draft by its id. */
export class DeleteDraftUseCase {
  constructor(private readonly repo: RecipeDraftRepositoryInterface) {}

  execute(id: string): Promise<Result<void, Failure>> {
    return this.repo.deleteDraft(id);
  }
}
