import type { Result } from '@core/result/result';
import { fail, ok } from '@core/result/result-helpers';
import { NotFoundFailure, type Failure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import type { FoodProduct } from '@domain/diary/foods/product/food-product';
import type { FoodDetail } from '@domain/diary/foods/product/food-detail';
import type { FoodCatalogRepositoryInterface } from '@domain/diary/foods/food-catalog-repository-interface';

/**
 * Every variant of a listed product, for the product step: a curated food by
 * its id, a branded pack by its barcode, and — when the row names neither —
 * the row itself as a one-variant product rather than a dead end.
 */
export class LoadFoodDetailUseCase {
  constructor(private readonly repo: FoodCatalogRepositoryInterface) {}

  async execute(product: FoodProduct): Promise<Result<FoodDetail, Failure>> {
    if (product.foodId !== null) return this.repo.getProduct(product.foodId);
    if (product.offBarcode !== null) return this.repo.getBrandedProduct(product.offBarcode);
    const detail = product.asDetail;
    return detail === null ? fail(new NotFoundFailure(DiagnosticMessage.diary.foodWithoutVariants)) : ok(detail);
  }
}
