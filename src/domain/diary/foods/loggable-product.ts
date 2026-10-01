import { ValueConstants } from '@core/constants';
import { DiaryLimits } from '@domain/diary/diary-limits';
import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import type { MealSlotType } from '@domain/diary/meal-slot';
import type { Nutrients } from '@domain/diary/nutrition/nutrients';
import type { NewFoodLogEntry } from '@domain/diary/entry/new-food-log-entry';
import type { FoodLogProduct } from '@domain/diary/entry/food-log-product';
import { FoodSource } from '@domain/diary/foods/food-source';
import { FoodQuantity } from '@domain/diary/foods/units/food-quantity';
import { isBaseUnitKey } from '@domain/diary/foods/units/is-base-unit-key';
import type { LoggableProductProps } from '@domain/diary/foods/loggable-product-props';

/**
 * One catalogue product (a variant, or a branded pack) the Add food sheet can
 * log in an amount of one of its units (Add food v2 spec §2b).
 *
 * @remarks
 * - **Nutrients scale from per-100**: `per100 × baseAmount / 100`, never rounded
 *   here; the entry snapshots the totals for the chosen quantity.
 * - **`fromLogged` rebuilds a product from what an entry or a recent row
 *   kept** — one unit and the nutrients of one of it — so a re-log or an edit
 *   offers that unit only; the server only rescales `servings` on an edit.
 */
export class LoggableProduct {
  private constructor(private readonly props: LoggableProductProps) {}

  static of(props: LoggableProductProps): LoggableProduct {
    return new LoggableProduct(props);
  }

  static fromLogged(name: string, product: FoodLogProduct, perUnit: Nutrients): LoggableProduct {
    const amount = product.unitAmount > ValueConstants.zero ? product.unitAmount : ValueConstants.one;
    return new LoggableProduct({
      name,
      imageUrl: null,
      kind: null,
      source: product.source,
      foodVariantId: product.foodVariantId,
      offBarcode: product.offBarcode,
      brand: null,
      packSize: null,
      baseUnit: isBaseUnitKey(product.unitKey) ? product.unitKey : null,
      per100: perUnit.scale(DiaryLimits.PerHundred / amount),
      units: [{ key: product.unitKey, amount }],
    });
  }

  get name(): string {
    return this.props.name;
  }

  get imageUrl(): string | null {
    return this.props.imageUrl;
  }

  get kind(): LoggableProductProps['kind'] {
    return this.props.kind;
  }

  get brand(): string | null {
    return this.props.brand;
  }

  get packSize(): string | null {
    return this.props.packSize;
  }

  get baseUnit(): LoggableProductProps['baseUnit'] {
    return this.props.baseUnit;
  }

  get per100(): Nutrients {
    return this.props.per100;
  }

  get units(): LoggableProductProps['units'] {
    return this.props.units;
  }

  /** A branded pack from Open Food Facts — the sheet names its source and asks the user to check the pack. */
  get isBranded(): boolean {
    return this.props.source === FoodSource.OpenFoodFacts;
  }

  defaultQuantity(): FoodQuantity {
    return FoodQuantity.defaultFor(this.props.units);
  }

  nutrientsFor(quantity: FoodQuantity): Nutrients {
    return this.props.per100.scale(quantity.baseAmount / DiaryLimits.PerHundred);
  }

  entryFor(date: CalendarDate, meal: MealSlotType, quantity: FoodQuantity): NewFoodLogEntry {
    return {
      date,
      meal,
      name: this.props.name,
      servings: quantity.value,
      nutrients: this.nutrientsFor(quantity),
      recipeId: null,
      product: {
        source: this.props.source,
        foodVariantId: this.props.foodVariantId,
        offBarcode: this.props.offBarcode,
        unitKey: quantity.unit.key,
        unitAmount: quantity.unit.amount,
      },
    };
  }
}
