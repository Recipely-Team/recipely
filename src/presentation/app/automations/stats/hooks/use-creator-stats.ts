import { useCallback, useEffect } from 'react';
import { type Href, useFocusEffect, useRouter } from 'expo-router';
import { StoreStatus } from '@application/store/store-status';
import { ValueConstants } from '@core/constants';
import { StatsRange } from '@domain/instagram/stats/stats-range';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { useInstagramConnect } from '@presentation/base/hooks/instagram/use-instagram-connect';
import { AutomationMetrics } from '@presentation/base/widgets/instagram/automation-metrics';
import { RoutePaths } from '@presentation/base/constants';
import { spacing } from '@presentation/base/theme';
import { StatsViewKind } from '@presentation/app/automations/stats/model/stats-view-kind';
import type { UseCreatorStatsResult } from '@presentation/app/automations/stats/model/use-creator-stats-result';

const SIDES = 2;

/**
 * Creator stats (prototype `creator-stats.jsx`): the linked account, then the
 * chosen range's stats — loaded on focus, again on every range switch.
 *
 * @remarks
 * - **The link decides first**, as on Automations: not linked shows Connect,
 *   no Instagram on this server shows Unavailable.
 * - **No automations** and **no sends in the range** are states of a loaded
 *   answer, not errors: the first offers to create one, the second a longer range.
 */
export const useCreatorStats = (): UseCreatorStatsResult => {
  const router = useRouter();
  const { width } = useLayout();
  const { instagramStore, creatorStatsStore } = useStores();
  const connection = instagramStore((s) => s.connection);
  const range = creatorStatsStore((s) => s.range);
  const state = creatorStatsStore((s) => s.byRange[s.range]);
  const { phase, connect } = useInstagramConnect();
  const linked = connection.status === StoreStatus.Loaded ? connection.connection : null;
  const isConnected = linked?.isConnected ?? false;

  useFocusEffect(
    useCallback(() => {
      void instagramStore.getState().load();
    }, [instagramStore]),
  );
  useEffect(() => {
    if (isConnected) void creatorStatsStore.getState().load(range);
  }, [creatorStatsStore, isConnected, range]);

  const stats = state?.status === StoreStatus.Loaded ? state.stats : null;
  const failure = connection.status === StoreStatus.Error ? connection.failure : state?.status === StoreStatus.Error ? state.failure : null;
  const view =
    failure !== null
      ? StatsViewKind.Error
      : linked === null
        ? StatsViewKind.Loading
        : !linked.isAvailable
          ? StatsViewKind.Unavailable
          : !linked.isConnected
            ? StatsViewKind.Locked
            : stats === null
              ? StatsViewKind.Loading
              : stats.posts.length === ValueConstants.zero
                ? StatsViewKind.NoAutomations
                : stats.totals.matched === ValueConstants.zero
                  ? StatsViewKind.NoSends
                  : StatsViewKind.Stats;

  return {
    view,
    stats,
    failure,
    range,
    nextRange: range === StatsRange.Week ? StatsRange.Month : range === StatsRange.Month ? StatsRange.Quarter : null,
    handle: linked?.displayHandle ?? null,
    contentWidth: Math.min(width, AutomationMetrics.pageMaxWidth) - spacing.lg * SIDES,
    phase,
    connect,
    setRange: (days) => creatorStatsStore.getState().setRange(days),
    onBack: () => (router.canGoBack() ? router.back() : router.replace(RoutePaths.automations)),
    onOpenPost: (ruleId) => router.push(RoutePaths.automationActivity(ruleId) as Href),
    onCreate: () => router.push(RoutePaths.automationEdit),
    onViewAutomations: () => router.replace(RoutePaths.automations),
    onRetry: () => {
      if (connection.status === StoreStatus.Error) void instagramStore.getState().load();
      else void creatorStatsStore.getState().load(range);
    },
  };
};
