import { ok } from '@core/result/result-helpers';
import { RecentFoodKind } from '@domain/diary/foods/search/recent-food-kind';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import { withHttpVerbs } from '@infrastructure/network/http/__fixtures__/with-http-verbs';
import { FoodCatalogRepository } from '@infrastructure/diary/foods/food-catalog-repository';
import { FoodsWireSamples } from '@infrastructure/diary/foods/__fixtures__/foods-wire-samples';

const answering = (json: string): HttpClient => {
  const body: unknown = JSON.parse(json);
  return withHttpVerbs(jest.fn(() => Promise.resolve(ok(body))));
};

// The recent DTO once typed `perUnit` as `{ calories }`: the server sends `{ kcal }`, so every product row was dropped.
describe('foods endpoints read the contract’s own JSON', () => {
  it('keeps a recent product row, at its unit, with totals from perUnit', async () => {
    const r = await new FoodCatalogRepository(answering(FoodsWireSamples.recentPage)).listRecent(1, 20);
    if (!r.ok) throw new Error('expected ok');
    expect(r.value.items.map((item) => item.kind)).toEqual([RecentFoodKind.Product, RecentFoodKind.Food]);
    const product = r.value.items[0];
    if (product?.kind !== RecentFoodKind.Product) throw new Error('expected a product');
    expect(product.product.nutrientsFor(product.quantity).calories).toBeCloseTo(78);
  });

  it('keeps every search row: a draft of mine, a curated variant and a branded pack', async () => {
    const r = await new FoodCatalogRepository(answering(FoodsWireSamples.searchFirstPage)).search('ayran', 8);
    if (!r.ok) throw new Error('expected ok');
    expect(r.value.mine.items.map((hit) => hit.isDraft)).toEqual([true]);
    expect(r.value.products.items.map((p) => p.displayName)).toEqual(['Ayran · Az yağlı', 'Sütaş Ayran']);
  });
});
