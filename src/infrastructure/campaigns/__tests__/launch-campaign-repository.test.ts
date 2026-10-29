import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import { LAUNCH_CAMPAIGNS_SEEN_STORAGE_KEY, LAUNCH_CAMPAIGNS_STORAGE_KEY } from '@infrastructure/constants/storage';
import { LaunchCampaignRepository } from '@infrastructure/campaigns/launch-campaign-repository';
import { toLaunchCampaigns } from '@infrastructure/campaigns/to-launch-campaigns';
import type { AxiosHttpClient } from '@infrastructure/network/http/axios-http-client';
import type { KeyValueStoreInterface } from '@domain/storage/key-value-store-interface';

const wire = (overrides: Record<string, unknown> = {}) => ({
  id: 'ramadan',
  variant: 'splash',
  art: 'crescent',
  colorStart: '#0B1437',
  colorEnd: '#3730A3',
  imageUrl: 'https://cdn.test/ramadan.jpg',
  title: 'Ramadan Kareem',
  body: 'Iftar ideas',
  ctaLabel: 'See recipes',
  ctaLink: '/recipes?tag=ramadan',
  startsAt: '2027-02-08T00:00:00.000Z',
  endsAt: '2027-03-10T00:00:00.000Z',
  priority: 1,
  ...overrides,
});

const memoryKv = (seed: Record<string, string> = {}): KeyValueStoreInterface & { data: Map<string, string> } => {
  const data = new Map(Object.entries(seed));
  return {
    data,
    getItem: jest.fn(async (key: string) => ok(data.get(key) ?? null)),
    setItem: jest.fn(async (key: string, value: string) => {
      data.set(key, value);
      return ok(undefined);
    }),
    removeItem: jest.fn(async (key: string) => {
      data.delete(key);
      return ok(undefined);
    }),
  };
};

const AUDIENCE = { platform: 'android', region: 'TR' };

const repoWith = (answer: unknown, kv = memoryKv(), audience: { platform: string; region: string | null } | null = AUDIENCE) => {
  const get = jest.fn().mockResolvedValue(answer);
  const prefetch = jest.fn();
  return { repo: new LaunchCampaignRepository({ get } as unknown as AxiosHttpClient, kv, audience, prefetch), get, prefetch, kv };
};

describe('LaunchCampaignRepository', () => {
  it('asks for this platform and region, caches the answer and prefetches the images', async () => {
    const { repo, get, prefetch, kv } = repoWith(ok({ campaigns: [wire()] }));

    const result = await repo.refresh();

    expect(get).toHaveBeenCalledWith(ApiRoutes.launchCampaigns, { params: AUDIENCE });
    expect(result.ok && result.value.map((campaign) => campaign.id)).toEqual(['ramadan']);
    expect(kv.data.get(LAUNCH_CAMPAIGNS_STORAGE_KEY)).toBe(JSON.stringify({ campaigns: [wire()] }));
    expect(prefetch).toHaveBeenCalledWith(['https://cdn.test/ramadan.jpg']);
  });

  it('a device without a region asks without one', async () => {
    const { repo, get } = repoWith(ok({ campaigns: [] }), memoryKv(), { platform: 'ios', region: null });
    await repo.refresh();
    expect(get).toHaveBeenCalledWith(ApiRoutes.launchCampaigns, { params: { platform: 'ios' } });
  });

  it('reads the cache without any request — the launch path never waits for the network', async () => {
    const kv = memoryKv({ [LAUNCH_CAMPAIGNS_STORAGE_KEY]: JSON.stringify({ campaigns: [wire()] }) });
    const { repo, get } = repoWith(ok({ campaigns: [] }), kv);

    const cached = await repo.cached();

    expect(cached.ok && cached.value[0]?.title).toBe('Ramadan Kareem');
    expect(get).not.toHaveBeenCalled();
  });

  it('a corrupted cache reads as no campaigns, not as a failure', async () => {
    const { repo } = repoWith(ok({}), memoryKv({ [LAUNCH_CAMPAIGNS_STORAGE_KEY]: '{not json' }));
    expect(await repo.cached()).toEqual(ok([]));
  });

  it('keeps the old cache when the refresh fails', async () => {
    const kv = memoryKv({ [LAUNCH_CAMPAIGNS_STORAGE_KEY]: 'previous' });
    const { repo } = repoWith(fail(new NetworkFailure('offline')), kv);
    expect((await repo.refresh()).ok).toBe(false);
    expect(kv.data.get(LAUNCH_CAMPAIGNS_STORAGE_KEY)).toBe('previous');
  });

  it('remembers seen campaigns once each, newest last', async () => {
    const kv = memoryKv({ [LAUNCH_CAMPAIGNS_SEEN_STORAGE_KEY]: JSON.stringify(['a', 'b']) });
    const { repo } = repoWith(ok({}), kv);
    await repo.markSeen('a');
    expect(JSON.parse(kv.data.get(LAUNCH_CAMPAIGNS_SEEN_STORAGE_KEY) ?? '[]')).toEqual(['b', 'a']);
    expect(await repo.seenIds()).toEqual(ok(new Set(['b', 'a'])));
  });

  it('on the web: no request and no campaigns', async () => {
    const { repo, get } = repoWith(ok({ campaigns: [wire()] }), memoryKv(), null);
    expect(await repo.refresh()).toEqual(ok([]));
    expect(await repo.cached()).toEqual(ok([]));
    expect(get).not.toHaveBeenCalled();
  });
});

describe('toLaunchCampaigns', () => {
  it('drops a bad campaign, not the list', () => {
    const result = toLaunchCampaigns({
      campaigns: [
        wire(),
        wire({ id: 'banner', variant: 'banner' }),
        wire({ id: 'untitled', title: '' }),
        wire({ id: 'inverted', endsAt: '2027-01-01T00:00:00.000Z' }),
        wire({ id: 'named-colour', colorStart: 'red' }),
        'not an object',
      ],
    });
    expect(result.ok && result.value.map((campaign) => campaign.id)).toEqual(['ramadan']);
  });

  it('keeps only https images and https or in-app links, and an unknown art draws nothing', () => {
    const result = toLaunchCampaigns({
      campaigns: [wire({ imageUrl: 'http://cdn.test/a.jpg', ctaLink: 'javascript:alert(1)', art: 'fireworks' }), wire({ id: 'b', ctaLink: '//evil.test' })],
    });
    expect(result.ok && result.value[0]).toMatchObject({ imageUrl: null, ctaLink: null, art: 'none' });
    expect(result.ok && result.value[1]?.ctaLink).toBeNull();
  });

  it('fails without a campaign list', () => {
    expect(toLaunchCampaigns({}).ok).toBe(false);
  });
});
