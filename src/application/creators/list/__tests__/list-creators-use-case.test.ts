import { NetworkFailure, type Failure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { UserProfileEntity } from '@domain/user-profile/user-profile-entity';
import type { ViewedUserProfile } from '@domain/user-profile/viewed-user-profile';
import type { UserProfileRepositoryInterface } from '@domain/user-profile/user-profile-repository-interface';
import { ListCreatorsUseCase } from '@application/creators/list/list-creators-use-case';
import { PageSizes } from '@application/config/page-sizes';
import { creatorPageOf } from '@application/__fixtures__/creator-page-of';
import { creatorSummaryOf } from '@application/__fixtures__/creator-summary-of';
import type { Page } from '@domain/common/page';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import type { CreatorSummaryEntity } from '@domain/creators/creator-summary-entity';

class StubRepository implements UserProfileRepositoryInterface {
  readonly calls: [number, number][] = [];
  constructor(private readonly result: Result<Page<CreatorSummaryEntity>, Failure>) {}
  getById(): Promise<Result<UserProfileEntity, Failure>> {
    return Promise.resolve(fail(new NetworkFailure('not under test')));
  }
  getViewedProfile(): Promise<Result<ViewedUserProfile, Failure>> {
    return Promise.resolve(fail(new NetworkFailure('not under test')));
  }
  listUserRecipes(): Promise<Result<Page<RecipeSummaryEntity>, Failure>> {
    return Promise.resolve(fail(new NetworkFailure('not under test')));
  }
  follow(): Promise<Result<void, Failure>> {
    return Promise.resolve(fail(new NetworkFailure('not under test')));
  }
  unfollow(): Promise<Result<void, Failure>> {
    return Promise.resolve(fail(new NetworkFailure('not under test')));
  }
  listCreators(page: number, pageSize: number): Promise<Result<Page<CreatorSummaryEntity>, Failure>> {
    this.calls.push([page, pageSize]);
    return Promise.resolve(this.result);
  }
}

describe('ListCreatorsUseCase', () => {
  it('asks the repository for the requested page at the strip size and returns it', async () => {
    const page = creatorPageOf([creatorSummaryOf('1')], { page: 2, pageSize: 20, total: 41 });
    const repo = new StubRepository(ok(page));

    const r = await new ListCreatorsUseCase(repo).execute(2);

    expect(repo.calls).toEqual([[2, PageSizes.creators]]);
    expect(r.ok && r.value).toBe(page);
  });

  it('passes a failure through', async () => {
    const failure = new NetworkFailure('offline');
    const r = await new ListCreatorsUseCase(new StubRepository(fail(failure))).execute(1);
    expect(!r.ok && r.failure).toBe(failure);
  });
});
