import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RecipeDraft } from '@domain/drafts/recipe-draft';
import type { RecipeDraftRepositoryInterface } from '@domain/drafts/recipe-draft-repository-interface';

/**
 * Loads the user's most recently updated draft. Resolves to `ok(null)` when the
 * user has no drafts (the repository maps the backend 404 to "no draft").
 */
export class GetLatestDraftUseCase {
  constructor(private readonly repo: RecipeDraftRepositoryInterface) {}

  execute(): Promise<Result<RecipeDraft | null, Failure>> {
    return this.repo.getLatestDraft();
  }
}
