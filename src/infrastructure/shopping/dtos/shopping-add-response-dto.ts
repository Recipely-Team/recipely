import type { ShoppingItemDto } from '@infrastructure/shopping/dtos/shopping-item-dto';

// `POST /me/shopping-list/items` → 201: the touched lines in their final state.
export interface ShoppingAddResponseDto {
  items: ShoppingItemDto[];
  added: number;
  merged: number;
}
