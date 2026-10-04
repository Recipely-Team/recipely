import { NetworkFailure, NotFoundFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { StoreStatus } from '@application/store/store-status';
import type { DmRuleEntity } from '@domain/instagram/dm/dm-rule-entity';
import { CreatorTagOutcome } from '@domain/instagram/connect/creator-tag-outcome';
import type { InstagramMedia } from '@domain/instagram/instagram-media';
import { configureInstagramStore } from '@application/instagram/instagram-store';
import { configureAutomationsStore } from '@application/instagram/automations-store';
import { GetInstagramConnectionUseCase } from '@application/instagram/connect/get-instagram-connection-use-case';
import { StartInstagramLoginUseCase } from '@application/instagram/connect/start-instagram-login-use-case';
import { FinalizeInstagramLinkUseCase } from '@application/instagram/connect/finalize-instagram-link-use-case';
import { DisconnectInstagramUseCase } from '@application/instagram/connect/disconnect-instagram-use-case';
import { ListDmRulesUseCase } from '@application/instagram/rules/list-dm-rules-use-case';
import { GetDmRuleUseCase } from '@application/instagram/rules/get-dm-rule-use-case';
import { SaveDmRuleUseCase } from '@application/instagram/rules/save-dm-rule-use-case';
import { SetDmRuleEnabledUseCase } from '@application/instagram/rules/set-dm-rule-enabled-use-case';
import { DeleteDmRuleUseCase } from '@application/instagram/rules/delete-dm-rule-use-case';
import { ListInstagramMediaUseCase } from '@application/instagram/rules/list-instagram-media-use-case';
import { ListDmSendsUseCase } from '@application/instagram/activity/list-dm-sends-use-case';
import { SearchRecipeGroupUseCase } from '@application/diary/foods/search/search-recipe-group-use-case';
import { fakeFoodCatalogRepository, pageOf } from '@application/diary/foods/__fixtures__/food-fixtures';
import { connectionOf, dmRuleOf, fakeInstagramRepository } from '@application/instagram/__fixtures__/instagram-fixtures';

const automations = () => {
  const repo = fakeInstagramRepository();
  const foods = fakeFoodCatalogRepository();
  const store = configureAutomationsStore({
    listRules: new ListDmRulesUseCase(repo),
    getRule: new GetDmRuleUseCase(repo),
    saveRule: new SaveDmRuleUseCase(repo),
    setEnabled: new SetDmRuleEnabledUseCase(repo),
    deleteRule: new DeleteDmRuleUseCase(repo),
    listMedia: new ListInstagramMediaUseCase(repo),
    listSends: new ListDmSendsUseCase(repo),
    searchMyRecipes: new SearchRecipeGroupUseCase(foods),
  });
  return { repo, foods, store };
};

const enabledIn = (store: ReturnType<typeof automations>['store']): boolean | null => {
  const rules = store.getState().rules;
  return rules.status === StoreStatus.Loaded ? (rules.items[0]?.enabled ?? null) : null;
};

describe('instagramStore', () => {
  const setup = () => {
    const repo = fakeInstagramRepository();
    const store = configureInstagramStore({ enabled: true,
      getConnection: new GetInstagramConnectionUseCase(repo),
      startLogin: new StartInstagramLoginUseCase(repo),
      finalize: new FinalizeInstagramLinkUseCase(repo),
      disconnect: new DisconnectInstagramUseCase(repo),
    });
    return { repo, store };
  };

  it('finalizes with the code and shows the new connection', async () => {
    const { repo, store } = setup();
    repo.finalize.mockResolvedValue(ok({ connection: connectionOf(), creatorTag: CreatorTagOutcome.Approved }));
    const r = await store.getState().finalize('one-time');
    expect(repo.finalize).toHaveBeenCalledWith('one-time');
    expect(r.ok && r.value.creatorTag).toBe(CreatorTagOutcome.Approved);
    const c = store.getState().connection;
    expect(c.status === StoreStatus.Loaded && c.connection.isActive).toBe(true);
  });

  it('does not let a read that started before a finalize overwrite it', async () => {
    const { repo, store } = setup();
    let answerRead: (r: Result<ReturnType<typeof connectionOf>, NetworkFailure>) => void = () => undefined;
    repo.getConnection.mockReturnValueOnce(new Promise((r) => (answerRead = r)));
    repo.finalize.mockResolvedValue(ok({ connection: connectionOf(), creatorTag: CreatorTagOutcome.Approved }));
    const read = store.getState().load();
    await store.getState().finalize('x');
    answerRead(ok(connectionOf({ connected: false, status: null })));
    await read;
    const c = store.getState().connection;
    expect(c.status === StoreStatus.Loaded && c.connection.isConnected).toBe(true);
  });

  it('reloads after a disconnect', async () => {
    const { repo, store } = setup();
    repo.getConnection.mockResolvedValue(ok(connectionOf({ connected: false, status: null })));
    await store.getState().disconnect();
    const c = store.getState().connection;
    expect(c.status === StoreStatus.Loaded && c.connection.isConnected).toBe(false);
  });
});

describe('automationsStore', () => {
  it('pages the rules with the named page size', async () => {
    const { repo, store } = automations();
    repo.listRules.mockResolvedValue(ok(pageOf([dmRuleOf()], 1, 6, 5)));
    await store.getState().loadRules();
    await store.getState().loadMoreRules();
    expect(repo.listRules.mock.calls).toEqual([[1, 5], [2, 5]]);
  });

  it('flips a switch at once and puts it back when the server refuses', async () => {
    const { repo, store } = automations();
    repo.listRules.mockResolvedValue(ok(pageOf([dmRuleOf({ enabled: true })])));
    await store.getState().loadRules();
    let refuse: (r: Result<DmRuleEntity, NetworkFailure>) => void = () => undefined;
    repo.updateRule.mockReturnValueOnce(new Promise((r) => (refuse = r)));
    const flip = store.getState().setEnabled(dmRuleOf({ enabled: true }), false);
    expect(enabledIn(store)).toBe(false);
    refuse(fail(new NetworkFailure('offline')));
    await expect(flip).resolves.toMatchObject({ ok: false });
    expect(enabledIn(store)).toBe(true);
    expect(repo.updateRule).toHaveBeenCalledWith('r1', { enabled: false });
  });

  it('lets the latest flip decide when an earlier one fails late', async () => {
    const { repo, store } = automations();
    repo.listRules.mockResolvedValue(ok(pageOf([dmRuleOf({ enabled: true })])));
    await store.getState().loadRules();
    let refuseFirst: (r: Result<DmRuleEntity, NetworkFailure>) => void = () => undefined;
    repo.updateRule.mockReturnValueOnce(new Promise((r) => (refuseFirst = r))).mockResolvedValueOnce(ok(dmRuleOf({ enabled: true })));
    const first = store.getState().setEnabled(dmRuleOf({ enabled: true }), false);
    await store.getState().setEnabled(dmRuleOf({ enabled: false }), true);
    refuseFirst(fail(new NetworkFailure('offline')));
    // Overtaken: nothing to report, so the screen shows no toast for a switch already where the user left it.
    await expect(first).resolves.toEqual({ ok: true, value: undefined });
    expect(enabledIn(store)).toBe(true);
  });

  it('stops the post picker at page 20 and searches the viewer’s own recipes with the query', async () => {
    const { repo, foods, store } = automations();
    repo.listMedia.mockResolvedValue(ok(pageOf<InstagramMedia>([], 20, 1000, 9)));
    await store.getState().loadMedia();
    const media = store.getState().media;
    expect(media.status === StoreStatus.Loaded && media.hasMore).toBe(false);
    await store.getState().searchRecipes(' menemen ');
    expect(foods.searchRecipes).toHaveBeenCalledWith('menemen', 'mine', 1, 6);
  });

  it('opens a listed rule at once, and drops a late answer for a rule the user left', async () => {
    const { repo, store } = automations();
    let answerFirst: (r: Result<DmRuleEntity, NotFoundFailure>) => void = () => undefined;
    repo.getRule.mockReturnValueOnce(new Promise((r) => (answerFirst = r))).mockResolvedValueOnce(ok(dmRuleOf({ id: 'r2' })));
    const first = store.getState().openRule('r1');
    await store.getState().openRule('r2');
    answerFirst(ok(dmRuleOf({ id: 'r1' })));
    await first;
    const opened = store.getState().opened;
    expect(opened.status === StoreStatus.Loaded && opened.rule.id).toBe('r2');
  });

  it('pages a rule’s activity with its id', async () => {
    const { repo, store } = automations();
    repo.listSends.mockResolvedValue(ok(pageOf([], 1, 20, 8)));
    await store.getState().loadSends('r1');
    await store.getState().loadMoreSends();
    expect(repo.listSends.mock.calls).toEqual([['r1', 1, 8], ['r1', 2, 8]]);
  });

  it('removes a deleted rule from the list', async () => {
    const { repo, store } = automations();
    repo.listRules.mockResolvedValue(ok(pageOf([dmRuleOf(), dmRuleOf({ id: 'r2' })])));
    await store.getState().loadRules();
    await store.getState().deleteRule('r1');
    const rules = store.getState().rules;
    expect(rules.status === StoreStatus.Loaded && rules.items.map((r) => r.id)).toEqual(['r2']);
  });
});
