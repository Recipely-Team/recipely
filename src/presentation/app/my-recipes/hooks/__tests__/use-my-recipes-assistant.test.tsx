import { act } from 'react-test-renderer';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import type { RecipeDraft } from '@domain/drafts/recipe-draft';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import type { ApplicationStores } from '@application/di/application-stores';
import { StoreStatus } from '@application/store/store-status';
import { ListState } from '@presentation/base/hooks/assistant/args/describing/list-state';
import { authStoreOf } from '@presentation/base/test-support/auth-store-of';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import { TabType } from '@presentation/app/my-recipes/model/tab-type';
import { useMyRecipesAssistant } from '@presentation/app/my-recipes/hooks/use-my-recipes-assistant';

/**
 * **"Delete my yogurt chicken draft" by voice.** A draft is unrecoverable work, so the assistant only
 * marks it pending; it is deleted on the user's spoken Confirm and kept on Cancel.
 */
const selectorOf =
  <S,>(state: S) =>
  (select: (s: S) => unknown): unknown =>
    select(state);

const DRAFTS =[{ id: 'd1', prompt: 'chicken and yogurt', snapshot: { name: 'Yogurt chicken' } }] as unknown as RecipeDraft[];

function harness() {
  const registry = new AssistantActionRegistry();
  const deleteDraft = jest.fn().mockResolvedValue(undefined);
  const view: { pending: boolean } = { pending: false };
  const Probe = (): null => {
    view.pending = useMyRecipesAssistant({
      tab: TabType.Drafts,
      items: [],
      drafts: DRAFTS,
      tabListState: ListState.Ready,
      isTabSettled: true,
      setTab: jest.fn(),
      openRecipe: jest.fn(),
      openDraft: jest.fn(),
      deleteDraft,
      onRefresh: jest.fn(),
    }).isDraftDeletePending;
    return null;
  };
  const stores = {
    assistantActionRegistry: registry,
    authStore: authStoreOf(null),
    likesStore: selectorOf({ setLiked: jest.fn(), byRecipe: {} }),
    favoritesStore: selectorOf({ addFavorite: jest.fn(), removeFavorite: jest.fn() }),
    savedRecipesStore: selectorOf({ savedIds: new Set<string>(), listState: { status: StoreStatus.Idle } }),
  };
  renderComponent(
    <StoresProvider value={stores as unknown as ApplicationStores}>
      <Probe />
    </StoresProvider>,
  );
  const run = async (action: (typeof AssistantAction)[keyof typeof AssistantAction], arg?: string): Promise<void> =>
    act(async () => {
      await registry.run(action, arg);
    });
  return { run, deleteDraft, view };
}

describe('useMyRecipesAssistant', () => {
  it('deletes the named draft only once the user confirms', async () => {
    const { run, deleteDraft, view } = harness();

    await run(AssistantAction.DeleteDraft, 'yogurt');
    expect(view.pending).toBe(true);
    expect(deleteDraft).not.toHaveBeenCalled();
    await run(AssistantAction.Confirm);

    expect(deleteDraft).toHaveBeenCalledWith('d1');
    expect(view.pending).toBe(false);
  });

  it('keeps the draft when the user cancels', async () => {
    const { run, deleteDraft, view } = harness();

    await run(AssistantAction.DeleteDraft, 'yogurt');
    await run(AssistantAction.Cancel);

    expect(deleteDraft).not.toHaveBeenCalled();
    expect(view.pending).toBe(false);
  });
});
