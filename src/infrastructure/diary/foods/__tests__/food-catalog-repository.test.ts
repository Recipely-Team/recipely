import { NotFoundFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { FoodSearchGroup } from '@domain/diary/foods/search/food-search-group';
import { RecentFoodKind } from '@domain/diary/foods/search/recent-food-kind';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import { withHttpVerbs } from '@infrastructure/network/http/__fixtures__/with-http-verbs';
import { FoodCatalogRepository } from '@infrastructure/diary/foods/food-catalog-repository';
import type { FoodProductDto } from '@infrastructure/diary/foods/dtos/food-product-dto';
import type { RecipeHitDto } from '@infrastructure/diary/foods/dtos/recipe-hit-dto';
import type { FoodDetailDto } from '@infrastructure/diary/foods/dtos/food-detail-dto';
import { toFoodSearchQuery } from '@infrastructure/diary/foods/write/to-food-search-query';
import { toFoodProductsQuery } from '@infrastructure/diary/foods/write/to-food-products-query';

interface RequestCall {
  method?: string;
  url?: string;
  params?: unknown;
}

const makeHttp = (result: Result<unknown, unknown>): { http: HttpClient; calls: RequestCall[] } => {
  const calls: RequestCall[] = [];
  const http = withHttpVerbs(
    jest.fn((config: RequestCall) => {
      calls.push(config);
      return Promise.resolve(result);
    }),
  );
  return { http, calls };
};

const hit = (id: string, overrides: Partial<RecipeHitDto> = {}): RecipeHitDto => ({
  id, name: `Recipe ${id}`, image: '', servings: 4, caloriesPerServing: 300, protein: 20, carbs: 30, fat: 10, fiber: null,
  servingWeightGrams: null, status: 'approved', isPublished: true, ...overrides,
});

const ayran: FoodProductDto = {
  source: 'curated', foodId: 'f1', foodVariantId: 'v2', offBarcode: null, kind: 'drink', category: 'dairy',
  name: 'Ayran', variantName: 'Az yağlı', variantCount: 3, brand: null, packSize: null, unit: 'ml',
  per100: { kcal: 26, protein: 1.5, carbs: 2, fat: 1, fiber: null }, servingUnits: [{ key: 'glass', amount: 200 }], imageUrl: null,
};

const envelope = <T,>(items: T[], page = 1, total = items.length) => ({ items, total, page, pageSize: 8 });

describe('food request mappers', () => {
  it('puts the requested page, size and group in the search query, and leaves an empty query out', () => {
    expect(toFoodSearchQuery({ query: ' tomato ', group: FoodSearchGroup.Mine, page: 3, pageSize: 8 })).toEqual({
      q: 'tomato', group: 'mine', page: 3, pageSize: 8,
    });
    expect(toFoodSearchQuery({ query: '', group: FoodSearchGroup.Saved, page: 1, pageSize: 8 })).toEqual({ group: 'saved', page: 1, pageSize: 8 });
    expect(toFoodSearchQuery({ query: 'x', group: null, page: 1, pageSize: 8 })).toEqual({ q: 'x', page: 1, pageSize: 8 });
  });

  it('puts the shelf and the requested page in the products query', () => {
    expect(toFoodProductsQuery({ category: 'dairy', page: 2, pageSize: 20 })).toEqual({ category: 'dairy', page: 2, pageSize: 20 });
    expect(toFoodProductsQuery({ category: null, page: 1, pageSize: 20 })).toEqual({ page: 1, pageSize: 20 });
  });
});

describe('FoodCatalogRepository', () => {
  it('searches every group at once and reads each group as a page, drafts tagged', async () => {
    const { http, calls } = makeHttp(
      ok({
        query: 'tomato',
        saved: envelope([hit('s1')], 1, 9),
        mine: envelope([hit('m1', { isPublished: false, status: 'pending' })]),
        products: envelope([ayran]),
        recipes: envelope([hit('r1'), hit('bad', { caloriesPerServing: -1 })], 1, 2),
      }),
    );
    const r = await new FoodCatalogRepository(http).search('tomato', 8);
    expect(calls[0]).toMatchObject({ method: 'GET', url: '/diary/foods/search', params: { q: 'tomato', page: 1, pageSize: 8 } });
    if (!r.ok) throw new Error('expected ok');
    expect(r.value.saved.hasMore).toBe(true);
    expect(r.value.mine.items[0]?.isDraft).toBe(true);
    expect(r.value.products.items[0]?.displayName).toBe('Ayran · Az yağlı');
    expect(r.value.recipes.items.map((h) => h.id)).toEqual(['r1']);
  });

  it('asks for one group’s next page with the group and page in the query', async () => {
    const { http, calls } = makeHttp(ok(envelope([hit('s9')], 2, 9)));
    const repo = new FoodCatalogRepository(http);
    const r = await repo.searchRecipes('tomato', FoodSearchGroup.Saved, 2, 8);
    await repo.searchProducts('tomato', 4, 8);
    expect(calls[0]).toMatchObject({ params: { q: 'tomato', group: 'saved', page: 2, pageSize: 8 } });
    expect(calls[1]).toMatchObject({ params: { q: 'tomato', group: 'products', page: 4, pageSize: 8 } });
    expect(r.ok && r.value.page).toBe(2);
  });

  it('lists categories, a shelf’s products and recent foods with the requested page', async () => {
    const { http, calls } = makeHttp(ok(envelope([])));
    const repo = new FoodCatalogRepository(http);
    await repo.listCategories(1, 20);
    await repo.listProducts('dairy', 2, 20);
    await repo.listRecent(3, 20);
    expect(calls[0]).toMatchObject({ url: '/diary/foods/categories', params: { page: 1, pageSize: 20 } });
    expect(calls[1]).toMatchObject({ url: '/diary/foods/products', params: { category: 'dairy', page: 2, pageSize: 20 } });
    expect(calls[2]).toMatchObject({ url: '/diary/foods/recent', params: { page: 3, pageSize: 20 } });
  });

  it('reads a recent product at its own unit and quantity, and a recipe as one serving', async () => {
    const product = { source: 'curated', foodVariantId: 'v2', offBarcode: null, unitKey: 'glass', unitAmount: 200, foodId: 'f1',
      perUnit: { calories: 52, protein: 3, carbs: 4, fat: 2, fiber: null } };
    const base = { calories: 78, protein: 4.5, carbs: 6, fat: 3, fiber: null, recipeId: null, recipeImageUrl: null };
    const { http } = makeHttp(ok(envelope([{ ...base, name: 'Ayran · Az yağlı', servings: 1.5, product }, { ...base, name: 'Menemen', servings: 1, recipeId: 'r1', product: null }])));
    const r = await new FoodCatalogRepository(http).listRecent(1, 20);
    if (!r.ok) throw new Error('expected ok');
    const [first, second] = r.value.items;
    expect(first?.kind).toBe(RecentFoodKind.Product);
    if (first?.kind === RecentFoodKind.Product) {
      expect(first.quantity.value).toBe(1.5);
      expect(first.quantity.unit).toEqual({ key: 'glass', amount: 200 });
      expect(first.product.nutrientsFor(first.quantity).calories).toBeCloseTo(78);
    }
    expect(second?.kind).toBe(RecentFoodKind.Food);
  });

  it('reads a product detail by id and a branded one by barcode', async () => {
    const detail: FoodDetailDto = {
      source: 'curated', foodId: 'f1', offBarcode: null, kind: 'drink', category: 'dairy', name: 'Ayran', brand: null, packSize: null,
      unit: 'ml', imageUrl: null,
      variants: [
        { foodVariantId: 'v1', name: 'Klasik', per100: { kcal: 38, protein: 1.7, carbs: 2.5, fat: 2, fiber: null }, servingUnits: [{ key: 'glass', amount: 200 }] },
        { foodVariantId: 'v2', name: 'Az yağlı', per100: ayran.per100, servingUnits: [{ key: 'glass', amount: 200 }] },
      ],
    };
    const { http, calls } = makeHttp(ok(detail));
    const repo = new FoodCatalogRepository(http);
    const r = await repo.getProduct('f1');
    await repo.getBrandedProduct('8690504012345');
    expect(calls[0]).toMatchObject({ url: '/diary/foods/products/f1' });
    expect(calls[1]).toMatchObject({ url: '/diary/foods/products/barcode/8690504012345' });
    if (!r.ok) throw new Error('expected ok');
    expect(r.value.variantIndexOf('v2')).toBe(1);
    expect(r.value.productAt(1).name).toBe('Ayran · Az yağlı');
    expect(r.value.productAt(1).units.map((u) => u.key)).toEqual(['glass', 'ml']);
  });

  it('passes an HTTP failure through untouched', async () => {
    const failure = new NotFoundFailure('gone');
    const { http } = makeHttp(fail(failure));
    const r = await new FoodCatalogRepository(http).getProduct('nope');
    expect(!r.ok && r.failure).toBe(failure);
  });
});
