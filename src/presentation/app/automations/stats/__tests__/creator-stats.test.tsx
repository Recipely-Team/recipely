/* eslint-disable import/first -- jest.mock() must be hoisted above imports */
const mockRouter = { back: jest.fn(), replace: jest.fn(), canGoBack: () => true, push: jest.fn() };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({}),
  useFocusEffect: (callback: () => void) => {
    jest.requireActual<typeof import('react')>('react').useEffect(callback, [callback]);
  },
}));

import { act } from 'react-test-renderer';
import { ok } from '@core/result/result-helpers';
import { StatsRange } from '@domain/instagram/stats/stats-range';
import { configureCreatorStatsStore } from '@application/instagram/stats/creator-stats-store';
import { GetCreatorStatsUseCase } from '@application/instagram/stats/get-creator-stats-use-case';
import { connectionOf, fakeInstagramRepository, statsOf } from '@application/instagram/__fixtures__/instagram-fixtures';
import type { ApplicationStores } from '@application/di/application-stores';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { instagramStoreOf } from '@presentation/base/test-support/instagram-store-of';
import { useCreatorStats } from '@presentation/app/automations/stats/hooks/use-creator-stats';
import { CreatorStatsScreen } from '@presentation/app/automations/stats';
import { StatsViewKind } from '@presentation/app/automations/stats/model/stats-view-kind';
import { niceCeiling } from '@presentation/app/automations/stats/model/nice-ceiling';
import { chartGeometry } from '@presentation/app/automations/stats/model/chart-geometry';

const stores = (connected = true) => {
  const repo = fakeInstagramRepository();
  const instagram = instagramStoreOf(connected ? connectionOf() : connectionOf({ connected: false, status: null }));
  const creatorStatsStore = configureCreatorStatsStore({ getStats: new GetCreatorStatsUseCase(repo) });
  return { repo, value: { instagramStore: instagram.store, creatorStatsStore } as unknown as Partial<ApplicationStores> };
};

const probe = <T,>(hook: () => T, value: Partial<ApplicationStores>): { current: () => T } => {
  const box: { value: T | null } = { value: null };
  const Probe = (): null => {
    box.value = hook();
    return null;
  };
  renderComponent(<Probe />, value);
  return {
    current: () => {
      if (box.value === null) throw new Error('not rendered');
      return box.value;
    },
  };
};

describe('Creator stats', () => {
  beforeEach(() => jest.clearAllMocks());

  it('asks to connect Instagram before anything else, without asking for stats', async () => {
    const s = stores(false);
    const vm = probe(useCreatorStats, s.value);
    await act(async () => undefined);
    expect(vm.current().view).toBe(StatsViewKind.Locked);
    expect(s.repo.getStats).not.toHaveBeenCalled();
  });

  it('loads 30 days and shows the panel; a quiet range offers the next longer one', async () => {
    const s = stores();
    const vm = probe(useCreatorStats, s.value);
    await act(async () => undefined);
    expect(s.repo.getStats).toHaveBeenCalledWith(StatsRange.Month);
    expect(vm.current().view).toBe(StatsViewKind.Stats);
    s.repo.getStats.mockResolvedValue(ok(statsOf({ days: StatsRange.Week, totals: { matched: 0, sent: 0, opened: 0, saved: 0 } })));
    await act(async () => vm.current().setRange(StatsRange.Week));
    expect(vm.current().view).toBe(StatsViewKind.NoSends);
    expect(vm.current().nextRange).toBe(StatsRange.Month);
  });

  it('with no automations at all offers to create the first one', async () => {
    const s = stores();
    s.repo.getStats.mockResolvedValue(ok(statsOf({ posts: [] })));
    const vm = probe(useCreatorStats, s.value);
    await act(async () => undefined);
    expect(vm.current().view).toBe(StatsViewKind.NoAutomations);
    vm.current().onCreate();
    expect(mockRouter.push).toHaveBeenCalledWith('/automations/edit');
  });

  it('draws the loaded panel, and opens a post\'s activity from its row', async () => {
    const s = stores();
    const tree = renderComponent(<CreatorStatsScreen />, s.value);
    await act(async () => undefined);
    const text = JSON.stringify(tree.renderer.toJSON());
    expect(text).toContain('Comments matched'.toUpperCase());
    expect(text).toContain('Instagram followers');
    const row = tree.root.findAll((n) => n.props.accessibilityRole === 'button' && typeof n.props.accessibilityLabel === 'string' && n.props.accessibilityLabel.startsWith('tarif'))[0];
    await act(async () => (row?.props.onPress as () => void)());
    expect(mockRouter.push).toHaveBeenCalledWith('/automations/activity?ruleId=rule-1');
  });
});

describe('the daily chart', () => {
  it('tops out at a round 1, 2 or 5 × 10ⁿ', () => {
    expect([0, 1, 3, 7, 12, 48, 51, 180].map(niceCeiling)).toEqual([1, 1, 5, 10, 20, 50, 100, 200]);
  });

  it('gives each day a slot and keeps scrubbing inside the range', () => {
    const days = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'].map((day, i) => ({ day, matched: i, sent: i, opened: i, saved: 0 }));
    const g = chartGeometry(days, 230, 160);
    expect(g.max).toBe(5);
    expect(g.indexAt(-50)).toBe(0);
    expect(g.indexAt(10_000)).toBe(3);
    expect(g.bars[0]?.height).toBe(0);
  });
});
