import { ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { StatsRange } from '@domain/instagram/stats/stats-range';
import { withHttpVerbs } from '@infrastructure/network/http/__fixtures__/with-http-verbs';
import { InstagramRepository } from '@infrastructure/instagram/instagram-repository';

interface RequestCall {
  method?: string;
  url?: string;
  params?: unknown;
  data?: unknown;
}

const answering = (answer: Result<unknown, unknown>) => {
  const calls: RequestCall[] = [];
  const http = withHttpVerbs(
    jest.fn((config: RequestCall) => {
      calls.push(config);
      return Promise.resolve(answer);
    }),
  );
  return { repo: new InstagramRepository(http), calls };
};

const funnel = { matched: 4, sent: 3, opened: 2, saved: 1 };
const wire = {
  days: 7,
  from: '2026-10-04',
  to: '2026-10-11',
  connected: true,
  totals: funnel,
  previous: funnel,
  daily: [{ day: '2026-10-10', ...funnel }],
  followers: { current: 120, change: 4, trackingSince: '2026-10-01', points: [{ day: '2026-10-10', followers: 120 }] },
  posts: [{ ruleId: 'r1', mediaId: 'm1', thumbnailUrl: null, permalink: 'https://instagram.com/p/x', keywords: ['tarif'], enabled: true, ...funnel }],
};

describe('InstagramRepository — creator stats (backend #390)', () => {
  it('asks for the range in the query and reads the panel', async () => {
    const { repo, calls } = answering(ok(wire));
    const stats = await repo.getStats(StatsRange.Week);
    expect(calls[0]).toMatchObject({ method: 'GET', url: '/me/instagram/stats', params: { days: 7 } });
    expect(stats.ok && [stats.value.days, stats.value.totals.opened, stats.value.posts[0]?.keywords, stats.value.followers.trackingSince]).toEqual([7, 2, ['tarif'], '2026-10-01']);
  });

  it('refuses a range the app does not offer instead of drawing it', async () => {
    const { repo } = answering(ok({ ...wire, days: 14 }));
    const stats = await repo.getStats(StatsRange.Week);
    expect(stats.ok).toBe(false);
  });

  it('reports a DM open without a session route, and a save with the recipe in the body', async () => {
    const { repo, calls } = answering(ok(undefined));
    await repo.recordDmOpen('a1b2');
    await repo.recordDmSave('a1b2', 'recipe-9');
    expect(calls[0]).toMatchObject({ method: 'POST', url: '/instagram/dm-sends/a1b2/open' });
    expect(calls[1]).toMatchObject({ method: 'POST', url: '/me/instagram/dm-sends/a1b2/save', data: { recipeId: 'recipe-9' } });
  });
});
