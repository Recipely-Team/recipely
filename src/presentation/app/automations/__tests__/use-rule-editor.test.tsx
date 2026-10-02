/* eslint-disable import/first -- jest.mock() must be hoisted above imports */
const mockRouter = { back: jest.fn(), replace: jest.fn(), canGoBack: () => true, push: jest.fn() };
let mockParams: { ruleId?: string } = {};
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockParams }));
jest.mock('@presentation/base/feedback/show-toast', () => ({ showErrorToast: jest.fn(), showSuccessToast: jest.fn() }));

import { act } from 'react-test-renderer';
import { ok } from '@core/result/result-helpers';
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
import { dmRuleOf, fakeInstagramRepository } from '@application/instagram/__fixtures__/instagram-fixtures';
import type { Stores } from '@presentation/bootstrap/stores';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useRuleEditor } from '@presentation/app/automations/edit/hooks/use-rule-editor';
import type { UseRuleEditorResult } from '@presentation/app/automations/edit/model/use-rule-editor-result';
import { EditorStep } from '@presentation/app/automations/edit/model/editor-step';
import { t } from '@presentation/i18n';

const setup = () => {
  const repo = fakeInstagramRepository();
  repo.createRule.mockResolvedValue(ok(dmRuleOf()));
  repo.updateRule.mockResolvedValue(ok(dmRuleOf()));
  repo.getRule.mockResolvedValue(ok(dmRuleOf({ keywords: ['tarif'], publicReplyText: 'Sent 👌' })));
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
  const hook: { current: UseRuleEditorResult | null } = { current: null };
  const Probe = (): null => {
    hook.current = useRuleEditor();
    return null;
  };
  renderComponent(<Probe />, { automationsStore } as unknown as Partial<Stores>);
  const vm = (): UseRuleEditorResult => {
    if (hook.current === null) throw new Error('not rendered');
    return hook.current;
  };
  return { repo, vm };
};

describe('useRuleEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
  });

  it('gates every step on what the server would accept, then creates the rule', async () => {
    const { repo, vm } = setup();
    expect(vm().step).toBe(EditorStep.Post);
    act(() => vm().next());
    expect(vm().step).toBe(EditorStep.Post);

    act(() => vm().setMedia('m1'));
    act(() => vm().next());
    expect(vm().step).toBe(EditorStep.Keywords);
    act(() => vm().addKeyword('x'.repeat(41)));
    expect(vm().keywordError).toBe(t().instagram.keywordInvalid);
    act(() => vm().addKeyword('  Tarif  Lütfen '));
    expect(vm().keywords.value).toEqual(['tarif lütfen']);
    act(() => vm().next());
    act(() => vm().setRecipe('rec1', 'Menemen', null));
    act(() => vm().next());
    expect(vm().step).toBe(EditorStep.Message);

    act(() => vm().setDmText('Hi {name}'));
    expect(vm().stepValid[EditorStep.Message]).toBe(false);
    act(() => vm().save());
    expect(repo.createRule).not.toHaveBeenCalled();

    act(() => vm().setDmText('Hi {name} {link}'));
    act(() => vm().setReplyOn(true));
    act(() => vm().setReplyText('   '));
    expect(vm().stepValid[EditorStep.Message]).toBe(false);
    act(() => vm().setReplyText('Sent it 👌'));
    await act(async () => vm().save());
    expect(repo.createRule).toHaveBeenCalledWith(
      expect.objectContaining({ mediaId: 'm1', keywords: ['tarif lütfen'], recipeId: 'rec1', dmText: 'Hi {name} {link}', publicReplyText: 'Sent it 👌' }),
    );
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('fills an existing rule once, keeps its post, and saves only through PATCH', async () => {
    mockParams = { ruleId: 'r1' };
    const { repo, vm } = setup();
    await act(async () => undefined);
    expect(vm().isLoading).toBe(false);
    expect(vm().step).toBe(EditorStep.Keywords);
    expect([vm().mediaId, vm().keywords.value, vm().replyOn]).toEqual(['m1', ['tarif'], true]);
    act(() => vm().setMedia('other'));
    expect(vm().mediaId).toBe('m1');
    act(() => vm().goTo(EditorStep.Message));
    await act(async () => vm().save());
    expect(repo.updateRule).toHaveBeenCalledWith('r1', expect.objectContaining({ keywords: ['tarif'], publicReplyText: 'Sent 👌' }));
    expect(repo.createRule).not.toHaveBeenCalled();
  });
});
