import { ok } from '@core/result/result-helpers';
import { InstagramConnection } from '@domain/instagram/connect/instagram-connection';
import { DmRuleEntity } from '@domain/instagram/dm/dm-rule-entity';
import type { DmRuleEntityProps } from '@domain/instagram/dm/dm-rule-entity-props';
import type { InstagramRepositoryInterface } from '@domain/instagram/instagram-repository-interface';
import { pageOf } from '@application/diary/foods/__fixtures__/food-fixtures';

/** A rule for a test, with only the fields the test is about overridden. */
export const dmRuleOf = (overrides: Partial<DmRuleEntityProps> = {}): DmRuleEntity => {
  const created = DmRuleEntity.create({
    id: 'r1', mediaId: 'm1', media: { permalink: null, thumbnailUrl: null, caption: 'Menemen' }, keywords: ['tarif'],
    recipeId: 'rec1', recipe: { id: 'rec1', name: 'Menemen', image: null }, dmText: 'Hi {name} {link}', publicReplyText: null,
    enabled: true, sentCount: 3, createdAt: new Date(2026, 9, 1), ...overrides,
  });
  if (!created.ok) throw new Error(created.failure.message);
  return created.value;
};

/** A connected, active account for a test. */
export const connectionOf = (overrides: { connected?: boolean; status?: 'active' | 'expired' | null; available?: boolean } = {}): InstagramConnection =>
  InstagramConnection.of({
    available: overrides.available ?? true, connected: overrides.connected ?? true, username: 'mertmutfakta',
    status: overrides.status === undefined ? 'active' : overrides.status, tokenExpiresAt: null, connectedAt: null,
  });

/** An Instagram repository answering empty first pages unless the test overrides a method. */
export const fakeInstagramRepository = (): jest.Mocked<InstagramRepositoryInterface> => ({
  getConnection: jest.fn().mockResolvedValue(ok(connectionOf())),
  startLogin: jest.fn().mockResolvedValue(ok('https://www.instagram.com/oauth/authorize')),
  finalize: jest.fn(),
  disconnect: jest.fn().mockResolvedValue(ok(undefined)),
  listMedia: jest.fn().mockResolvedValue(ok(pageOf([]))),
  listRules: jest.fn().mockResolvedValue(ok(pageOf([]))),
  getRule: jest.fn(),
  createRule: jest.fn(),
  updateRule: jest.fn(),
  deleteRule: jest.fn().mockResolvedValue(ok(undefined)),
  listSends: jest.fn().mockResolvedValue(ok(pageOf([]))),
});
