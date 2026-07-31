import { type Failure, UnknownFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { RecipeDraft } from '@domain/drafts/recipe-draft';
import type { RecipeDraftRepositoryInterface } from '@domain/drafts/recipe-draft-repository-interface';
import type { PagedDrafts } from '@domain/drafts/paged-drafts';
import type { UpsertDraftInput } from '@domain/drafts/upsert-draft-input';
import type { FakeRecipeDraftRepositoryConfig } from '@application/__fixtures__/fake-recipe-draft-repository-config';
import type { ListDraftsCall } from '@application/__fixtures__/list-drafts-call';
import { ValueConstants } from '@core/constants';

/**
 * In-memory test double for `RecipeDraftRepositoryInterface`. Returns pre-configured
 * `Result` values and records call arguments / counts so tests can assert on
 * invocation details without a spy framework.
 */
export class FakeRecipeDraftRepository implements RecipeDraftRepositoryInterface {
  lastListCall: ListDraftsCall | null = null;
  listCallCount = ValueConstants.zero;
  getLatestCallCount = ValueConstants.zero;
  lastGetDraftId: string | null = null;
  getDraftCallCount = ValueConstants.zero;
  lastUpsertInput: UpsertDraftInput | null = null;
  upsertCallCount = ValueConstants.zero;
  lastDeleteId: string | null = null;
  deleteCallCount = ValueConstants.zero;

  constructor(private readonly config: FakeRecipeDraftRepositoryConfig = {}) {}

  listDrafts(page: number, pageSize: number): Promise<Result<PagedDrafts, Failure>> {
    this.lastListCall = { page, pageSize };
    this.listCallCount += 1;
    return Promise.resolve(
      this.config.listDraftsResult ?? fail(new UnknownFailure('not configured')),
    );
  }

  getLatestDraft(): Promise<Result<RecipeDraft | null, Failure>> {
    this.getLatestCallCount += 1;
    return Promise.resolve(this.config.getLatestDraftResult ?? ok(null));
  }

  getDraft(id: string): Promise<Result<RecipeDraft, Failure>> {
    this.lastGetDraftId = id;
    this.getDraftCallCount += 1;
    return Promise.resolve(
      this.config.getDraftResult ?? fail(new UnknownFailure('not configured')),
    );
  }

  upsertDraft(input: UpsertDraftInput): Promise<Result<RecipeDraft, Failure>> {
    this.lastUpsertInput = input;
    this.upsertCallCount += 1;
    return Promise.resolve(
      this.config.upsertDraftResult ?? fail(new UnknownFailure('not configured')),
    );
  }

  deleteDraft(id: string): Promise<Result<void, Failure>> {
    this.lastDeleteId = id;
    this.deleteCallCount += 1;
    return Promise.resolve(this.config.deleteDraftResult ?? ok(undefined));
  }
}
