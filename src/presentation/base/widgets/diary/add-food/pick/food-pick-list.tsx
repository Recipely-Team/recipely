import { StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import type { FoodProduct } from '@domain/diary/foods/product/food-product';
import type { RecipeFoodHit } from '@domain/diary/foods/search/recipe-food-hit';
import type { RecentFoodType } from '@domain/diary/foods/search/recent-food';
import { ListConstants } from '@presentation/base/constants/list-constants';
import type { PickRowEntryType } from '@presentation/base/widgets/diary/add-food/list/pick-row';
import { PickRowView } from '@presentation/base/widgets/diary/add-food/pick/rows/pick-row-view';
import { ValueConstants } from '@core/constants';

export interface FoodPickListProps {
  rows: readonly PickRowEntryType[];
  /** Above the rows, scrolling with them (the Products tab's shelves). */
  header?: React.ReactElement;
  /** The end of the list is near: load the next page of whatever pages next. */
  onEndReached: () => void;
  onPickRecipe?: (hit: RecipeFoodHit) => void;
  onPickProduct?: (product: FoodProduct) => void;
  onPickRecent?: (recent: RecentFoodType) => void;
  onRetryMore: (listKey: string) => void;
}

/**
 * The pick step's scrolling list — headings, rows and next-page rows — that
 * pages on scroll through `onEndReached` (Add food v2 spec §3, a list in
 * place of the prototype's sentinel). Its own scroll: the sheet lays it out
 * with `scrollsItself`, so it virtualises and reaches its end.
 *
 * @remarks
 * - **FlashList** — rows are recycled rather than mounted per item, and
 *   `getItemType` keeps a heading's view from being reused for a food row.
 */
export const FoodPickList = ({ rows, header, onEndReached, ...handlers }: FoodPickListProps): React.JSX.Element => (
  <FlashList
    data={rows}
    keyExtractor={(row) => row.key}
    getItemType={(row) => row.type}
    renderItem={({ item }) => <PickRowView row={item} {...handlers} />}
    ListHeaderComponent={header}
    onEndReached={onEndReached}
    onEndReachedThreshold={ListConstants.endReachedThreshold}
    keyboardShouldPersistTaps="handled"
    keyboardDismissMode="on-drag"
    showsVerticalScrollIndicator={false}
    style={styles.list}
  />
);

const styles = StyleSheet.create({
  list: { flexGrow: ValueConstants.zero, flexShrink: ValueConstants.one },
});
