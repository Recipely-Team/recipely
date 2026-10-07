import { act, type ReactTestInstance } from 'react-test-renderer';
import { create } from 'zustand';
import { NavigationContext } from 'expo-router/react-navigation';
import type { NavigationProp, ParamListBase } from 'expo-router/react-navigation';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionError } from '@domain/assistant/actions/assistant-action-error';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import { StoreStatus } from '@application/store/store-status';
import { configureStepProgressStore } from '@application/recipes/cooking/step-progress-store';
import { recipeEntityOf } from '@application/__fixtures__/recipe-entity-of';
import { renderComponent } from '@presentation/base/test-support/render-component';
import type { ApplicationStores } from '@application/di/application-stores';
import { startTimer } from '@presentation/base/timers/timer-controls';
import { timerStore } from '@application/timers/timer-store';
import { t } from '@presentation/i18n';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { CookModeScreen } from '@presentation/app/recipes/[recipeId]/cook';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ recipeId: 'r1' }),
  useRouter: () => ({ back: jest.fn(), replace: jest.fn(), push: jest.fn(), canGoBack: () => true }),
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

const STEPS = ['Chop the onion', 'Simmer for 10 minutes', 'Serve hot'];

const setup = () => {
  const recipe = recipeEntityOf({ id: 'r1', name: 'Soup', instructions: STEPS });
  const registry = new AssistantActionRegistry();
  const stepProgressStore = configureStepProgressStore();
  const stores = {
    assistantActionRegistry: registry,
    stepProgressStore,
    recipeDetailStore: create(() => ({
      byId: { r1: { status: StoreStatus.Loaded, recipe, likedByMe: false, fetchedAt: 0 } },
      load: jest.fn(),
    })),
    createdRecipesStore: create(() => ({ findById: () => undefined })),
  } as unknown as Partial<ApplicationStores>;

  const listeners: (() => void)[] = [];
  let focused = true;
  const navigation = {
    isFocused: () => focused,
    addListener: (event: string, listener: () => void) => {
      if (event === 'blur') listeners.push(listener);
      return () => undefined;
    },
  } as unknown as NavigationProp<ParamListBase>;

  const { root } = renderComponent(
    <NavigationContext.Provider value={navigation}>
      <CookModeScreen />
    </NavigationContext.Provider>,
    stores,
  );
  const blur = (): void => {
    focused = false;
    act(() => listeners.forEach((listener) => listener()));
  };
  return { root, registry, stepProgressStore, blur };
};

const texts = (root: ReactTestInstance): string[] =>
  root
    .findAllByType(ThemedText)
    .map((node) => node.props.children)
    .filter((child): child is string => typeof child === 'string');

const pressButton = (root: ReactTestInstance, label: string): void => {
  const button = root.find(
    (node) =>
      node.props.accessibilityRole === 'button' &&
      typeof node.props.onPress === 'function' &&
      texts(node).includes(label),
  );
  const onPress = button.props.onPress as () => void;
  act(() => onPress());
};

describe('CookModeScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the first step large with its place in the recipe', () => {
    const { root } = setup();
    const shown = texts(root);
    expect(shown).toContain(STEPS[0]);
    expect(shown).toContain(t().cookMode.stepOf.replace('{n}', '1').replace('{total}', '3'));
    expect(shown).not.toContain(STEPS[1]);
  });

  it('Next ticks the step being left, in the store the recipe page reads, and shows the next one', () => {
    const { root, stepProgressStore } = setup();
    pressButton(root, t().cookMode.next);
    expect(texts(root)).toContain(STEPS[1]);
    expect(stepProgressStore.getState().byRecipe.r1?.[0]).toBe(true);
  });

  it('offers the timer a step names, and only there', () => {
    const { root } = setup();
    const timerLabel = t().cookMode.startTimer.replace('{min}', '10');
    expect(texts(root)).not.toContain(timerLabel);
    pressButton(root, t().cookMode.next);
    expect(texts(root)).toContain(timerLabel);
  });

  it('keeps a step timer that is still counting in view after moving on', () => {
    timerStore.setState({
      timers: {
        'r1:step2:10min': {
          id: 'r1:step2:10min',
          recipeId: 'r1',
          recipeName: 'Soup',
          durationSeconds: 600,
          endTimeMs: Date.now() + 300_000,
          isPaused: true,
          remainingMsOnPause: 300_000,
          completionNotifIds: [],
        },
      },
    });
    const { root } = setup();
    pressButton(root, t().cookMode.next);
    pressButton(root, t().cookMode.next);
    expect(texts(root)).toEqual(expect.arrayContaining([STEPS[2], 'Step 2 of 3', '05:00']));
    timerStore.setState({ timers: {} });
  });

  it('answers the voice assistant: next, previous, repeat and the step timer move the screen', async () => {
    const { root, registry } = setup();

    await act(async () => {
      await expect(registry.run(AssistantAction.ReadStep, 'next')).resolves.toMatchObject({ ok: true, title: STEPS[1] });
    });
    expect(texts(root)).toContain(STEPS[1]);

    await act(async () => {
      await expect(registry.run(AssistantAction.StartTimer)).resolves.toMatchObject({ ok: true, n: { min: 10 } });
    });
    expect(startTimer).toHaveBeenCalledWith('r1:step2:10min', 'r1', 'Soup', 10);

    await act(async () => {
      await expect(registry.run(AssistantAction.ReadStep, 'current')).resolves.toMatchObject({ title: STEPS[1] });
      await expect(registry.run(AssistantAction.ReadStep, 'previous')).resolves.toMatchObject({ title: STEPS[0] });
    });
    expect(texts(root)).toContain(STEPS[0]);

    await act(async () => {
      await expect(registry.run(AssistantAction.StartTimer)).resolves.toMatchObject({
        ok: false,
        error: AssistantActionError.NoCookTime,
      });
    });
  });

  it('stops answering once another screen is in front', async () => {
    const { registry, blur } = setup();
    blur();
    await act(async () => {
      await expect(registry.run(AssistantAction.ReadStep, 'next')).resolves.toMatchObject({
        ok: false,
        error: AssistantActionError.UnavailableHere,
      });
    });
  });
});
