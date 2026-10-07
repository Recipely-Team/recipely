import { NetworkFailure, type Failure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { StoreStatus } from '@application/store/store-status';
import { configureCreatorsStore } from '@application/creators/creators-store';
import type { ListCreatorsUseCase } from '@application/creators/list/list-creators-use-case';
import type { ListCreatorsInput } from '@application/creators/list/list-creators-input';
import { creatorPageOf } from '@application/__fixtures__/creator-page-of';
import { creatorSummaryOf } from '@application/__fixtures__/creator-summary-of';
import { PageSizes } from '@application/config/page-sizes';
import type { Page } from '@domain/common/page';
import type { CreatorSummaryEntity } from '@domain/creators/creator-summary-entity';

type Answer = Result<Page<CreatorSummaryEntity>, Failure>;

/** A list use case whose answers the test releases one by one. */
const deferredList = () => {
  const calls: ListCreatorsInput[] = [];
  const pending: ((answer: Answer) => void)[] = [];
  const listCreators = {
    execute: (input: ListCreatorsInput) => {
      calls.push(input);
      return new Promise<Answer>((resolve) => pending.push(resolve));
    },
  } as unknown as ListCreatorsUseCase;
  return { listCreators, calls, answer: (i: number, a: Answer) => pending[i](a) };
};

const immediateList = (...answers: Answer[]) => {
  const calls: ListCreatorsInput[] = [];
  const listCreators = {
    execute: (input: ListCreatorsInput) => {
      calls.push(input);
      return Promise.resolve(answers[Math.min(calls.length - 1, answers.length - 1)]);
    },
  } as unknown as ListCreatorsUseCase;
  return { listCreators, calls };
};

const ids = (store: ReturnType<typeof configureCreatorsStore>): string[] =>
  store.getState().creators.map((c) => c.id);

describe('creators store', () => {
  it('starts idle and empty', () => {
    const store = configureCreatorsStore(immediateList(ok(creatorPageOf([]))));
    expect(store.getState().listState).toEqual({ status: StoreStatus.Idle });
    expect(store.getState().creators).toEqual([]);
  });

  it('load shows Loading, then the first page', async () => {
    const list = deferredList();
    const store = configureCreatorsStore(list);

    const loading = store.getState().load();
    expect(store.getState().listState.status).toBe(StoreStatus.Loading);
    list.answer(0, ok(creatorPageOf([creatorSummaryOf('1'), creatorSummaryOf('2')], { total: 30, pageSize: 20 })));
    await loading;

    expect(list.calls).toEqual([{ page: 1, pageSize: PageSizes.creators }]);
    expect(ids(store)).toEqual(['1', '2']);
    expect(store.getState().listState).toEqual({ status: StoreStatus.Loaded, page: 1, hasMore: true });
  });

  it('load is a no-op once loaded', async () => {
    const list = immediateList(ok(creatorPageOf([creatorSummaryOf('1')])));
    const store = configureCreatorsStore(list);

    await store.getState().load();
    await store.getState().load();

    expect(list.calls).toHaveLength(1);
  });

  it('a failed first load reports the failure', async () => {
    const failure = new NetworkFailure('offline');
    const store = configureCreatorsStore(immediateList(fail(failure)));

    await store.getState().load();

    expect(store.getState().listState).toEqual({ status: StoreStatus.Error, failure });
  });

  it('refresh replaces the rows without showing Loading over a loaded strip', async () => {
    const list = deferredList();
    const store = configureCreatorsStore(list);
    const first = store.getState().load();
    list.answer(0, ok(creatorPageOf([creatorSummaryOf('1')])));
    await first;

    const refreshing = store.getState().refresh();
    expect(store.getState().listState.status).toBe(StoreStatus.Loaded);
    list.answer(1, ok(creatorPageOf([creatorSummaryOf('9')])));
    await refreshing;

    expect(ids(store)).toEqual(['9']);
  });

  it('a failed refresh keeps the rows already shown', async () => {
    const store = configureCreatorsStore(
      immediateList(ok(creatorPageOf([creatorSummaryOf('1')])), fail(new NetworkFailure('offline'))),
    );
    await store.getState().load();

    await store.getState().refresh();

    expect(ids(store)).toEqual(['1']);
    expect(store.getState().listState.status).toBe(StoreStatus.Loaded);
  });

  it('loadMore asks for the next page and appends it', async () => {
    const list = immediateList(
      ok(creatorPageOf([creatorSummaryOf('1')], { page: 1, pageSize: 1, total: 2 })),
      ok(creatorPageOf([creatorSummaryOf('2')], { page: 2, pageSize: 1, total: 2 })),
    );
    const store = configureCreatorsStore(list);
    await store.getState().load();

    await store.getState().loadMore();

    expect(list.calls[1]).toEqual({ page: 2, pageSize: PageSizes.creators });
    expect(ids(store)).toEqual(['1', '2']);
    expect(store.getState().listState).toEqual({ status: StoreStatus.Loaded, page: 2, hasMore: false });
  });

  it('loadMore does nothing when there is no next page', async () => {
    const list = immediateList(ok(creatorPageOf([creatorSummaryOf('1')])));
    const store = configureCreatorsStore(list);
    await store.getState().load();

    await store.getState().loadMore();

    expect(list.calls).toHaveLength(1);
  });

  it('a failed loadMore keeps the rows and stops spinning', async () => {
    const store = configureCreatorsStore(
      immediateList(
        ok(creatorPageOf([creatorSummaryOf('1')], { pageSize: 1, total: 5 })),
        fail(new NetworkFailure('offline')),
      ),
    );
    await store.getState().load();

    await store.getState().loadMore();

    expect(ids(store)).toEqual(['1']);
    expect(store.getState().listState).toEqual({
      status: StoreStatus.Loaded,
      page: 1,
      hasMore: true,
      isLoadingMore: false,
    });
  });

  it('drops a next page that lands after a refresh started', async () => {
    const list = deferredList();
    const store = configureCreatorsStore(list);
    const first = store.getState().load();
    list.answer(0, ok(creatorPageOf([creatorSummaryOf('1')], { pageSize: 1, total: 5 })));
    await first;

    const more = store.getState().loadMore();
    const refreshing = store.getState().refresh();
    list.answer(2, ok(creatorPageOf([creatorSummaryOf('7')], { pageSize: 1, total: 5 })));
    await refreshing;
    list.answer(1, ok(creatorPageOf([creatorSummaryOf('2')], { page: 2, pageSize: 1, total: 5 })));
    await more;

    expect(ids(store)).toEqual(['7']);
    expect(store.getState().listState).toEqual({ status: StoreStatus.Loaded, page: 1, hasMore: true });
  });
});
