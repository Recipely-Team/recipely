import type { Mapper } from '@core/mapper/mapper';
import { ok } from '@core/result/result-helpers';
import type { ShoppingAddResult } from '@domain/shopping/items/shopping-add-result';
import type { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';
import type { ShoppingAddResponseDto } from '@infrastructure/shopping/dtos/shopping-add-response-dto';
import { toShoppingItem } from '@infrastructure/shopping/to-shopping-item';

/** The add answer → `ShoppingAddResult`; an unreadable line is skipped, the counts are the server's. */
export const toShoppingAddResult: Mapper<ShoppingAddResponseDto, ShoppingAddResult> = (dto) => {
  const items: ShoppingItemEntity[] = [];
  for (const raw of dto.items) {
    const mapped = toShoppingItem(raw);
    if (mapped.ok) items.push(mapped.value);
  }
  return ok({ items, added: dto.added, merged: dto.merged });
};
