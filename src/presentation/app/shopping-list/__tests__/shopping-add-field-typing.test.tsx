/* eslint-disable import/first -- jest.mock() must be hoisted above imports */
const mockRouter = { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/shopping-list',
  useFocusEffect: (callback: () => void) => {
    jest.requireActual<typeof import('react')>('react').useEffect(callback, [callback]);
  },
}));

const mockRowRenders = jest.fn();
jest.mock('@presentation/app/shopping-list/items/shopping-item-row', () => ({
  ShoppingItemRow: (props: unknown) => {
    mockRowRenders(props);
    return null;
  },
}));

import { act } from 'react-test-renderer';
import { ok } from '@core/result/result-helpers';
import { fakeShoppingRepository, shoppingItemOf, shoppingStoreOf } from '@application/shopping/__fixtures__/shopping-fixtures';
import type { ApplicationStores } from '@application/di/application-stores';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { ShoppingListScreen } from '@presentation/app/shopping-list';
import { t } from '@presentation/i18n';

/**
 * **Render storm: every keystroke in "Add an item" re-rendered the whole list.** The draft
 * lived in the screen's hook, so each character re-rendered the screen, the `FlatList` and
 * every row under the field. The field now owns its draft.
 */
describe('ShoppingListScreen — typing in the add field', () => {
  it('does not re-render the list rows while the user types', async () => {
    const repo = fakeShoppingRepository();
    const items = [shoppingItemOf({ id: 'a', label: 'Milk', position: 0 }), shoppingItemOf({ id: 'b', label: 'Eggs', position: 1 })];
    repo.list.mockResolvedValue(ok({ items, total: items.length, page: 1, pageSize: 20, hasMore: false }));
    const { root } = renderComponent(<ShoppingListScreen />, { shoppingListStore: shoppingStoreOf(repo) } as unknown as Partial<ApplicationStores>);
    await act(async () => undefined);
    const field = root.find((node) => node.props.accessibilityLabel === t().shopping.addPlaceholder && typeof node.props.onChangeText === 'function');
    mockRowRenders.mockClear();

    act(() => (field.props.onChangeText as (text: string) => void)('2 kg'));
    act(() => (field.props.onChangeText as (text: string) => void)('2 kg potatoes'));

    expect(mockRowRenders).not.toHaveBeenCalled();
  });
});
