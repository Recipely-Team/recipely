import type { RequestMapper } from '@core/mapper/request-mapper';
import type { ShoppingItemDraft } from '@domain/shopping/items/shopping-item-draft';
import type { ShoppingAddRequestDto } from '@infrastructure/shopping/dtos/shopping-add-request-dto';

/** Drafts → `POST /me/shopping-list/items` body; a field a draft does not have is left out. */
export const toShoppingAddRequest: RequestMapper<readonly ShoppingItemDraft[], ShoppingAddRequestDto> = (drafts) => ({
  items: drafts.map((draft) => ({
    label: draft.label,
    ...(draft.quantity === null ? {} : { quantity: draft.quantity }),
    ...(draft.unit === null ? {} : { unit: draft.unit }),
    ...(draft.recipeId === null ? {} : { recipeId: draft.recipeId }),
    ...(draft.recipeName === null ? {} : { recipeName: draft.recipeName }),
  })),
});
