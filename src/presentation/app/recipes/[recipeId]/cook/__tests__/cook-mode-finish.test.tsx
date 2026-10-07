/* eslint-disable import/first -- jest.mock() must be hoisted above imports */
const mockRouter = { back: jest.fn(), replace: jest.fn(), push: jest.fn(), canGoBack: jest.fn(() => true) };
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ recipeId: 'r1' }),
  useRouter: () => mockRouter,
}));
jest.mock('expo-keep-awake', () => ({
  activateKeepAwakeAsync: jest.fn(() => Promise.resolve()),
  deactivateKeepAwake: jest.fn(() => Promise.resolve()),
}));
jest.mock('@presentation/base/timers/timer-controls', () => ({
  startTimer: jest.fn(() => Promise.resolve()),
  stopTimer: jest.fn(() => Promise.resolve()),
  pauseTimer: jest.fn(() => Promise.resolve()),
  resumeTimer: jest.fn(() => Promise.resolve()),
}));

import { act, type ReactTestInstance } from 'react-test-renderer';
import { create } from 'zustand';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionError } from '@domain/assistant/actions/assistant-action-error';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import { StoreStatus } from '@application/store/store-status';
import { configureStepProgressStore } from '@application/recipes/cooking/step-progress-store';
import { recipeEntityOf } from '@application/__fixtures__/recipe-entity-of';
import type { ApplicationStores } from '@application/di/application-stores';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { CookModeScreen } from '@presentation/app/recipes/[recipeId]/cook';
import { t } from '@presentation/i18n';

/**
 * **Finishing a recipe in cook mode, and the voice actions the screen test does not reach.** Finish
 * ticks the last step and leaves (to the recipe when there is no history); the assistant reads the
 * ingredients and ticks a step by name.
 */
const STEPS = ['Chop the onion', 'Serve hot'];

const setup = () => {
  const registry = new AssistantActionRegistry();
  const stepProgressStore = configureStepProgressStore();
  const recipe = recipeEntityOf({ id: 'r1', name: 'Soup', instructions: STEPS, ingredients: ['2 eggs', '1 tomato'] });
  const stores = {
    assistantActionRegistry: registry,
    stepProgressStore,
    recipeDetailStore: create(() => ({ byId: { r1: { status: StoreStatus.Loaded, recipe, likedByMe: false, fetchedAt: 0 } }, load: jest.fn() })),
    createdRecipesStore: create(() => ({ findById: () => undefined })),
  } as unknown as Partial<ApplicationStores>;
  const { root } = renderComponent(<CookModeScreen />, stores);
  return { root, registry, stepProgressStore };
};

const press = (root: ReactTestInstance, label: string): void => {
  const button = root.find(
    (node) =>
      node.props.accessibilityRole === 'button' &&
      typeof node.props.onPress === 'function' &&
      node.findAllByType(ThemedText).some((text) => text.props.children === label),
  );
  act(() => (button.props.onPress as () => void)());
};

describe('CookModeScreen finishing', () => {
  beforeEach(() => jest.clearAllMocks());

  it('ticks the last step and goes back when Finish is pressed', () => {
    const { root, stepProgressStore } = setup();

    press(root, t().cookMode.next);
    press(root, t().cookMode.finish);

    expect(stepProgressStore.getState().byRecipe.r1).toEqual([true, true]);
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  it('opens the recipe instead when cook mode was the first page (no history to go back to)', () => {
    mockRouter.canGoBack.mockReturnValueOnce(false);
    const { root } = setup();

    press(root, t().cookMode.next);
    press(root, t().cookMode.finish);

    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/recipes/r1');
  });

  it('reads the ingredients to the assistant', async () => {
    const { registry } = setup();

    await act(async () => {
      await expect(registry.run(AssistantAction.ReadIngredients)).resolves.toMatchObject({ ok: true, n: { ingredients: 2 } });
    });
  });

  it('ticks the step the assistant names and counts it as done', async () => {
    const { registry, stepProgressStore } = setup();

    await act(async () => {
      await expect(registry.run(AssistantAction.ToggleStep, 'serve')).resolves.toMatchObject({ ok: true, n: { step: 2, done: 1 } });
    });
    expect(stepProgressStore.getState().byRecipe.r1?.[1]).toBe(true);
    await act(async () => {
      await expect(registry.run(AssistantAction.ToggleStep, 'flambé')).resolves.toMatchObject({ ok: false, error: AssistantActionError.NotFound });
    });
  });

  it('refuses a step number past the end', async () => {
    const { registry } = setup();

    await act(async () => {
      await expect(registry.run(AssistantAction.ReadStep, '9')).resolves.toMatchObject({ ok: false, error: AssistantActionError.NoSuchStep });
    });
  });
});
