import { FoodKind, type FoodKindType } from '@domain/diary/foods/food-kind';
import { FoodThumbIcon, type FoodThumbIconType } from '@presentation/base/widgets/diary/food-thumb-icon';

/** A product's tile: a box for a branded pack, else a cup or a plate by its kind (a plate when unknown). */
export const productThumbIcon = (kind: FoodKindType | null, isBranded: boolean): FoodThumbIconType => {
  if (isBranded) return FoodThumbIcon.Packaged;
  return kind === FoodKind.Drink ? FoodThumbIcon.Drink : FoodThumbIcon.Food;
};
