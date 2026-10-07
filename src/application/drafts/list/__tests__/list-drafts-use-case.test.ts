import { FakeRecipeDraftRepository } from '@application/__fixtures__/fake-recipe-draft-repository';
import { ListDraftsUseCase } from '@application/drafts/list/list-drafts-use-case';
import { UnknownFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Page } from '@domain/common/page';
import type { RecipeDraft } from '@domain/drafts/recipe-draft';
import { PageSizes } from '@application/config/page-sizes';

const emptyPage: Page<RecipeDraft> = { items: [], total: 0, page: 1, pageSize: 20, hasMore: false };

describe('ListDraftsUseCase.execute', () => {
  it('forwards the page with the drafts page size and returns its page', async () => {
    const repo = new FakeRecipeDraftRepository({ listDraftsResult: ok(emptyPage) });
    const useCase = new ListDraftsUseCase(repo);

    const r = await useCase.execute(3);

    expect(repo.lastListCall).toEqual({ page: 3, pageSize: PageSizes.drafts });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(emptyPage);
  });

  it('forwards a repository failure unchanged', async () => {
    const failure = new UnknownFailure('boom');
    const repo = new FakeRecipeDraftRepository({ listDraftsResult: fail(failure) });
    const useCase = new ListDraftsUseCase(repo);

    const r = await useCase.execute(1);

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.failure).toBe(failure);
  });
});
