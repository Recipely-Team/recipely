import type { FoodSearchStoreState } from '@application/diary/foods/food-search-store-state';
import { CharConstants } from '@core/constants';
import { FoodSearchGroup, type FoodSearchGroupType } from '@domain/diary/foods/search/food-search-group';
import type { PickRow } from '@presentation/base/widgets/diary/add-food/list/pick-row';
import { PickRowType } from '@presentation/base/widgets/diary/add-food/list/pick-row-type';
import { pagedRows } from '@presentation/base/widgets/diary/add-food/list/paged-rows';

/** The four groups as the store holds them. */
type SearchLists = Pick<FoodSearchStoreState, FoodSearchGroupType>;

/** The search groups in display order (Add food v2 spec §3). */
export const SEARCH_GROUP_ORDER: readonly FoodSearchGroupType[] = [
  FoodSearchGroup.Saved,
  FoodSearchGroup.Mine,
  FoodSearchGroup.Products,
  FoodSearchGroup.Recipes,
];

/**
 * The search's rows: each group with something in it under its heading, in
 * display order; an empty or unasked group draws nothing. `titles` names the
 * groups — "Recipes" when searching, "From Recipely" on the Recipes tab.
 *
 * @remarks
 * - **A recipe is listed once**, under the first group holding it — Saved
 *   before My recipes. The server dedupes a search, but not the Recipes tab's
 *   unfiltered groups (backend #373), so a saved recipe of the user's own
 *   would otherwise show twice.
 */
export const searchRows = (lists: SearchLists, titles: Readonly<Record<FoodSearchGroupType, string>>): PickRow[] => {
  const shown = new Set<string>();
  return SEARCH_GROUP_ORDER.flatMap((group) => {
    const rows =
      group === FoodSearchGroup.Products
        ? pagedRows(lists.products, group, (product) => ({ type: PickRowType.Product, key: product.key, product }))
        : pagedRows(lists[group], group, (hit) => ({ type: PickRowType.Recipe, key: [group, hit.key].join(CharConstants.colon), hit })).filter(
            (row) => {
              if (row.type !== PickRowType.Recipe) return true;
              if (shown.has(row.hit.id)) return false;
              shown.add(row.hit.id);
              return true;
            },
          );
    if (!rows.some((row) => row.type !== PickRowType.More)) return [];
    return [{ type: PickRowType.Heading, key: [PickRowType.Heading, group].join(CharConstants.colon), title: titles[group] }, ...rows];
  });
};
