import type { RequestMapper } from '@core/mapper/request-mapper';
import type { ShoppingItemChanges } from '@domain/shopping/items/shopping-item-changes';
import type { ShoppingItemChangesRequestDto } from '@infrastructure/shopping/dtos/shopping-item-changes-request-dto';

/** `ShoppingItemChanges` → `PATCH` body; unset fields are left out, a cleared amount or unit is sent as null. */
export const toShoppingItemChangesRequest: RequestMapper<ShoppingItemChanges, ShoppingItemChangesRequestDto> = (changes) => ({
  ...(changes.label === undefined ? {} : { label: changes.label }),
  ...(changes.quantity === undefined ? {} : { quantity: changes.quantity }),
  ...(changes.unit === undefined ? {} : { unit: changes.unit }),
  ...(changes.checked === undefined ? {} : { checked: changes.checked }),
});
