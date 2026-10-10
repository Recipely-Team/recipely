import { useEffect } from 'react';
import { StoreStatus } from '@application/store/store-status';
import { ValueConstants } from '@core/constants';
import { StatsRange } from '@domain/instagram/stats/stats-range';
import { funnelRate } from '@domain/instagram/stats/funnel-rate';
import { useStores } from '@presentation/bootstrap/use-stores';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { t, useLocale } from '@presentation/i18n';

/**
 * The profile's Creator stats line: "Last 30 days · 36 DMs · 50% opened",
 * from the stats store's 30-day answer. Only mounted under a linked account;
 * null — no row — until the answer shows at least one automation.
 */
export const useCreatorStatsLine = (): string | null => {
  const { creatorStatsStore } = useStores();
  const locale = useLocale();
  const state = creatorStatsStore((s) => s.byRange[StatsRange.Month]);

  useEffect(() => {
    void creatorStatsStore.getState().load(StatsRange.Month);
  }, [creatorStatsStore]);

  if (state?.status !== StoreStatus.Loaded || state.stats.posts.length === ValueConstants.zero) return null;
  const { sent, opened } = state.stats.totals;
  return t()
    .creatorStats.profileSub.replace('{s}', formatWholeNumber(sent, locale))
    .replace('{p}', `${funnelRate(opened, sent)}%`);
};
