import { ConflictFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { DmKeywords } from '@domain/instagram/dm/dm-keywords';
import { DmRuleDraft } from '@domain/instagram/dm/dm-rule-draft';
import { DmSendReason } from '@domain/instagram/activity/dm-send-reason';
import { CreatorTagOutcome } from '@domain/instagram/connect/creator-tag-outcome';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import { withHttpVerbs } from '@infrastructure/network/http/__fixtures__/with-http-verbs';
import { InstagramRepository } from '@infrastructure/instagram/instagram-repository';
import { InstagramWireSamples } from '@infrastructure/instagram/__fixtures__/instagram-wire-samples';
import { toDmRuleChangesRequest } from '@infrastructure/instagram/write/to-dm-rule-changes-request';

interface RequestCall {
  method?: string;
  url?: string;
  params?: unknown;
  data?: unknown;
}

const answering = (answer: Result<unknown, unknown>): { http: HttpClient; calls: RequestCall[] } => {
  const calls: RequestCall[] = [];
  const http = withHttpVerbs(
    jest.fn((config: RequestCall) => {
      calls.push(config);
      return Promise.resolve(answer);
    }),
  );
  return { http, calls };
};
const json = (text: string): Result<unknown, never> => ok(JSON.parse(text) as unknown);

describe('InstagramRepository', () => {
  it('reads the connection as the contract sends it, expired included', async () => {
    const { http, calls } = answering(json(InstagramWireSamples.connection));
    const r = await new InstagramRepository(http).getConnection();
    expect(calls[0]).toMatchObject({ method: 'GET', url: '/me/instagram' });
    expect(r.ok && [r.value.isConnected, r.value.isExpired, r.value.displayHandle]).toEqual([true, true, '@mertmutfakta']);
  });

  it('asks for the login URL with the return link, then finalizes with the code', async () => {
    const start = answering(ok({ url: 'https://www.instagram.com/oauth/authorize?x=1' }));
    const url = await new InstagramRepository(start.http).startLogin('recipely://instagram-connected');
    expect(start.calls[0]).toMatchObject({ url: '/auth/instagram/start', params: { returnTo: 'recipely://instagram-connected' } });
    expect(url.ok && url.value).toContain('instagram.com');

    const finalize = answering(json(InstagramWireSamples.finalize));
    const r = await new InstagramRepository(finalize.http).finalize('one-time');
    expect(finalize.calls[0]).toMatchObject({ method: 'POST', url: '/me/instagram/finalize', data: { code: 'one-time' } });
    expect(r.ok && [r.value.creatorTag, r.value.connection.isActive]).toEqual([CreatorTagOutcome.Approved, true]);
  });

  it('passes a finalize conflict through untouched', async () => {
    const failure = new ConflictFailure('linked');
    const r = await new InstagramRepository(answering(fail(failure)).http).finalize('x');
    expect(!r.ok && r.failure).toBe(failure);
  });

  it('puts the requested page in the media, rules and sends queries', async () => {
    const media = answering(json(InstagramWireSamples.mediaPage));
    const page = await new InstagramRepository(media.http).listMedia(2, 9);
    expect(media.calls[0]).toMatchObject({ url: '/me/instagram/media', params: { page: 2, pageSize: 9 } });
    expect(page.ok && [page.value.items.map((m) => m.id), page.value.hasMore]).toEqual([['m1', 'm2'], true]);

    const rules = answering(json(InstagramWireSamples.rulesPage));
    const r = await new InstagramRepository(rules.http).listRules(1, 5);
    expect(rules.calls[0]).toMatchObject({ url: '/me/instagram/rules', params: { page: 1, pageSize: 5 } });
    expect(r.ok && [r.value.items[0]?.recipe?.name, r.value.items[0]?.sentCount, r.value.hasMore]).toEqual(['Menemen', 124, true]);

    const sends = answering(json(InstagramWireSamples.sendsPage));
    const s = await new InstagramRepository(sends.http).listSends('r1', 3, 8);
    expect(sends.calls[0]).toMatchObject({ url: '/me/instagram/rules/r1/sends', params: { page: 3, pageSize: 8 } });
    expect(s.ok && s.value.items.map((send) => send.reason)).toEqual([null, DmSendReason.TooOld]);
  });

  it('creates a rule from a validated draft, patches only what changed, and deletes by id', async () => {
    const draft = DmRuleDraft.validate({ mediaId: 'm1', keywords: DmKeywords.of(['tarif']), recipeId: 'rec1', dmText: 'Hi {name} {link}', publicReplyText: null });
    if (!draft.ok) throw new Error('draft');
    const { http, calls } = answering(json(InstagramWireSamples.rulesPage.replace(/^[^[]*\[/, '').replace(/\][^\]]*$/, '')));
    const repo = new InstagramRepository(http);
    await repo.createRule(draft.value);
    await repo.updateRule('r1', { enabled: false });
    await repo.deleteRule('r1');
    expect(calls[0]).toMatchObject({ method: 'POST', url: '/me/instagram/rules', data: { mediaId: 'm1', keywords: ['tarif'], publicReplyText: null, enabled: true } });
    expect(calls[1]).toMatchObject({ method: 'PATCH', url: '/me/instagram/rules/r1', data: { enabled: false } });
    expect(calls[2]).toMatchObject({ method: 'DELETE', url: '/me/instagram/rules/r1' });
    expect(toDmRuleChangesRequest({ publicReplyText: null })).toEqual({ publicReplyText: null });
  });

  // The post picker came up empty on a device: images arrived with a null thumbnailUrl.
  it('keeps every post — one with no cover and one of a type this build does not know', async () => {
    const media = answering(json(InstagramWireSamples.mediaPage));
    const page = await new InstagramRepository(media.http).listMedia(2, 9);
    if (!page.ok) throw new Error('expected ok');
    expect(page.value.items.map((m) => [m.id, m.mediaType, m.thumbnailUrl])).toEqual([
      ['m1', 'VIDEO', 'https://cdn.test/1.jpg'],
      ['m2', 'IMAGE', null],
    ]);
  });
});
