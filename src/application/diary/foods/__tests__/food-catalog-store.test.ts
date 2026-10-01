import type { NotFoundFailure } from '@core/failure';
import { ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { StoreStatus } from '@application/store/store-status';
import type { FoodDetail } from '@domain/diary/foods/product/food-detail';
import { configureFoodCatalogStore } from '@application/diary/foods/food-catalog-store';
import { ListFoodCategoriesUseCase } from '@application/diary/foods/browse/list-food-categories-use-case';
import { ListFoodProductsUseCase } from '@application/diary/foods/browse/list-food-products-use-case';
import { ListRecentFoodPageUseCase } from '@application/diary/foods/browse/list-recent-food-page-use-case';
import { LoadFoodDetailUseCase } from '@application/diary/foods/detail/load-food-detail-use-case';
import { fakeFoodCatalogRepository, pageOf, productOf } from '@application/diary/foods/__fixtures__/food-fixtures';

const setup = () => {
  const repo = fakeFoodCatalogRepository();
  const store = configureFoodCatalogStore({
    listCategories: new ListFoodCategoriesUseCase(repo),
    listProducts: new ListFoodProductsUseCase(repo),
    listRecent: new ListRecentFoodPageUseCase(repo),
    loadDetail: new LoadFoodDetailUseCase(repo),
  });
  return { repo, store };
};

const detailOf = (row = productOf()): FoodDetail => {
  const detail = row.asDetail;
  if (detail === null) throw new Error('no detail');
  return detail;
};

describe('foodCatalogStore', () => {
  it('loads the shelves and every product, then a shelf’s products from page 1 and on', async () => {
    const { repo, store } = setup();
    repo.listCategories.mockResolvedValue(ok(pageOf([{ key: 'dairy', name: 'Dairy', productCount: 12 }])));
    repo.listProducts.mockResolvedValue(ok(pageOf([productOf()], 1, 30, 20)));
    await store.getState().loadProducts();
    expect(repo.listCategories).toHaveBeenCalledWith(1, 20);
    expect(repo.listProducts).toHaveBeenCalledWith(null, 1, 20);

    await store.getState().selectCategory('dairy');
    repo.listProducts.mockResolvedValue(ok(pageOf([productOf({ foodVariantId: 'v2' })], 2, 30, 20)));
    await store.getState().loadMoreProducts();
    expect(repo.listProducts).toHaveBeenLastCalledWith('dairy', 2, 20);
    const products = store.getState().products;
    expect(products.status === StoreStatus.Loaded && products.items).toHaveLength(2);
  });

  it('pages the recent foods', async () => {
    const { repo, store } = setup();
    repo.listRecent.mockResolvedValue(ok(pageOf([], 1, 40, 20)));
    await store.getState().loadRecent();
    await store.getState().loadMoreRecent();
    expect(repo.listRecent).toHaveBeenLastCalledWith(2, 20);
  });

  it('opens a curated product by id, a branded one by barcode, and shows only the newest', async () => {
    const { repo, store } = setup();
    let answerFirst: (r: Result<FoodDetail, NotFoundFailure>) => void = () => undefined;
    repo.getProduct.mockReturnValueOnce(new Promise((r) => (answerFirst = r)));
    repo.getBrandedProduct.mockResolvedValue(ok(detailOf()));
    const curated = productOf();
    const branded = productOf({ source: 'openfoodfacts', foodId: null, foodVariantId: null, offBarcode: '869', brand: 'Sütaş' });
    const first = store.getState().openProduct(curated);
    await store.getState().openProduct(branded);
    answerFirst(ok(detailOf()));
    await first;
    expect(repo.getProduct).toHaveBeenCalledWith('f1');
    expect(repo.getBrandedProduct).toHaveBeenCalledWith('869');
    const detail = store.getState().detail;
    expect(detail.status === StoreStatus.Loaded && detail.key).toBe(branded.key);
  });

  it('opens a row with neither id nor barcode as itself', async () => {
    const { repo, store } = setup();
    await store.getState().openProduct(productOf({ foodId: null, offBarcode: null }));
    expect(repo.getProduct).not.toHaveBeenCalled();
    expect(store.getState().detail.status).toBe(StoreStatus.Loaded);
  });
});
