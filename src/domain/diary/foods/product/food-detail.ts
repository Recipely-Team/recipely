import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { ValueConstants } from '@core/constants';
import { LoggableProduct } from '@domain/diary/foods/loggable-product';
import type { FoodVariant } from '@domain/diary/foods/product/food-variant';
import { foodDisplayName } from '@domain/diary/foods/product/food-display-name';
import { withBaseUnit } from '@domain/diary/foods/product/with-base-unit';
import type { FoodDetailProps } from '@domain/diary/foods/product/food-detail-props';

/**
 * A product with every variant — what the product step opens (Add food v2
 * spec §2b). Each variant becomes a `LoggableProduct` of its own, so changing
 * the variant swaps the per-100 figures and the serving units together.
 */
export class FoodDetail {
  private constructor(private readonly props: FoodDetailProps) {}

  static create(props: FoodDetailProps): Result<FoodDetail, ValidationFailure> {
    if (props.variants.length === ValueConstants.zero) {
      return fail(new ValidationFailure(DiagnosticMessage.diary.foodWithoutVariants, 'variants'));
    }
    return ok(new FoodDetail(props));
  }

  get name(): string {
    return this.props.name;
  }

  get variants(): readonly FoodVariant[] {
    return this.props.variants;
  }

  /** The variant a list row pointed at, or the first when it is not (or no longer) there. */
  variantIndexOf(foodVariantId: string | null): number {
    const index = this.props.variants.findIndex((variant) => variant.foodVariantId === foodVariantId);
    return index < ValueConstants.zero ? ValueConstants.zero : index;
  }

  productAt(index: number): LoggableProduct {
    const variant = this.props.variants[index] ?? this.props.variants[ValueConstants.zero];
    return LoggableProduct.of({
      name: foodDisplayName({
        name: this.props.name,
        variantName: variant.name,
        variantCount: this.props.variants.length,
        brand: this.props.brand,
      }),
      imageUrl: this.props.imageUrl,
      kind: this.props.kind,
      source: this.props.source,
      foodVariantId: variant.foodVariantId,
      offBarcode: this.props.offBarcode,
      brand: this.props.brand,
      packSize: this.props.packSize,
      baseUnit: this.props.unit,
      per100: variant.per100,
      units: withBaseUnit(variant.servingUnits, this.props.unit),
    });
  }
}
