import { ok } from '@core/result/result-helpers';
import type { Page } from '@domain/common/page';
import { nutrientsOf } from '@domain/diary/__fixtures__/nutrients-of';
import { FoodProduct } from '@domain/diary/foods/product/food-product';
import type { FoodProductProps } from '@domain/diary/foods/product/food-product-props';
import { RecipeFoodHit } from '@domain/diary/foods/search/recipe-food-hit';
import type { FoodCatalogRepositoryInterface } from '@domain/diary/foods/food-catalog-repository-interface';

/** A searched recipe for a test. */
export const hitOf = (id: string, isDraft = false): RecipeFoodHit =>
  RecipeFoodHit.of({ id, name: `Recipe ${id}`, imageUrl: null, perServing: nutrientsOf({ calories: 300, protein: 20 }), isDraft });

/** A curated product row for a test. */
export const productOf = (overrides: Partial<FoodProductProps> = {}): FoodProduct =>
  FoodProduct.of({
    source: 'curated', foodId: 'f1', foodVariantId: 'v1', offBarcode: null, kind: 'drink', category: 'dairy', name: 'Ayran',
    variantName: 'Klasik', variantCount: 3, brand: null, packSize: null, unit: 'ml',
    per100: nutrientsOf({ calories: 38, protein: 1.7, carbs: 2.5, fat: 2, fiber: 0 }), servingUnits: [{ key: 'glass', amount: 200 }],
    imageUrl: null, ...overrides,
  });

/** One page of `items`, with more after it while `page * size < total`. */
export const pageOf = <T>(items: readonly T[], page = 1, total = items.length, pageSize = 8): Page<T> => ({
  items, total, page, pageSize, hasMore: page * pageSize < total,
});

/** A catalogue repository whose every list answers an empty first page unless the test overrides it. */
export const fakeFoodCatalogRepository = (): jest.Mocked<FoodCatalogRepositoryInterface> => ({
  search: jest.fn().mockResolvedValue(ok({ query: 'x', saved: pageOf([]), mine: pageOf([]), products: pageOf([]), recipes: pageOf([]) })),
  searchRecipes: jest.fn().mockResolvedValue(ok(pageOf([]))),
  searchProducts: jest.fn().mockResolvedValue(ok(pageOf([]))),
  listCategories: jest.fn().mockResolvedValue(ok(pageOf([]))),
  listProducts: jest.fn().mockResolvedValue(ok(pageOf([]))),
  getProduct: jest.fn(),
  getBrandedProduct: jest.fn(),
  listRecent: jest.fn().mockResolvedValue(ok(pageOf([]))),
});
