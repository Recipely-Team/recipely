import { act } from 'react-test-renderer';
import { create } from 'zustand';
import type { ApplicationStores } from '@application/di/application-stores';
import { StoreStatus } from '@application/store/store-status';
import { createRef } from 'react';
import type { ScrollView } from 'react-native';
import { NavigationContext } from 'expo-router/react-navigation';
import type { NavigationProp, ParamListBase } from 'expo-router/react-navigation';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import { configurePortionChoiceStore } from '@application/recipes/cooking/portion-choice-store';
import { recipeEntityOf } from '@application/__fixtures__/recipe-entity-of';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { useRecipeDetailAssistant } from '@presentation/app/recipes/[recipeId]/hooks/use-recipe-detail-assistant';
import type { UseRecipeDetailResult } from '@presentation/app/recipes/[recipeId]/model/use-recipe-detail-result';

jest.mock('@presentation/base/timers/timer-controls', () => ({
  startTimer: jest.fn(() => Promise.resolve()),
  stopTimer: jest.fn(() => Promise.resolve()),
  pauseTimer: jest.fn(() => Promise.resolve()),
  resumeTimer: jest.fn(() => Promise.resolve()),
}));

const navigation = {
  isFocused: () => true,
  addListener: () => () => undefined,
} as unknown as NavigationProp<ParamListBase>;

const vmOf = (): UseRecipeDetailResult =>
  ({
    recipeId: 'r1',
    recipe: recipeEntityOf({ id: 'r1', servings: 2, ingredients: ['# For the sauce', '2 cups flour'] }),
    scrollViewRef: createRef<ScrollView>(),
    commentState: null,
    isOwner: false,
    checkedIngredients: [],
    completedSteps: [],
    showDeleteSheet: false,
    shareOpen: false,
    promptVisible: false,
  }) as unknown as UseRecipeDetailResult;

/** The stores the shared recipe actions read, signed out. */
const recipeActionStores = {
  authStore: create(() => ({ state: { status: StoreStatus.Unauthenticated } })),
  favoritesStore: create(() => ({ addFavorite: jest.fn(), removeFavorite: jest.fn() })),
  likesStore: create(() => ({ setLiked: jest.fn(), byRecipe: {} })),
  savedRecipesStore: create(() => ({ savedIds: [], listState: { status: StoreStatus.Idle } })),
} as unknown as Partial<ApplicationStores>;

const Probe = ({ vm }: { vm: UseRecipeDetailResult }): null => {
  useRecipeDetailAssistant(vm);
  return null;
};

/**
 * Review finding: the recipe page's assistant read the recipe's raw lines — at
 * its own servings, "# For the sauce" and all — while the screen showed them
 * scaled to the servings the reader had chosen.
 */
describe('useRecipeDetailAssistant', () => {
  it('reads the ingredients at the servings the reader chose, headings as their labels', async () => {
    const registry = new AssistantActionRegistry();
    const portionChoiceStore = configurePortionChoiceStore();
    portionChoiceStore.getState().setServings('r1', 4);
    renderComponent(
      <NavigationContext.Provider value={navigation}>
        <Probe vm={vmOf()} />
      </NavigationContext.Provider>,
      { ...recipeActionStores, assistantActionRegistry: registry, portionChoiceStore },
    );

    await act(async () => {
      await expect(registry.run(AssistantAction.ReadIngredients)).resolves.toMatchObject({ ok: true, title: 'For the sauce, 4 cups flour' });
    });
  });
});
