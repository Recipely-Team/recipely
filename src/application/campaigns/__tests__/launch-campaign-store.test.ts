import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import { configureLaunchCampaignStore } from '@application/campaigns/launch-campaign-store';
import { PickLaunchCampaignUseCase } from '@application/campaigns/pick-launch-campaign-use-case';
import { RefreshLaunchCampaignsUseCase } from '@application/campaigns/refresh-launch-campaigns-use-case';
import { DismissLaunchCampaignUseCase } from '@application/campaigns/dismiss-launch-campaign-use-case';
import type { LaunchCampaign } from '@domain/campaigns/launch-campaign';
import type { LaunchCampaignRepositoryInterface } from '@domain/campaigns/launch-campaign-repository-interface';

const NOW = Date.parse('2027-02-10T12:00:00Z');

const campaign: LaunchCampaign = {
  id: 'ramadan',
  variant: 'dialog',
  art: 'crescent',
  colorStart: '#0B1437',
  colorEnd: '#3730A3',
  imageUrl: null,
  title: 'Ramadan Kareem',
  body: '',
  ctaLabel: null,
  ctaLink: null,
  startsAtMs: NOW - 1000,
  endsAtMs: NOW + 1000,
  priority: 0,
};

const storeWith = (repo: Partial<LaunchCampaignRepositoryInterface>) => {
  const full: LaunchCampaignRepositoryInterface = {
    cached: jest.fn(async () => ok([campaign])),
    refresh: jest.fn(async () => ok([])),
    seenIds: jest.fn(async () => ok(new Set<string>())),
    markSeen: jest.fn(async () => ok(undefined)),
    ...repo,
  };
  const store = configureLaunchCampaignStore({
    pickLaunchCampaign: new PickLaunchCampaignUseCase(full, () => NOW),
    refreshLaunchCampaigns: new RefreshLaunchCampaignsUseCase(full),
    dismissLaunchCampaign: new DismissLaunchCampaignUseCase(full),
  });
  return { store, repo: full };
};

describe('launch campaign store', () => {
  it('picks from the cache first, then refreshes the cache for the next launch', async () => {
    const order: string[] = [];
    const { store } = storeWith({
      cached: jest.fn(async () => {
        order.push('cached');
        return ok([campaign]);
      }),
      refresh: jest.fn(async () => {
        order.push('refresh');
        return ok([]);
      }),
    });

    await store.getState().prepare();

    expect(store.getState().state).toEqual({ status: 'ready', campaign });
    expect(order).toEqual(['cached', 'refresh']);
  });

  it('prepares once per app start — returning to the foreground is not a launch', async () => {
    const { store, repo } = storeWith({});
    await store.getState().prepare();
    await store.getState().prepare();
    expect(repo.cached).toHaveBeenCalledTimes(1);
  });

  it('an offline refresh changes nothing about this launch', async () => {
    const { store } = storeWith({ refresh: jest.fn(async () => fail(new NetworkFailure('offline'))) });
    await store.getState().prepare();
    expect(store.getState().state.status).toBe('ready');
  });

  it('a dismissal hides it and remembers it as seen', async () => {
    const { store, repo } = storeWith({});
    await store.getState().prepare();
    await store.getState().dismiss();
    expect(store.getState().state.status).toBe('none');
    expect(repo.markSeen).toHaveBeenCalledWith('ramadan');
  });

  it('a seen campaign is not picked again', async () => {
    const { store } = storeWith({ seenIds: jest.fn(async () => ok(new Set(['ramadan']))) });
    await store.getState().prepare();
    expect(store.getState().state.status).toBe('none');
  });
});
