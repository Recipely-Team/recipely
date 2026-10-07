/* eslint-disable import/first -- jest.mock() must be hoisted above imports */
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
  usePathname: () => '/recipes/r1',
}));

import { act, type ReactTestInstance } from 'react-test-renderer';
import { ok } from '@core/result/result-helpers';
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
  const stores = { shoppingListStore: shoppingStoreOf(repo), authStore: authStoreOf(signedIn ? viewer() : null) } as unknown as Partial<ApplicationStores>;
  const { root } = renderComponent(<AddToShoppingButton source={{ recipeId: 'r1', recipeName: 'Pancakes', lines }} />, stores);
  return { root, repo };
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
});
