import { NetworkFailure, type Failure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { CreatorPage } from '@domain/creators/creator-page';
import type { UserProfileEntity } from '@domain/user-profile/user-profile-entity';
import type { UserProfileRepositoryInterface } from '@domain/user-profile/user-profile-repository-interface';
import { ListCreatorsUseCase } from '@application/creators/list/list-creators-use-case';
import { creatorPageOf } from '@application/__fixtures__/creator-page-of';
import { creatorSummaryOf } from '@application/__fixtures__/creator-summary-of';

class StubRepository implements UserProfileRepositoryInterface {
  readonly calls: [number, number][] = [];
  constructor(private readonly result: Result<CreatorPage, Failure>) {}
  getById(): Promise<Result<UserProfileEntity, Failure>> {
    return Promise.resolve(fail(new NetworkFailure('not under test')));
  }
  listCreators(page: number, pageSize: number): Promise<Result<CreatorPage, Failure>> {
    this.calls.push([page, pageSize]);
    return Promise.resolve(this.result);
  }
}

describe('ListCreatorsUseCase', () => {
  it('asks the repository for the requested page and returns it', async () => {
    const page = creatorPageOf([creatorSummaryOf('1')], { page: 2, pageSize: 20, total: 41 });
    const repo = new StubRepository(ok(page));

    const r = await new ListCreatorsUseCase(repo).execute({ page: 2, pageSize: 20 });

    expect(repo.calls).toEqual([[2, 20]]);
    expect(r.ok && r.value).toBe(page);
  });

  it('passes a failure through', async () => {
    const failure = new NetworkFailure('offline');
    const r = await new ListCreatorsUseCase(new StubRepository(fail(failure))).execute({ page: 1, pageSize: 20 });
    expect(!r.ok && r.failure).toBe(failure);
  });
});
