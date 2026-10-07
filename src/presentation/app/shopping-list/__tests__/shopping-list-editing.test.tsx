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
import { ErrorMessageKey, NetworkFailure, ValidationFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import { fakeShoppingRepository, shoppingItemOf, shoppingStoreOf } from '@application/shopping/__fixtures__/shopping-fixtures';
import type { ApplicationStores } from '@application/di/application-stores';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { failureContent } from '@presentation/base/errors/failure-lookups';
import { ShoppingListScreen } from '@presentation/app/shopping-list';
import { t } from '@presentation/i18n';

/**
 * **Editing, adding and clearing the shopping list.** The screen test covers reading and ticking; this one
 * drives the write paths through the real store and a fake repository, so a wrong payload or a sheet
 * that never closes shows up here.
 */
const render = async () => {
  const repo = fakeShoppingRepository();
  const items = [
    shoppingItemOf({ id: 'a', label: 'Milk', quantity: 1.5, unit: 'l', position: 0 }),
    shoppingItemOf({ id: 'b', label: 'Eggs', quantity: null, unit: null, checked: true, position: 1 }),
  ];
  repo.list.mockResolvedValue(ok({ items, total: items.length, page: 1, pageSize: 20, hasMore: false }));
  const rendered = renderComponent(<ShoppingListScreen />, { shoppingListStore: shoppingStoreOf(repo) } as unknown as Partial<ApplicationStores>);
  await act(async () => undefined);
  return { ...rendered, repo };
};

const byLabel = (root: ReactTestInstance, label: string): ReactTestInstance =>
  root.find((node) => node.props.accessibilityLabel === label && (typeof node.props.onPress === 'function' || typeof node.props.onChangeText === 'function'));

const pressText = async (root: ReactTestInstance, label: string): Promise<void> => {
  const target = root.findAll((node) => typeof node.props.onPress === 'function' && textContent(node).includes(label)).at(-1);
  if (target === undefined) throw new Error(`no pressable with "${label}"`);
  await act(async () => (target.props.onPress as () => void)());
};

const sheetOpen = (root: ReactTestInstance): boolean => 
  root.findAllByType(BottomSheet).find((sheet) => sheet.props.title === t().shopping.editTitle)?.props.visible === true;

const press = async (node: ReactTestInstance): Promise<void> => act(async () => (node.props.onPress as () => void)());
const type = async (node: ReactTestInstance, text: string): Promise<void> => act(async () => (node.props.onChangeText as (v: string) => void)(text));

describe('ShoppingListScreen editing', () => {
  it('opens the edit sheet filled with the line, and saves the changed fields', async () => {
    const { root, repo } = await render();
    const copy = t().shopping;
    repo.update.mockResolvedValue(ok(shoppingItemOf({ id: 'a', label: 'Oat milk', quantity: 2, unit: 'l' })));

    await press(byLabel(root, copy.edit.replace('{name}', 'Milk')));
    expect(sheetOpen(root)).toBe(true);
    expect(byLabel(root, copy.labelField).props.value).toBe('Milk');
    expect(byLabel(root, copy.unitField).props.value).toBe('l');
    await type(byLabel(root, copy.labelField), 'Oat milk');
    await type(byLabel(root, copy.quantityField), '2');
    await pressText(root, copy.save);

    expect(repo.update).toHaveBeenCalledWith('a', { label: 'Oat milk', quantity: 2, unit: 'l' });
    expect(sheetOpen(root)).toBe(false);
  });

  it('keeps the edit sheet open and says why when the amount cannot be read', async () => {
    const { root, repo } = await render();
    const copy = t().shopping;

    await press(byLabel(root, copy.edit.replace('{name}', 'Milk')));
    await type(byLabel(root, copy.quantityField), 'lots');
    await pressText(root, copy.save);

    expect(repo.update).not.toHaveBeenCalled();
    expect(sheetOpen(root)).toBe(true);
    expect(textContent(root)).toContain(failureContent(new ValidationFailure('x', 'quantity', ErrorMessageKey.shoppingQuantityInvalid)).body);
    expect(byLabel(root, copy.labelField).props.value).toBe('Milk');
  });

  it('sends a typed line and empties the field once it is added', async () => {
    const { root, repo } = await render();
    const copy = t().shopping;

    await type(byLabel(root, copy.addPlaceholder), '2 kg potatoes');
    await press(byLabel(root, copy.add));

    expect(repo.add).toHaveBeenCalledTimes(1);
    expect(byLabel(root, copy.addPlaceholder).props.value).toBe('');
  });

  it('keeps the typed line when adding it fails, so nothing is lost', async () => {
    const { root, repo } = await render();
    const copy = t().shopping;
    repo.add.mockResolvedValue(fail(new NetworkFailure('offline')));

    await type(byLabel(root, copy.addPlaceholder), '2 kg potatoes');
    await press(byLabel(root, copy.add));

    expect(byLabel(root, copy.addPlaceholder).props.value).toBe('2 kg potatoes');
  });

  it('removes a line from its trash button', async () => {
    const { root, repo } = await render();

    await press(byLabel(root, t().shopping.remove.replace('{name}', 'Milk')));

    expect(repo.remove).toHaveBeenCalledWith('a');
  });

  it('asks before clearing completed lines and clears only those', async () => {
    const { root, repo } = await render();
    const copy = t().shopping;

    await pressText(root, copy.clearCompleted);
    expect(textContent(root)).toContain(copy.clearCompletedQ);
    expect(repo.removeChecked).not.toHaveBeenCalled();
    await pressText(root, copy.clearCompleted);

    expect(repo.removeChecked).toHaveBeenCalledTimes(1);
    expect(repo.removeAll).not.toHaveBeenCalled();
  });
});
