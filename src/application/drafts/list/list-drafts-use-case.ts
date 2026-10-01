import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RecipeDraftRepositoryInterface } from '@domain/drafts/recipe-draft-repository-interface';
import type { ListDraftsInput } from '@application/drafts/list/list-drafts-input';
import type { Page } from '@domain/common/page';
import type { RecipeDraft } from '@domain/drafts/recipe-draft';

/** Lists a page of the authenticated user's recipe drafts. */
export class ListDraftsUseCase {
  constructor(private readonly repo: RecipeDraftRepositoryInterface) {}

  execute(input: ListDraftsInput): Promise<Result<Page<RecipeDraft>, Failure>> {
    return this.repo.listDrafts(input.page, input.pageSize);
  }
}
