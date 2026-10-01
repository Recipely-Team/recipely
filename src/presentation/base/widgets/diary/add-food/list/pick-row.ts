import type { FoodProduct } from '@domain/diary/foods/product/food-product';
import type { RecentFood } from '@domain/diary/foods/search/recent-food';
import type { RecipeFoodHit } from '@domain/diary/foods/search/recipe-food-hit';
import type { PickRowType } from '@presentation/base/widgets/diary/add-food/list/pick-row-type';

/** One row of the pick step's `FlatList`; `key` is stable across pages. */
export type PickRow =
  | { type: typeof PickRowType.Heading; key: string; title: string }
  | { type: typeof PickRowType.Recipe; key: string; hit: RecipeFoodHit }
  | { type: typeof PickRowType.Product; key: string; product: FoodProduct }
  | { type: typeof PickRowType.Recent; key: string; recent: RecentFood }
  | { type: typeof PickRowType.More; key: string; listKey: string; failed: boolean };
