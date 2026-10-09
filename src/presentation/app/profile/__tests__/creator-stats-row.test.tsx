/* eslint-disable import/first -- jest.mock() must be hoisted above imports */
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

import { act } from 'react-test-renderer';
import { ok } from '@core/result/result-helpers';
import { configureCreatorStatsStore } from '@application/instagram/stats/creator-stats-store';
import { GetCreatorStatsUseCase } from '@application/instagram/stats/get-creator-stats-use-case';
import { fakeInstagramRepository, statsOf } from '@application/instagram/__fixtures__/instagram-fixtures';
import type { ApplicationStores } from '@application/di/application-stores';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { CreatorStatsRow } from '@presentation/app/profile/body/creator-stats-row';

const render = async (stats = statsOf()) => {
  const repo = fakeInstagramRepository();
  repo.getStats.mockResolvedValue(ok(stats));
  const creatorStatsStore = configureCreatorStatsStore({ getStats: new GetCreatorStatsUseCase(repo) });
  const tree = renderComponent(<CreatorStatsRow />, { creatorStatsStore } as unknown as Partial<ApplicationStores>);
  await act(async () => undefined);
  return tree;
};

describe('Profile — Creator stats row', () => {
  it("sums up the last 30 days and opens the stats", async () => {
    const tree = await render();
    expect(JSON.stringify(tree.renderer.toJSON())).toContain('Last 30 days · 36 DMs · 50% opened');
    const button = tree.root.findAll((n) => n.props.accessibilityRole === 'button')[0];
    await act(async () => (button?.props.onPress as () => void)());
    expect(mockPush).toHaveBeenCalledWith('/automations/stats');
  });

  it('stays hidden until there is at least one automation', async () => {
    const tree = await render(statsOf({ posts: [] }));
    expect(tree.root.findAll((n) => n.props.accessibilityRole === 'button')).toHaveLength(0);
  });
});
