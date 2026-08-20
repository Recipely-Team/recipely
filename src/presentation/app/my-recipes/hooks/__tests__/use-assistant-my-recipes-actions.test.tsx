import { act } from 'react-test-renderer';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import type { RecipeDraft } from '@domain/drafts/recipe-draft';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { StoresProvider } from '@presentation/bootstrap/stores-context';
import type { Stores } from '@presentation/bootstrap/stores';
import { TabType } from '@presentation/app/my-recipes/model/tab-type';
import { useAssistantMyRecipesActions } from '@presentation/app/my-recipes/hooks/use-assistant-my-recipes-actions';

const recipe = (id: string, name: string): RecipeSummaryEntity => ({ id, name }) as RecipeSummaryEntity;
const draft = (id: string, name: string | undefined, prompt: string): RecipeDraft =>
  ({ id, prompt, snapshot: { name } }) as RecipeDraft;

function harness(
  items: RecipeSummaryEntity[] = [recipe('r1', 'Mercimek Çorbası'), recipe('r2', 'Fırın Tavuk')],
  drafts: RecipeDraft[] = [draft('d1', 'Yoğurtlu Tavuk', 'tavuk ve yoğurt'), draft('d2', undefined, 'mantı')],
) {
  const registry = new AssistantActionRegistry();
  const spies = {
    onSwitchTab: jest.fn(),
    onOpenRecipe: jest.fn(),
    onOpenDraft: jest.fn(),
    onRequestDeleteDraft: jest.fn(),
    onRefresh: jest.fn(),
  };

  const Probe = (): null => {
    useAssistantMyRecipesActions({ tab: TabType.Created, items, drafts, ...spies });
    return null;
  };

  renderComponent(
    <StoresProvider value={{ assistantActionRegistry: registry } as unknown as Stores}>
      <Probe />
    </StoresProvider>,
  );

  return { registry, spies };
}

describe('useAssistantMyRecipesActions', () => {
  // "Now show my liked ones" while already here should move the tab, the way
  // tapping it does — pushing the route again stacks a second copy of the
  // screen the user is looking at, and back then returns to the same screen.
  it('switches tab in place', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await registry.run(AssistantAction.SwitchTab, 'liked');
    });

    expect(spies.onSwitchTab).toHaveBeenCalledWith(TabType.Liked);
  });

  it('refuses a tab that does not exist', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await expect(registry.run(AssistantAction.SwitchTab, 'archive')).resolves.toEqual({
        ok: false,
        error: 'unknown_tab',
      });
    });

    expect(spies.onSwitchTab).not.toHaveBeenCalled();
  });

  // The user is reading the list while they speak, so they say the name.
  it('opens a recipe by part of its name', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await registry.run(AssistantAction.OpenRecipe, 'mercimek');
    });

    expect(spies.onOpenRecipe).toHaveBeenCalledWith('r1');
  });

  it('opens a recipe by its position in the list', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await registry.run(AssistantAction.OpenRecipe, '2');
    });

    expect(spies.onOpenRecipe).toHaveBeenCalledWith('r2');
  });

  // Declines rather than denies: the recipe may be one the user knows from the
  // feed, and the always-mounted handler underneath can open it by name or by
  // id. On the Drafts tab this list is not even the same collection. With
  // nothing registered underneath, the registry reports not_found — the
  // fallthrough itself is covered in the registry's own suite.
  it('does not open a row for a name it is not showing', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await expect(registry.run(AssistantAction.OpenRecipe, 'pizza')).resolves.toEqual({
        ok: false,
        error: 'not_found',
      });
    });

    expect(spies.onOpenRecipe).not.toHaveBeenCalled();
  });

  it('refuses a position past the end of the list', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await expect(registry.run(AssistantAction.OpenRecipe, '9')).resolves.toMatchObject({ ok: false });
    });

    expect(spies.onOpenRecipe).not.toHaveBeenCalled();
  });

  it('opens a draft by its recipe name', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await registry.run(AssistantAction.OpenDraft, 'yoğurtlu');
    });

    expect(spies.onOpenDraft).toHaveBeenCalledWith('d1');
  });

  // A draft that is still being generated has no name yet, so the prompt it
  // was made from is what the user would call it.
  it('finds an unnamed draft by the prompt it came from', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await registry.run(AssistantAction.OpenDraft, 'mantı');
    });

    expect(spies.onOpenDraft).toHaveBeenCalledWith('d2');
  });

  // A draft is unrecoverable work.
  it('asks before deleting a draft rather than deleting it', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await expect(registry.run(AssistantAction.DeleteDraft, 'yoğurtlu')).resolves.toMatchObject({
        ok: true,
        awaiting: true,
      });
    });

    expect(spies.onRequestDeleteDraft).toHaveBeenCalledWith('d1');
  });

  it('does not ask to delete a draft it could not find', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await expect(registry.run(AssistantAction.DeleteDraft, 'pizza')).resolves.toEqual({
        ok: false,
        error: 'not_found',
      });
    });

    expect(spies.onRequestDeleteDraft).not.toHaveBeenCalled();
  });

  it('reloads the list', async () => {
    const { registry, spies } = harness();

    await act(async () => {
      await registry.run(AssistantAction.Refresh);
    });

    expect(spies.onRefresh).toHaveBeenCalled();
  });
});
