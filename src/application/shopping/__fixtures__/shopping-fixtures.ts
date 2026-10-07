import { ok } from '@core/result/result-helpers';
import { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';
import type { ShoppingItemEntityProps } from '@domain/shopping/items/shopping-item-entity-props';
import type { ShoppingListRepositoryInterface } from '@domain/shopping/shopping-list-repository-interface';
import { configureShoppingListStore } from '@application/shopping/shopping-list-store';
import { ListShoppingItemsUseCase } from '@application/shopping/read/list-shopping-items-use-case';
import { AddShoppingItemUseCase } from '@application/shopping/write/add-shopping-item-use-case';
import { AddRecipeIngredientsUseCase } from '@application/shopping/write/add-recipe-ingredients-use-case';
import { UpdateShoppingItemUseCase } from '@application/shopping/write/update-shopping-item-use-case';
import { SetShoppingItemCheckedUseCase } from '@application/shopping/write/set-shopping-item-checked-use-case';
import { DeleteShoppingItemUseCase } from '@application/shopping/write/delete-shopping-item-use-case';
import { ClearCheckedShoppingItemsUseCase } from '@application/shopping/write/clear-checked-shopping-items-use-case';
import { ClearShoppingListUseCase } from '@application/shopping/write/clear-shopping-list-use-case';

/** A shopping line for tests. */
export const shoppingItemOf = (over: Partial<ShoppingItemEntityProps> = {}): ShoppingItemEntity => {
  const r = ShoppingItemEntity.create({
    id: 's1',
    label: 'Flour',
    quantity: 2,
    unit: 'cups',
    recipeId: null,
    recipeName: null,
    checked: false,
    position: 0,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...over,
  });
  if (!r.ok) throw new Error('shoppingItemOf: invalid fixture');
  return r.value;
};

/** A repository whose every call is a jest mock answering an empty success. */
export const fakeShoppingRepository = (): jest.Mocked<ShoppingListRepositoryInterface> => ({
  list: jest.fn().mockResolvedValue(ok({ items: [], total: 0, page: 1, pageSize: 20, hasMore: false })),
  add: jest.fn().mockResolvedValue(ok({ items: [], added: 0, merged: 0 })),
  update: jest.fn(),
  remove: jest.fn().mockResolvedValue(ok(undefined)),
  removeChecked: jest.fn().mockResolvedValue(ok(0)),
  removeAll: jest.fn().mockResolvedValue(ok(0)),
});

/** The real store over a fake repository. */
export const shoppingStoreOf = (repo: ShoppingListRepositoryInterface = fakeShoppingRepository()) =>
  configureShoppingListStore({
    list: new ListShoppingItemsUseCase(repo),
    addText: new AddShoppingItemUseCase(repo),
    addFromRecipe: new AddRecipeIngredientsUseCase(repo),
    edit: new UpdateShoppingItemUseCase(repo),
    setChecked: new SetShoppingItemCheckedUseCase(repo),
    remove: new DeleteShoppingItemUseCase(repo),
    clearChecked: new ClearCheckedShoppingItemsUseCase(repo),
    clearAll: new ClearShoppingListUseCase(repo),
  });
