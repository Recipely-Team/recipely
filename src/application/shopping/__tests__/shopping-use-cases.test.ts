import { ErrorMessageKey, NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import { ListShoppingItemsUseCase } from '@application/shopping/read/list-shopping-items-use-case';
import { AddShoppingItemUseCase } from '@application/shopping/write/add-shopping-item-use-case';
import { AddRecipeIngredientsUseCase } from '@application/shopping/write/add-recipe-ingredients-use-case';
import { UpdateShoppingItemUseCase } from '@application/shopping/write/update-shopping-item-use-case';
import { SetShoppingItemCheckedUseCase } from '@application/shopping/write/set-shopping-item-checked-use-case';
import { DeleteShoppingItemUseCase } from '@application/shopping/write/delete-shopping-item-use-case';
import { ClearCheckedShoppingItemsUseCase } from '@application/shopping/write/clear-checked-shopping-items-use-case';
import { ClearShoppingListUseCase } from '@application/shopping/write/clear-shopping-list-use-case';
import { fakeShoppingRepository, shoppingItemOf } from '@application/shopping/__fixtures__/shopping-fixtures';

const recipe = { id: 'r1', name: 'Soup' };

describe('shopping use cases', () => {
  it('delegate list, tick, delete and both clears to the repository', async () => {
    const repo = fakeShoppingRepository();
    repo.update.mockResolvedValue(ok(shoppingItemOf()));
    await new ListShoppingItemsUseCase(repo).execute(3, 20);
    await new SetShoppingItemCheckedUseCase(repo).execute('s1', true);
    await new DeleteShoppingItemUseCase(repo).execute('s1');
    await new ClearCheckedShoppingItemsUseCase(repo).execute();
    await new ClearShoppingListUseCase(repo).execute();
    expect(repo.list).toHaveBeenCalledWith(3, 20);
    expect(repo.update).toHaveBeenCalledWith('s1', { checked: true });
    expect(repo.remove).toHaveBeenCalledWith('s1');
    expect([repo.removeChecked.mock.calls.length, repo.removeAll.mock.calls.length]).toEqual([1, 1]);
  });

  it('reads a typed line like a recipe line', async () => {
    const repo = fakeShoppingRepository();
    await new AddShoppingItemUseCase(repo).execute('2 kg potatoes');
    expect(repo.add).toHaveBeenCalledWith([{ label: 'potatoes', quantity: 2, unit: 'kg', recipeId: null, recipeName: null }]);
  });

  it('adds a recipe in batches of 100, summing the counts, and sends nothing for headings only', async () => {
    const repo = fakeShoppingRepository();
    repo.add.mockResolvedValue(ok({ items: [], added: 2, merged: 1 }));
    const lines = Array.from({ length: 150 }, (_, i) => `${i + 1} g item${i}`);
    const r = await new AddRecipeIngredientsUseCase(repo).execute(['# Soup', ...lines], recipe);
    expect(repo.add.mock.calls.map(([drafts]) => drafts.length)).toEqual([100, 50]);
    expect(r.ok && [r.value.added, r.value.merged]).toEqual([4, 2]);

    const none = fakeShoppingRepository();
    const empty = await new AddRecipeIngredientsUseCase(none).execute(['# Soup', ''], recipe);
    expect(none.add).not.toHaveBeenCalled();
    expect(empty.ok && empty.value.added).toBe(0);
  });

  it('stops at the first refused batch', async () => {
    const repo = fakeShoppingRepository();
    repo.add.mockResolvedValue(fail(new NetworkFailure('offline')));
    const lines = Array.from({ length: 120 }, (_, i) => `item${i}`);
    const r = await new AddRecipeIngredientsUseCase(repo).execute(lines, recipe);
    expect(r.ok).toBe(false);
    expect(repo.add).toHaveBeenCalledTimes(1);
  });

  it('refuses a blank label or an unreadable amount with the backend key, and clears a blank amount and unit', async () => {
    const repo = fakeShoppingRepository();
    repo.update.mockResolvedValue(ok(shoppingItemOf()));
    const update = new UpdateShoppingItemUseCase(repo);
    const blank = await update.execute('s1', { label: ' ', quantityText: '', unit: '' });
    const bad = await update.execute('s1', { label: 'Milk', quantityText: 'lots', unit: '' });
    expect([!blank.ok && blank.failure.messageKey, !bad.ok && bad.failure.messageKey]).toEqual([
      ErrorMessageKey.shoppingLabelRequired,
      ErrorMessageKey.shoppingQuantityInvalid,
    ]);
    expect(repo.update).not.toHaveBeenCalled();
    await update.execute('s1', { label: ' Milk ', quantityText: '', unit: ' ' });
    expect(repo.update).toHaveBeenCalledWith('s1', { label: 'Milk', quantity: null, unit: null });
  });
});
