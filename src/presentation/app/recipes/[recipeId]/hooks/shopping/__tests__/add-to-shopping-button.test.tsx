/* eslint-disable import/first -- jest.mock() must be hoisted above imports */
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
  usePathname: () => '/recipes/r1',
}));

import { act, type ReactTestInstance } from 'react-test-renderer';
import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionError } from '@domain/assistant/actions/assistant-action-error';
import { AssistantActionRegistry } from '@application/assistant/actions/assistant-action-registry';
import { Email } from '@domain/common/email';
import { UserEntity } from '@domain/auth/user-entity';
import { IngredientList } from '@domain/recipes/ingredients/ingredient-list';
import { UnitSystem } from '@domain/recipes/ingredients/unit-system';
import { fakeShoppingRepository, shoppingStoreOf } from '@application/shopping/__fixtures__/shopping-fixtures';
import type { ApplicationStores } from '@application/di/application-stores';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { authStoreOf } from '@presentation/base/test-support/auth-store-of';
import { SignInPromptSheet } from '@presentation/base/widgets/sheets/sign-in-prompt-sheet';
import { AddToShoppingButton } from '@presentation/app/recipes/[recipeId]/items/shopping/add-to-shopping-button';
import { t } from '@presentation/i18n';

const viewer = (): UserEntity => {
  const email = Email.create('cook@example.com');
  if (!email.ok) throw new Error('fixture email invalid');
  const user = UserEntity.create({ id: 'u1', email: email.value, displayName: 'Cook' });
  if (!user.ok) throw new Error('fixture user invalid');
  return user.value;
};

const render = (signedIn: boolean, lines: readonly string[]) => {
  const repo = fakeShoppingRepository();
  repo.add.mockResolvedValue(ok({ items: [], added: 2, merged: 1 }));
  const registry = new AssistantActionRegistry();
  const stores = { shoppingListStore: shoppingStoreOf(repo), authStore: authStoreOf(signedIn ? viewer() : null), assistantActionRegistry: registry } as unknown as Partial<ApplicationStores>;
  const { root } = renderComponent(<AddToShoppingButton source={{ recipeId: 'r1', recipeName: 'Pancakes', lines }} inCard={false} />, stores);
  return { root, repo, registry };
};

const button = (root: ReactTestInstance): ReactTestInstance =>
  root.find((node) => node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function' && node.props.accessibilityState !== undefined);

describe('Add to shopping list on a recipe', () => {
  it('sends the lines at the servings on screen, headings skipped, with the recipe', async () => {
    const doubled = IngredientList.of(['# Batter', '1 cup milk', '2 eggs', 'Salt']).present(2, UnitSystem.Original);
    const { root, repo } = render(true, doubled);
    await act(async () => (button(root).props.onPress as () => void)());
    expect(repo.add).toHaveBeenCalledWith([
      { label: 'milk', quantity: 2, unit: 'cups', recipeId: 'r1', recipeName: 'Pancakes' },
      { label: 'eggs', quantity: 4, unit: null, recipeId: 'r1', recipeName: 'Pancakes' },
      { label: 'Salt', quantity: null, unit: null, recipeId: 'r1', recipeName: 'Pancakes' },
    ]);
  });

  it('asks a guest to sign in instead of adding', async () => {
    const { root, repo } = render(false, ['1 cup milk']);
    await act(async () => (button(root).props.onPress as () => void)());
    expect(repo.add).not.toHaveBeenCalled();
    const prompt = root.findByType(SignInPromptSheet);
    expect([prompt.props.visible, prompt.props.message]).toEqual([true, t().shopping.signInToAdd]);
  });

  it('is not drawn for a recipe with nothing to buy', async () => {
    const { root } = render(true, ['# Only a heading']);
    await act(async () => undefined);
    expect(root.findAllByType(SignInPromptSheet)).toHaveLength(0);
  });

  // Two taps in one frame both read `isAdding` as false; the server merge then doubled every amount.
  it('adds the recipe once when the button is tapped twice in one frame', async () => {
    const { root, repo } = render(true, ['1 cup milk']);
    await act(async () => {
      const press = button(root).props.onPress as () => void;
      press();
      press();
    });
    expect(repo.add).toHaveBeenCalledTimes(1);
  });

  it('sends a guest who chooses to sign in to the login page, coming back to this recipe', async () => {
    mockPush.mockClear();
    const { root } = render(false, ['1 cup milk']);
    await act(async () => (button(root).props.onPress as () => void)());
    await act(async () => (root.findByType(SignInPromptSheet).props.onSignIn as () => void)());
    expect(mockPush).toHaveBeenCalledWith('/login?redirect=%2Frecipes%2Fr1');
  });

  it('lets the assistant add the recipe and reports how many lines were new and merged', async () => {
    const { repo, registry } = render(true, ['1 cup milk', '2 eggs']);
    await act(async () => {
      await expect(registry.run(AssistantAction.AddToShoppingList)).resolves.toMatchObject({ ok: true, title: 'Pancakes', n: { added: 2, merged: 1 } });
    });
    expect(repo.add).toHaveBeenCalledTimes(1);
  });

  it('tells the assistant why it could not add: signed out, nothing to buy, or the request failed', async () => {
    const guest = render(false, ['1 cup milk']);
    const empty = render(true, ['# Only a heading']);
    const failing = render(true, ['1 cup milk']);
    failing.repo.add.mockResolvedValue(fail(new NetworkFailure('offline')));
    await act(async () => {
      await expect(guest.registry.run(AssistantAction.AddToShoppingList)).resolves.toMatchObject({ ok: false, error: AssistantActionError.SignedOut });
      await expect(empty.registry.run(AssistantAction.AddToShoppingList)).resolves.toMatchObject({ ok: false, error: AssistantActionError.NoIngredients });
      await expect(failing.registry.run(AssistantAction.AddToShoppingList)).resolves.toMatchObject({ ok: false, error: AssistantActionError.Failed });
    });
    expect(guest.repo.add).not.toHaveBeenCalled();
  });
});
