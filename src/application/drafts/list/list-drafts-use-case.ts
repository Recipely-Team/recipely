import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { RecipeDraftRepositoryInterface } from '@domain/drafts/recipe-draft-repository-interface';
import type { Page } from '@domain/common/page';
import type { RecipeDraft } from '@domain/drafts/recipe-draft';
import { PageSizes } from '@application/config/page-sizes';

/** Lists one page of the authenticated user's recipe drafts; the page size is the drafts list's own. */
export class ListDraftsUseCase {
  constructor(private readonly repo: RecipeDraftRepositoryInterface) {}

  execute(page: number): Promise<Result<Page<RecipeDraft>, Failure>> {
    return this.repo.listDrafts(page, PageSizes.drafts);
  }
}
