import type { Mapper } from '@core/mapper/mapper';
import type { ValidationFailure } from '@core/failure';
import { ValueConstants } from '@core/constants';
import { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';
import type { ShoppingItemDto } from '@infrastructure/shopping/dtos/shopping-item-dto';

/** An ISO timestamp → `Date`; the epoch for one that does not parse (the field is informational). */
const dateOf = (raw: string): Date => {
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? new Date(ValueConstants.zero) : date;
};

/** A shopping line → `ShoppingItemEntity`; a blank id or label is refused (and skipped by `toPage`). */
export const toShoppingItem: Mapper<ShoppingItemDto, ShoppingItemEntity, ValidationFailure> = (dto) =>
  ShoppingItemEntity.create({
    id: dto.id,
    label: dto.label,
    quantity: dto.quantity,
    unit: dto.unit,
    recipeId: dto.recipeId,
    recipeName: dto.recipeName,
    checked: dto.checked,
    position: dto.position,
    createdAt: dateOf(dto.createdAt),
    updatedAt: dateOf(dto.updatedAt),
  });
