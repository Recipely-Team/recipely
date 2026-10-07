import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ValueConstants } from '@core/constants';
import { StoreStatus } from '@application/store/store-status';
import type { ShoppingItemEntity } from '@domain/shopping/items/shopping-item-entity';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import type { AssistantScrollableProps } from '@presentation/base/hooks/assistant/actions/assistant-scrollable-props';
import { ListConstants } from '@presentation/base/constants/list-constants';
import { ErrorState } from '@presentation/base/widgets/feedback/error-state';
import { FeedFooter } from '@presentation/base/widgets/lists/feed-footer';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { spacing } from '@presentation/base/theme';
import type { UseShoppingListResult } from '@presentation/app/shopping-list/model/use-shopping-list-result';
import type { ShoppingRow } from '@presentation/app/shopping-list/model/shopping-row';
import { ShoppingAddField } from '@presentation/app/shopping-list/body/shopping-add-field';
import { ShoppingListActions } from '@presentation/app/shopping-list/body/shopping-list-actions';
import { ShoppingItemRow } from '@presentation/app/shopping-list/items/shopping-item-row';
import { t } from '@presentation/i18n';

export interface ShoppingListBodyProps {
  vm: UseShoppingListResult;
  scrollable: AssistantScrollableProps;
  onEdit: (item: ShoppingItemEntity) => void;
}

/**
 * The loaded list: the add field and the clears above, "To buy" then
 * "Completed", the next page on scroll and pull-to-refresh. Rows are bounded
 * with `windowSize` and the batch sizes, never `removeClippedSubviews`.
 */
export const ShoppingListBody = ({ vm, scrollable, onEdit }: ShoppingListBodyProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const list = vm.list;
  const copy = t().shopping;
  const renderRow = ({ item: row }: { item: ShoppingRow }): React.JSX.Element =>
    row.kind === 'heading' ? (
      <ThemedText variant="label" muted accessibilityRole="header" style={styles.heading}>
        {`${row.title} (${String(row.count)})`}
      </ThemedText>
    ) : (
      <ShoppingItemRow item={row.item} onToggle={vm.onToggle} onEdit={onEdit} onRemove={vm.onRemove} />
    );
  return (
    <FlatList
      {...scrollable}
      data={vm.rows}
      keyExtractor={(row) => row.key}
      renderItem={renderRow}
      ItemSeparatorComponent={Separator}
      ListHeaderComponent={
        <View style={styles.header}>
          <ShoppingAddField value={vm.draft} onChangeText={vm.onChangeDraft} onSubmit={vm.onAdd} isAdding={vm.isAdding} />
          <ShoppingListActions checkedCount={vm.checkedCount} itemCount={vm.items.length} onAsk={vm.onAskConfirm} />
        </View>
      }
      ListEmptyComponent={
        list.status === StoreStatus.Loaded ? (
          <ErrorState icon="cart-outline" title={copy.emptyTitle} body={copy.emptyBody} />
        ) : (
          <ActivityIndicator color={colors.primary} style={styles.spinner} />
        )
      }
      ListFooterComponent={
        list.status === StoreStatus.Loaded && list.moreFailure !== null ? (
          <ErrorState icon="cloud-offline-outline" title={copy.loadMoreFailed} primaryLabel={copy.tryAgain} onPrimary={vm.onEndReached} />
        ) : (
          <FeedFooter isLoadingMore={list.status === StoreStatus.Loaded && list.isLoadingMore} />
        )
      }
      refreshControl={<RefreshControl refreshing={vm.isRefreshing} onRefresh={vm.onRefresh} tintColor={colors.primary} />}
      onEndReached={vm.onEndReached}
      onEndReachedThreshold={ListConstants.endReachedThreshold}
      initialNumToRender={ListConstants.initialRows}
      maxToRenderPerBatch={ListConstants.rowsPerBatch}
      windowSize={ListConstants.windowSize}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.content}
    />
  );
};

const Separator = (): React.JSX.Element => <View style={styles.separator} />;

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, flexGrow: ValueConstants.one },
  header: { gap: spacing.md, marginBottom: spacing.md },
  heading: { marginTop: spacing.sm },
  separator: { height: spacing.sm },
  spinner: { marginTop: spacing.xl },
});
