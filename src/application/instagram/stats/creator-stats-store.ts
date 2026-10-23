import { createStore } from 'zustand/vanilla';
import type { StoreApi } from 'zustand/vanilla';
import { StoreStatus } from '@application/store/store-status';
import { RequestEpoch } from '@application/store/request-epoch';
import { StatsRange, type StatsRangeType } from '@domain/instagram/stats/stats-range';
import type { CreatorStatsStore } from '@application/instagram/stats/creator-stats-store-contract';
import type { GetCreatorStatsUseCase } from '@application/instagram/stats/get-creator-stats-use-case';

interface CreatorStatsStoreDeps {
  getStats: GetCreatorStatsUseCase;
}

/**
 * **Creator stats** (backend #390), one answer per range.
 *
 * @remarks
 * - **Each range has its own epoch**: a slow 90-day answer never overwrites a
 *   newer one for 90, and never touches 7 or 30.
 * - **A failed refresh keeps a loaded range**; only a first load shows the error.
 * - **User-scoped**: cleared on sign-out.
 */
export const configureCreatorStatsStore = (deps: CreatorStatsStoreDeps): StoreApi<CreatorStatsStore> => {
  const epochs = new Map<StatsRangeType, RequestEpoch>();
  const epochOf = (days: StatsRangeType): RequestEpoch => {
    const found = epochs.get(days);
    if (found !== undefined) return found;
    const made = new RequestEpoch();
    epochs.set(days, made);
    return made;
  };

  return createStore<CreatorStatsStore>((set, get) => {
    const put = (days: StatsRangeType, state: CreatorStatsStore['byRange'][StatsRangeType]): void =>
      set({ byRange: { ...get().byRange, [days]: state } });

    const load = async (days: StatsRangeType): Promise<void> => {
      const isCurrent = epochOf(days).start();
      const wasLoaded = get().byRange[days]?.status === StoreStatus.Loaded;
      if (!wasLoaded) put(days, { status: StoreStatus.Loading });
      const result = await deps.getStats.execute(days);
      if (!isCurrent()) return;
      if (result.ok) put(days, { status: StoreStatus.Loaded, stats: result.value });
      else if (!wasLoaded) put(days, { status: StoreStatus.Error, failure: result.failure });
    };

    return {
      range: StatsRange.Month,
      byRange: {},
      setRange: (days) => {
        set({ range: days });
        void load(days);
      },
      load,
      clear: () => {
        for (const epoch of epochs.values()) epoch.invalidate();
        set({ range: StatsRange.Month, byRange: {} });
      },
    };
  });
};
