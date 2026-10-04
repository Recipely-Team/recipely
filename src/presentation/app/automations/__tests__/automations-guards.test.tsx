/* eslint-disable import/first -- jest.mock() must be hoisted above imports */
jest.mock('@application/config/feature-flags', () => ({ FeatureFlags: { instagramAutomations: true } }));
const mockRouter = { back: jest.fn(), replace: jest.fn(), canGoBack: () => true, push: jest.fn() };
let mockParams: { ruleId?: string } = {};
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
  useFocusEffect: (callback: () => void) => {
    jest.requireActual<typeof import('react')>('react').useEffect(callback, [callback]);
  },
}));

import { act } from 'react-test-renderer';
import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import { configureAutomationsStore } from '@application/instagram/automations-store';
import { ListDmRulesUseCase } from '@application/instagram/rules/list-dm-rules-use-case';
import { GetDmRuleUseCase } from '@application/instagram/rules/get-dm-rule-use-case';
import { SaveDmRuleUseCase } from '@application/instagram/rules/save-dm-rule-use-case';
import { SetDmRuleEnabledUseCase } from '@application/instagram/rules/set-dm-rule-enabled-use-case';
import { DeleteDmRuleUseCase } from '@application/instagram/rules/delete-dm-rule-use-case';
import { ListInstagramMediaUseCase } from '@application/instagram/rules/list-instagram-media-use-case';
import { ListDmSendsUseCase } from '@application/instagram/activity/list-dm-sends-use-case';
import { SearchRecipeGroupUseCase } from '@application/diary/foods/search/search-recipe-group-use-case';
import { fakeFoodCatalogRepository } from '@application/diary/foods/__fixtures__/food-fixtures';
import { connectionOf, dmRuleOf, fakeInstagramRepository } from '@application/instagram/__fixtures__/instagram-fixtures';
import type { Stores } from '@presentation/bootstrap/stores';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { instagramStoreOf } from '@presentation/base/test-support/instagram-store-of';
import { useAutomations } from '@presentation/app/automations/hooks/use-automations';
import { useAutomationActivity } from '@presentation/app/automations/activity/hooks/use-automation-activity';
import { AutomationsViewKind } from '@presentation/app/automations/model/automations-view-kind';

const stores = (instagram = instagramStoreOf(connectionOf())) => {
  const repo = fakeInstagramRepository();
  const automationsStore = configureAutomationsStore({
    listRules: new ListDmRulesUseCase(repo),
    getRule: new GetDmRuleUseCase(repo),
    saveRule: new SaveDmRuleUseCase(repo),
    setEnabled: new SetDmRuleEnabledUseCase(repo),
    deleteRule: new DeleteDmRuleUseCase(repo),
    listMedia: new ListInstagramMediaUseCase(repo),
    listSends: new ListDmSendsUseCase(repo),
    searchMyRecipes: new SearchRecipeGroupUseCase(fakeFoodCatalogRepository()),
  });
  return { repo, instagram, value: { automationsStore, instagramStore: instagram.store } as unknown as Partial<Stores> };
};

const probe = <T,>(hook: () => T, value: Partial<Stores>): { current: () => T } => {
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

describe('Automations screens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
  });

  // A failed GET /me/instagram left Automations on its spinner for good.
  it('shows a link that cannot be read as an error with Try again', async () => {
    const instagram = instagramStoreOf();
    instagram.repo.getConnection.mockResolvedValue(fail(new NetworkFailure('offline')));
    const s = stores(instagram);
    const vm = probe(useAutomations, s.value);
    await act(async () => undefined);
    expect(vm.current().view).toBe(AutomationsViewKind.Error);
    expect(vm.current().connectionFailure).not.toBeNull();
    instagram.repo.getConnection.mockResolvedValue(ok(connectionOf()));
    await act(async () => vm.current().onRetryConnection());
    expect(vm.current().view).toBe(AutomationsViewKind.Rules);
  });

  it('opens no rule and no activity without a rule id, and goes back to Automations', async () => {
    mockParams = { ruleId: '' };
    const s = stores();
    probe(useAutomationActivity, s.value);
    await act(async () => undefined);
    expect(s.repo.getRule).not.toHaveBeenCalled();
    expect(s.repo.listSends).not.toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/automations');
  });

  it('keeps Activity out of reach while the feature is off', async () => {
    mockParams = { ruleId: 'r1' };
    const s = stores(instagramStoreOf());
    s.repo.getRule.mockResolvedValue(ok(dmRuleOf()));
    probe(useAutomationActivity, s.value);
    await act(async () => undefined);
    expect(mockRouter.replace).toHaveBeenCalledWith('/automations');
  });

  it('deletes a rule from the list only after the sheet is confirmed', async () => {
    const s = stores();
    const rule = dmRuleOf();
    const vm = probe(useAutomations, s.value);
    await act(async () => vm.current().onAskDelete(rule));
    expect(vm.current().pendingDelete).toBe(rule);
    expect(s.repo.deleteRule).not.toHaveBeenCalled();
    await act(async () => vm.current().onConfirmDelete());
    expect(s.repo.deleteRule).toHaveBeenCalledWith(rule.id);
    expect(vm.current().pendingDelete).toBeNull();
  });
});
