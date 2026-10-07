/* eslint-disable import/first -- jest.mock() must be hoisted above imports */
jest.mock('@presentation/base/timers/timer-controls', () => ({
  startTimer: jest.fn(() => Promise.resolve()),
  stopTimer: jest.fn(() => Promise.resolve()),
  pauseTimer: jest.fn(() => Promise.resolve()),
  resumeTimer: jest.fn(() => Promise.resolve()),
}));

import { act } from 'react-test-renderer';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import type { ApplicationStores } from '@application/di/application-stores';
import { StoreStatus } from '@application/store/store-status';
import { recipeEntityOf } from '@application/__fixtures__/recipe-entity-of';
import { timerStore } from '@application/timers/timer-store';
import { configurePortionChoiceStore } from '@application/recipes/cooking/portion-choice-store';
import { authStoreOf } from '@presentation/base/test-support/auth-store-of';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useRecipeDetailAssistant } from '@presentation/app/recipes/[recipeId]/hooks/use-recipe-detail-assistant';
import type { UseRecipeDetailResult } from '@presentation/app/recipes/[recipeId]/model/use-recipe-detail-result';

/**
 * **"Remove this from my saved recipes" by voice.** Unsaving a curated recipe asks first: the
 * assistant only marks it pending and the save flips on the spoken Confirm. While the delete sheet
 * is open, Confirm belongs to the delete, never to a pending unsave.
 */
const selectorOf =
  <S,>(state: S) =>
  (select: (s: S) => unknown): unknown =>
    select(state);

function harness(over: Partial<UseRecipeDetailResult> = {}, extraStores: Partial<ApplicationStores> = {}) {
  const registry = new AssistantActionRegistry();
  const vm = {
    recipeId: 'r1',
    recipe: recipeEntityOf({ id: 'r1', name: 'Soup' }),
    scrollViewRef: { current: null },
    commentState: null,
    isOwner: false,
    checkedIngredients: [],
    completedSteps: [],
    showDeleteSheet: false,
    shareOpen: false,
    promptVisible: false,
    onToggleSave: jest.fn(),
    onConfirmDelete: jest.fn(),
    onCloseDelete: jest.fn(),
    onPostComment: jest.fn(),
    onOpenDelete: jest.fn(),
    onOpenShare: jest.fn(),
    onCopyToDraft: jest.fn(),
    onToggleIngredient: jest.fn(),
    onToggleStep: jest.fn(),
    ...over,
  } as unknown as UseRecipeDetailResult;
  const view: { pending: boolean; renders: number } = { pending: false, renders: 0 };
  const Probe = (): null => {
    view.renders += 1;
    view.pending = useRecipeDetailAssistant(vm).unsavePending;
    return null;
  };
  const stores = {
    assistantActionRegistry: registry,
    authStore: authStoreOf(null),
    likesStore: selectorOf({ setLiked: jest.fn(), byRecipe: {} }),
    favoritesStore: selectorOf({ addFavorite: jest.fn(), removeFavorite: jest.fn() }),
    savedRecipesStore: selectorOf({ savedIds: new Set(['r1']), listState: { status: StoreStatus.Loaded } }),
  } as unknown as Partial<ApplicationStores>;
  renderComponent(<Probe />, { ...stores, ...extraStores });
  const run = async (action: (typeof AssistantAction)[keyof typeof AssistantAction]): Promise<void> =>
    act(async () => {
      await registry.run(action);
    });
  return { run, vm, view, registry };
}

describe('useRecipeDetailAssistant', () => {
  it('unsaves only after the user confirms', async () => {
    const { run, vm, view } = harness();

    await run(AssistantAction.Unsave);
    expect(view.pending).toBe(true);
    expect(vm.onToggleSave).not.toHaveBeenCalled();
    await run(AssistantAction.Confirm);

    expect(vm.onToggleSave).toHaveBeenCalledTimes(1);
    expect(view.pending).toBe(false);
  });

  it('keeps the recipe saved when the user cancels', async () => {
    const { run, vm, view } = harness();

    await run(AssistantAction.Unsave);
    await run(AssistantAction.Cancel);

    expect(vm.onToggleSave).not.toHaveBeenCalled();
    expect(view.pending).toBe(false);
  });

  it('confirms the open delete sheet, not a pending unsave', async () => {
    const { run, vm } = harness({ showDeleteSheet: true });

    await run(AssistantAction.Unsave);
    await run(AssistantAction.Confirm);

    expect(vm.onConfirmDelete).toHaveBeenCalledTimes(1);
    expect(vm.onToggleSave).not.toHaveBeenCalled();
  });

  // Review finding: the assistant read the raw lines — at the recipe's own servings, "# For the
  // sauce" and all — while the screen showed them scaled to the servings the reader chose.
  it('reads the ingredients at the servings the reader chose, headings as their labels', async () => {
    const portionChoiceStore = configurePortionChoiceStore();
    portionChoiceStore.getState().setServings('r1', 4);
    const { registry } = harness(
      { recipe: recipeEntityOf({ id: 'r1', servings: 2, ingredients: ['# For the sauce', '2 cups flour'] }) },
      { portionChoiceStore },
    );

    await act(async () => {
      await expect(registry.run(AssistantAction.ReadIngredients)).resolves.toMatchObject({ ok: true, title: 'For the sauce, 4 cups flour' });
    });
  });

  // Render storm: the hook read the cook timer through `useRecipeTimer`, which subscribes to the
  // one-second tick, so the WHOLE detail screen re-rendered every second while the timer ran.
  it('does not re-render the detail screen every second while its cook timer runs', () => {
    jest.useFakeTimers();
    try {
      const minuteMs = 60_000;
      timerStore.setState({
        timers: {
          'r1:cook': {
            id: 'r1:cook',
            recipeId: 'r1',
            recipeName: 'Soup',
            durationSeconds: 600,
            endTimeMs: Date.now() + 10 * minuteMs,
            isPaused: false,
            remainingMsOnPause: 0,
            completionNotifIds: [],
          },
        },
      });
      const { view } = harness();
      const rendersAfterMount = view.renders;

      act(() => {
        jest.advanceTimersByTime(5_000);
      });

      expect(view.renders).toBe(rendersAfterMount);
    } finally {
      timerStore.setState({ timers: {} });
      jest.useRealTimers();
    }
  });
});
