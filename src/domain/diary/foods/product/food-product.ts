import { CharConstants } from '@core/constants';
import { FoodSource } from '@domain/diary/foods/food-source';
import { LoggableProduct } from '@domain/diary/foods/loggable-product';
import { foodDisplayName } from '@domain/diary/foods/product/food-display-name';
import { withBaseUnit } from '@domain/diary/foods/product/with-base-unit';
import type { FoodProductProps } from '@domain/diary/foods/product/food-product-props';

/**
 * One product row of the Add food sheet — a curated variant or a branded pack
 * — as the catalogue lists it. A read model: the server owns the catalogue.
 */
export class FoodProduct {
  private constructor(private readonly props: FoodProductProps) {}

  static of(props: FoodProductProps): FoodProduct {
    return new FoodProduct(props);
  }

  /** Stable across pages: the variant, else the barcode, else the food. */
  get key(): string {
    return [this.props.source, this.props.foodVariantId ?? this.props.offBarcode ?? this.props.foodId ?? this.props.name].join(
      CharConstants.colon,
    );
  }

  get displayName(): string {
    return foodDisplayName(this.props);
  }

  get isBranded(): boolean {
    return this.props.source === FoodSource.OpenFoodFacts;
  }

  get foodId(): string | null {
    return this.props.foodId;
  }

  get foodVariantId(): string | null {
    return this.props.foodVariantId;
  }

  get offBarcode(): string | null {
    return this.props.offBarcode;
  }

  get kind(): FoodProductProps['kind'] {
    return this.props.kind;
  }

  get variantCount(): number {
    return this.props.variantCount;
  }

  get brand(): string | null {
    return this.props.brand;
  }

  get packSize(): string | null {
    return this.props.packSize;
  }

  get unit(): FoodProductProps['unit'] {
    return this.props.unit;
  }

  get per100(): FoodProductProps['per100'] {
    return this.props.per100;
  }

  get imageUrl(): string | null {
    return this.props.imageUrl;
  }

  /** This row as it stands, loggable without the detail request (the assistant logs from it). */
  get loggable(): LoggableProduct {
    return LoggableProduct.of({
      name: this.displayName,
      imageUrl: this.props.imageUrl,
      kind: this.props.kind,
      source: this.props.source,
      foodVariantId: this.props.foodVariantId,
      offBarcode: this.props.offBarcode,
      brand: this.props.brand,
      packSize: this.props.packSize,
      baseUnit: this.props.unit,
      per100: this.props.per100,
      units: withBaseUnit(this.props.servingUnits, this.props.unit),
    });
  }
}
