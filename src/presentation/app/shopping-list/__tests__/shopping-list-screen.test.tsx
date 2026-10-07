/* eslint-disable import/first -- jest.mock() must be hoisted above imports */
const mockRouter = { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/shopping-list',
  useFocusEffect: (callback: () => void) => {
    jest.requireActual<typeof import('react')>('react').useEffect(callback, [callback]);
  },
}));

import { act, type ReactTestInstance } from 'react-test-renderer';
import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import { fakeShoppingRepository, shoppingItemOf, shoppingStoreOf } from '@application/shopping/__fixtures__/shopping-fixtures';
import type { ApplicationStores } from '@application/di/application-stores';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { ShoppingListScreen } from '@presentation/app/shopping-list';
import { getLocale, setLocale, t } from '@presentation/i18n';
import { upperCase } from '@presentation/i18n/upper-case';

const render = async (items = [shoppingItemOf({ id: 'a', label: 'Milk', quantity: 1, unit: 'l', recipeName: 'Pancakes', position: 0 }), shoppingItemOf({ id: 'b', label: 'Eggs', quantity: null, unit: null, checked: true, position: 1 })]) => {
  const repo = fakeShoppingRepository();
  repo.list.mockResolvedValue(ok({ items, total: items.length, page: 1, pageSize: 20, hasMore: false }));
  const shoppingListStore = shoppingStoreOf(repo);
  const rendered = renderComponent(<ShoppingListScreen />, { shoppingListStore } as unknown as Partial<ApplicationStores>);
  await act(async () => undefined);
  return { ...rendered, repo, shoppingListStore };
};

const checkbox = (root: ReactTestInstance, name: string): ReactTestInstance =>
  root.find((node) => node.props.accessibilityRole === 'checkbox' && String(node.props.accessibilityLabel).includes(name) && typeof node.props.onPress === 'function');

describe('ShoppingListScreen', () => {
  it('shows what is left to buy, then what is done, with amounts and the recipe each came from', async () => {
    const { root } = await render();
    const text = textContent(root).join('|');
    const copy = t().shopping;
    expect(text).toContain(upperCase(`${copy.toBuy} (1)`));
    expect(text).toContain(upperCase(`${copy.completed} (1)`));
    expect(text).toContain('1 l · Milk');
    expect(text).toContain(copy.fromRecipe.replace('{name}', 'Pancakes'));
    expect(text.indexOf('Milk')).toBeLessThan(text.indexOf('Eggs'));
  });

  // Review finding: the section labels were memoised on the items only, so a language switch left them in the old language.
  it('renames the sections when the language changes, without the list changing', async () => {
    const before = getLocale();
    const { root } = await render();
    act(() => setLocale(before === 'tr' ? 'en' : 'tr'));
    const text = textContent(root).join('|');
    const copy = t().shopping;
    act(() => setLocale(before));

    expect(text).toContain(upperCase(`${copy.toBuy} (1)`));
    expect(text).toContain(upperCase(`${copy.completed} (1)`));
  });

  it('ticks a line at once and sends the tick', async () => {
    const { root, repo } = await render();
    repo.update.mockResolvedValue(ok(shoppingItemOf({ id: 'a', label: 'Milk', checked: true })));
    await act(async () => (checkbox(root, 'Milk').props.onPress as () => void)());
    expect(repo.update).toHaveBeenCalledWith('a', { checked: true });
    expect(textContent(root).join('|')).toContain(upperCase(`${t().shopping.completed} (2)`));
  });

  it('says the list is empty, and offers Try again when it cannot load', async () => {
    const empty = await render([]);
    expect(textContent(empty.root)).toContain(t().shopping.emptyTitle);
    // An empty list is not an error: it must not wear the red danger disc.
    const emptyState = empty.root.findAll((n) => n.props.icon === 'cart-outline' && n.props.severity !== undefined)[0];
    expect(emptyState?.props.severity).toBe('neutral');

    const repo = fakeShoppingRepository();
    repo.list.mockResolvedValue(fail(new NetworkFailure('offline')));
    const failed = renderComponent(<ShoppingListScreen />, { shoppingListStore: shoppingStoreOf(repo) } as unknown as Partial<ApplicationStores>);
    await act(async () => undefined);
    expect(textContent(failed.root)).toContain(t().shopping.tryAgain);
  });
});
