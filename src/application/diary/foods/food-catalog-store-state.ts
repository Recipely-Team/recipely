import type { FoodCategory } from '@domain/diary/foods/food-category';
import type { FoodProduct } from '@domain/diary/foods/product/food-product';
import type { RecentFood } from '@domain/diary/foods/search/recent-food';
import type { PagedList } from '@application/store/paging/paged-list';
import type { FoodDetailState } from '@application/diary/foods/food-detail-state';

export interface FoodCatalogStoreState {
  categories: PagedList<FoodCategory>;
  /** The shelf `products` lists; null lists every shelf. */
  category: string | null;
  products: PagedList<FoodProduct>;
  recent: PagedList<RecentFood>;
  detail: FoodDetailState;
  /** Loads the shelves and the products of the selected one, from their first pages. */
  loadProducts: () => Promise<void>;
  loadMoreCategories: () => Promise<void>;
  /** Shows another shelf (or every shelf), from its first page. */
  selectCategory: (category: string | null) => Promise<void>;
  loadMoreProducts: () => Promise<void>;
  /** The Recent tab, from its first page — reloaded each time, since every log changes it. */
  loadRecent: () => Promise<void>;
  loadMoreRecent: () => Promise<void>;
  /** Fetches every variant of a listed product; the newest call wins. */
  openProduct: (product: FoodProduct) => Promise<void>;
  closeProduct: () => void;
  /** Drops everything. Called when the session ends. */
  clear: () => void;
}
