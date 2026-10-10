import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import { StoreStatus } from '@application/store/store-status';
import { StatsRange } from '@domain/instagram/stats/stats-range';
import { configureCreatorStatsStore } from '@application/instagram/stats/creator-stats-store';
import { configureDmArrivalStore } from '@application/instagram/stats/dm-arrival-store';
import { GetCreatorStatsUseCase } from '@application/instagram/stats/get-creator-stats-use-case';
import { RecordDmOpenUseCase } from '@application/instagram/stats/record-dm-open-use-case';
import { RecordDmSaveUseCase } from '@application/instagram/stats/record-dm-save-use-case';
import { fakeInstagramRepository, statsOf } from '@application/instagram/__fixtures__/instagram-fixtures';

describe('creatorStatsStore', () => {
  const setup = () => {
    const repo = fakeInstagramRepository();
    return { repo, store: configureCreatorStatsStore({ getStats: new GetCreatorStatsUseCase(repo) }) };
  };

  it('opens on 30 days and keeps each range apart, so a switch to 7 leaves the 30-day answer', async () => {
    const { repo, store } = setup();
    expect(store.getState().range).toBe(StatsRange.Month);
    await store.getState().load(StatsRange.Month);
    repo.getStats.mockResolvedValueOnce(ok(statsOf({ days: StatsRange.Week })));
    store.getState().setRange(StatsRange.Week);
    await Promise.resolve();
    await Promise.resolve();
    expect(store.getState().range).toBe(StatsRange.Week);
    expect(store.getState().byRange[StatsRange.Month]?.status).toBe(StoreStatus.Loaded);
    expect(repo.getStats).toHaveBeenLastCalledWith(StatsRange.Week);
  });

  it('shows an error on a first load, but keeps a loaded range when its refresh fails', async () => {
    const { repo, store } = setup();
    repo.getStats.mockResolvedValueOnce(fail(new NetworkFailure()));
    await store.getState().load(StatsRange.Quarter);
    expect(store.getState().byRange[StatsRange.Quarter]?.status).toBe(StoreStatus.Error);
    await store.getState().load(StatsRange.Quarter);
    repo.getStats.mockResolvedValueOnce(fail(new NetworkFailure()));
    await store.getState().load(StatsRange.Quarter);
    expect(store.getState().byRange[StatsRange.Quarter]?.status).toBe(StoreStatus.Loaded);
  });

  it('drops a late answer that arrives after sign-out', async () => {
    const { repo, store } = setup();
    let resolve: (value: ReturnType<typeof ok>) => void = () => undefined;
    repo.getStats.mockReturnValueOnce(new Promise((r) => (resolve = r)) as never);
    const loading = store.getState().load(StatsRange.Month);
    store.getState().clear();
    resolve(ok(statsOf()));
    await loading;
    expect(store.getState().byRange).toEqual({});
  });
});

describe('dmArrivalStore', () => {
  const setup = () => {
    const repo = fakeInstagramRepository();
    return { repo, store: configureDmArrivalStore({ recordOpen: new RecordDmOpenUseCase(repo), recordSave: new RecordDmSaveUseCase(repo) }) };
  };

  it('reports an open once per DM, however often the recipe is revisited', () => {
    const { repo, store } = setup();
    store.getState().arrive('recipe-1', 'send-1');
    store.getState().arrive('recipe-1', 'send-1');
    expect(repo.recordDmOpen).toHaveBeenCalledTimes(1);
    expect(repo.recordDmOpen).toHaveBeenCalledWith('send-1');
  });

  it('reports a save only for a recipe reached through a DM, and only once', () => {
    const { repo, store } = setup();
    store.getState().saved('recipe-1');
    expect(repo.recordDmSave).not.toHaveBeenCalled();
    store.getState().arrive('recipe-1', 'send-1');
    store.getState().saved('recipe-2');
    store.getState().saved('recipe-1');
    store.getState().saved('recipe-1');
    expect(repo.recordDmSave).toHaveBeenCalledTimes(1);
    expect(repo.recordDmSave).toHaveBeenCalledWith('send-1', 'recipe-1');
  });
});
