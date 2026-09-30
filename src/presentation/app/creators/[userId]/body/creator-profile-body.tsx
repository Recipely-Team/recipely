import { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { StoreStatus } from '@application/store/store-status';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { ValueConstants } from '@core/constants';
import { ListConstants } from '@presentation/base/constants';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { fontSizes, spacing } from '@presentation/base/theme';
import { failureContent, failureIcon, failureSeverity, failureToastMessage } from '@presentation/base/errors/failure-lookups';
import { ErrorState } from '@presentation/base/widgets/feedback/error-state';
import { FeedFooter } from '@presentation/base/widgets/lists/feed-footer';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import type { AssistantScrollableProps } from '@presentation/base/hooks/assistant/actions/assistant-scrollable-props';
import { t } from '@presentation/i18n';
import { CreatorProfileSummary } from '@presentation/app/creators/[userId]/body/creator-profile-summary';
import { CreatorRecipeCell } from '@presentation/app/creators/[userId]/items/creator-recipe-cell';
import { CreatorProfileMetrics } from '@presentation/app/creators/[userId]/model/creator-profile-metrics';
import type { UseCreatorProfileResult } from '@presentation/app/creators/[userId]/model/use-creator-profile-result';

export interface CreatorProfileBodyProps {
  vm: UseCreatorProfileResult;
  scrollable: AssistantScrollableProps;
}

/** An empty cell that keeps a short last row at the grid's column width. */
interface GridFiller {
  readonly filler: true;
  readonly id: string;
}

type GridCell = RecipeSummaryEntity | GridFiller;

const isFiller = (cell: GridCell): cell is GridFiller => 'filler' in cell;
const keyOf = (cell: GridCell): string => cell.id;

/**
 * The creator page below its top bar, by profile state: a spinner, the error
 * with a retry, or the page — summary on top, recipe grid under it, paging as
 * it scrolls and pull-to-refresh throughout.
 */
export const CreatorProfileBody = ({ vm, scrollable }: CreatorProfileBodyProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const { profileState, recipesState, gridColumns, onOpenRecipe } = vm;

  const cells = useMemo<GridCell[]>(() => {
    const short = (gridColumns - (vm.recipes.length % gridColumns)) % gridColumns;
    return [...vm.recipes, ...Array.from({ length: short }, (_, index) => ({ filler: true as const, id: `filler-${index}` }))];
  }, [vm.recipes, gridColumns]);

  const renderItem = useCallback(
    ({ item }: { item: GridCell }) =>
      isFiller(item) ? <View style={styles.filler} /> : <CreatorRecipeCell recipe={item} onOpen={onOpenRecipe} />,
    [onOpenRecipe],
  );

  if (profileState.status === StoreStatus.Error) {
    const content = failureContent(profileState.failure);
    return (
      <ErrorState
        severity={failureSeverity(profileState.failure)}
        icon={failureIcon(profileState.failure)}
        title={content.title}
        body={content.body}
        primaryLabel={t().errors.retry}
        onPrimary={vm.onRefresh}
      />
    );
  }
  if (profileState.status !== StoreStatus.Loaded) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const emptyNote =
    recipesState.status === StoreStatus.Error ? failureToastMessage(recipesState.failure) : t().creators.noRecipes;

  return (
    <FlatList
      {...scrollable}
      key={`recipes-${gridColumns}`}
      data={cells}
      keyExtractor={keyOf}
      numColumns={gridColumns}
      renderItem={renderItem}
      ListHeaderComponent={<CreatorProfileSummary viewed={profileState.viewed} vm={vm} />}
      ListEmptyComponent={
        recipesState.status === StoreStatus.Loaded || recipesState.status === StoreStatus.Error ? (
          <SizedText size={fontSizes.body} color={colors.textSubtle} style={styles.note}>
            {emptyNote}
          </SizedText>
        ) : (
          <ActivityIndicator color={colors.primary} style={styles.spinner} />
        )
      }
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={vm.isPullRefreshing} onRefresh={vm.onRefresh} tintColor={colors.textMuted} colors={[colors.primary]} />
      }
      onEndReached={vm.onEndReached}
      onEndReachedThreshold={ListConstants.endReachedThreshold}
      ListFooterComponent={
        <FeedFooter isLoadingMore={recipesState.status === StoreStatus.Loaded && recipesState.isLoadingMore === true} />
      }
      initialNumToRender={ListConstants.initialRows}
      maxToRenderPerBatch={ListConstants.rowsPerBatch}
      windowSize={ListConstants.windowSize}
    />
  );
};

const styles = StyleSheet.create({
  centre: {
    flex: ValueConstants.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    gap: CreatorProfileMetrics.gap,
    paddingBottom: spacing.xxl,
  },
  row: {
    gap: CreatorProfileMetrics.gap,
    paddingHorizontal: CreatorProfileMetrics.gutter,
  },
  filler: {
    flex: ValueConstants.one,
  },
  spinner: {
    paddingVertical: spacing.xxl,
  },
  note: {
    textAlign: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: CreatorProfileMetrics.gutter,
  },
});
