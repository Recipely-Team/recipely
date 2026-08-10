import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RecipeDraft } from '@domain/drafts/recipe-draft';
import type { RecipeDraftRepositoryInterface } from '@domain/drafts/recipe-draft-repository-interface';

/** Fetches a single recipe draft by its id. */
export class GetDraftUseCase {
  constructor(private readonly repo: RecipeDraftRepositoryInterface) {}

  execute(id: string): Promise<Result<RecipeDraft, Failure>> {
    return this.repo.getDraft(id);
  }
}
