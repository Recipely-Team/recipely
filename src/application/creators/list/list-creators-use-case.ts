import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { UserProfileRepositoryInterface } from '@domain/user-profile/user-profile-repository-interface';
import type { Page } from '@domain/common/page';
import type { CreatorSummaryEntity } from '@domain/creators/creator-summary-entity';
import { PageSizes } from '@application/config/page-sizes';

/** One 1-based page of the Explore creators strip, `PageSizes.creators` long: approved creators with a published recipe. */
export class ListCreatorsUseCase {
  constructor(private readonly repo: UserProfileRepositoryInterface) {}

  execute(page: number): Promise<Result<Page<CreatorSummaryEntity>, Failure>> {
    return this.repo.listCreators(page, PageSizes.creators);
  }
}
