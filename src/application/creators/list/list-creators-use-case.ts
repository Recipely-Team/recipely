import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { CreatorPage } from '@domain/creators/creator-page';
import type { UserProfileRepositoryInterface } from '@domain/user-profile/user-profile-repository-interface';
import type { ListCreatorsInput } from '@application/creators/list/list-creators-input';

/** One page of the Explore creators strip: approved creators with a published recipe. */
export class ListCreatorsUseCase {
  constructor(private readonly repo: UserProfileRepositoryInterface) {}

  execute(input: ListCreatorsInput): Promise<Result<CreatorPage, Failure>> {
    return this.repo.listCreators(input.page, input.pageSize);
  }
}
