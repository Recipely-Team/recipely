import type { Container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import type { ApplicationStores } from '@application/di/application-stores';
import type { ShoppingListRepositoryInterface } from '@domain/shopping/shopping-list-repository-interface';
import { configureShoppingListStore } from '@application/shopping/shopping-list-store';
import { ListShoppingItemsUseCase } from '@application/shopping/read/list-shopping-items-use-case';
import { CountShoppingToBuyUseCase } from '@application/shopping/read/count-shopping-to-buy-use-case';
import { AddShoppingItemUseCase } from '@application/shopping/write/add-shopping-item-use-case';
import { AddRecipeIngredientsUseCase } from '@application/shopping/write/add-recipe-ingredients-use-case';
import { AddShoppingDraftsUseCase } from '@application/shopping/write/add-shopping-drafts-use-case';
import { UpdateShoppingItemUseCase } from '@application/shopping/write/update-shopping-item-use-case';
import { SetShoppingItemCheckedUseCase } from '@application/shopping/write/set-shopping-item-checked-use-case';
import { DeleteShoppingItemUseCase } from '@application/shopping/write/delete-shopping-item-use-case';
import { ClearCheckedShoppingItemsUseCase } from '@application/shopping/write/clear-checked-shopping-items-use-case';
import { ClearShoppingListUseCase } from '@application/shopping/write/clear-shopping-list-use-case';

/** **Shopping composition** — the viewer's shopping list store and one use case per action. */
export const registerShopping = (container: Container): Pick<ApplicationStores, 'shoppingListStore'> => {
  const repo = container.resolve<ShoppingListRepositoryInterface>(TOKENS.ShoppingListRepository);
  const shoppingListStore = configureShoppingListStore({
    list: new ListShoppingItemsUseCase(repo),
    addText: new AddShoppingItemUseCase(repo),
    addFromRecipe: new AddRecipeIngredientsUseCase(repo),
    addDrafts: new AddShoppingDraftsUseCase(repo),
    edit: new UpdateShoppingItemUseCase(repo),
    setChecked: new SetShoppingItemCheckedUseCase(repo),
    remove: new DeleteShoppingItemUseCase(repo),
    clearChecked: new ClearCheckedShoppingItemsUseCase(repo),
    clearAll: new ClearShoppingListUseCase(repo),
    countToBuy: new CountShoppingToBuyUseCase(repo),
  });
  return { shoppingListStore };
};
