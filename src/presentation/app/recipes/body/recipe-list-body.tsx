import { useCallback } from 'react';
import { scrollThrottleMs , ListConstants } from '@presentation/base/constants';
import { Platform, RefreshControl, StyleSheet, View } from 'react-native';
import { StoreStatus } from '@application/store/store-status';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { RecipeSearchOverlay } from '@presentation/app/recipes/sheets/recipe-search-overlay';
import { RecipesAppHeader } from '@presentation/app/recipes/body/recipes-app-header';
import { CollapsingHomeHeader } from '@presentation/app/recipes/body/collapsing-home-header';
import { FilterSortFab } from '@presentation/app/recipes/items/filters/filter-sort-fab';
import { LoadingSkeleton } from '@presentation/app/recipes/body/loading-skeleton';
import { useReportFailure } from '@presentation/base/errors/use-report-failure';
import { MobileFeedHeader } from '@presentation/app/recipes/body/mobile-feed-header';
import { FeedReloadingRows } from '@presentation/app/recipes/body/feed-reloading-rows';
import { FeedFooter } from '@presentation/base/widgets/lists/feed-footer';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { ErrorState } from '@presentation/base/widgets/feedback/error-state';
import { failureContent, failureIcon, failureSeverity } from '@presentation/base/errors/failure-lookups';
import { WebRecipeFeed } from '@presentation/app/recipes/body/web-recipe-feed';
import type { UseRecipeListResult } from '@presentation/app/recipes/model/use-recipe-list-result';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { t } from '@presentation/i18n';
import { spacing, iconSizes, controlSizes, layoutSizes } from '@presentation/base/theme';
import type { FeedRowType } from '@presentation/app/recipes/model/ads/feed-row';
import { FeedRowView } from '@presentation/app/recipes/items/feed-row-view';
import { useFeedRows } from '@presentation/app/recipes/hooks/use-feed-rows';
import { MOBILE_FEED_GUTTER } from '@presentation/app/recipes/model/feed-content-width';
import { ValueConstants } from '@core/constants';

export interface RecipeListBodyProps {
  vm: UseRecipeListResult;
}

/**
 * How close to the end the feed gets before the next page is asked for, as a
 * fraction of the visible length. Half a screen ahead is enough for the rows to
 * arrive before the user reaches them without prefetching pages they may never
 * scroll to.
 */

const ItemSeparator = (): React.JSX.Element => <View style={styles.separator} />;

/**
 * Renders the recipe-list shell (web app header + centered grid, or the mobile
 * collapsing-header feed) and the state-dependent body (error / loading / search
 * / empty / list). The filter sheets and sign-in prompt are rendered by the
 * screen alongside this.
 *
 * @remarks
 * - **The mobile feed header renders even with zero rows.** An empty result
 *   used to swap the whole list for a centered empty state, unmounting the
 *   cuisine strip and the active-filter chips — exactly the controls a user
 *   needs at that moment, since the way out of a filter that matches nothing is
 *   to un-tap it, and the only thing left was "Clear all". The empty copy is a
 *   `ListEmptyComponent` under the header instead of a replacement for it, and
 *   `contentContainerStyle: flexGrow 1` keeps a surface for pull-to-refresh.
 * - **Search progress reads `vm.isRefetching`, not the store.** The web header
 *   search is debounced, so the store looks idle for the first few hundred ms
 *   after a keystroke; once the request is in flight the grid is already on
 *   skeletons, so this covers only the debounce window.
 */
export const RecipeListBody = ({ vm }: RecipeListBodyProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const { state, recipes, isExpanded, isSearching, gridColumns } = vm;

  // Stable across renders so the row memo holds; each row binds its own id.
  const { onOpenRecipe } = vm;

  const { rows, keyExtractor, adUnitId, adWidth } = useFeedRows({
    recipes,
    isReloading: vm.isReloadingResults,
    gridColumns,
  });

  const renderItem = useCallback(
    ({ item }: { item: FeedRowType }): React.JSX.Element => (
      // prettier-ignore
      <FeedRowView row={item} gridColumns={gridColumns} adUnitId={adUnitId} adWidth={adWidth} onOpenRecipe={onOpenRecipe} />
    ),
    [gridColumns, onOpenRecipe, adUnitId, adWidth],
  );

  useReportFailure(state.status === StoreStatus.Error ? state.failure : null, 'RecipeListBody');

  let body: React.JSX.Element;
  if (state.status === StoreStatus.Error) {
    const content = failureContent(state.failure);
    body = (
      <ErrorState
        severity={failureSeverity(state.failure)}
        icon={failureIcon(state.failure)}
        title={content.title}
        body={content.body}
        primaryLabel={t().errors.retry}
        onPrimary={vm.onRefresh}
      />
    );
  } else if (isExpanded) {
    body = <WebRecipeFeed vm={vm} />;
  } else if (state.status === StoreStatus.Idle || state.status === StoreStatus.Loading) {
    body = <LoadingSkeleton />;
  } else if (isSearching) {
    body = (
      <RecipeSearchOverlay
        recipes={recipes}
        isLoading={vm.isRefetching}
        onOpenRecipe={vm.onOpenRecipe}
        assistantScroll={vm.assistantScroll}
      />
    );
  } else {
    body = (
      <Animated.FlatList
        ref={vm.attachList}
        // Emptied while the next set loads; the header stays.
        data={rows}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        // Tuned for tall photo cards (the defaults keep far too many mounted).
        initialNumToRender={ListConstants.initialRows}
        maxToRenderPerBatch={ListConstants.rowsPerBatch}
        windowSize={ListConstants.windowSize}
        // No removeClippedSubviews: it crashed under Fabric (check:structure rule R).
        ListHeaderComponent={
          <MobileFeedHeader
            filters={vm.filters}
            resultCount={recipes.length}
            activeFilterCount={vm.activeFilterCount}
            onOpenCreate={vm.onOpenCreate}
            onToggleCuisine={vm.onToggleCuisineQuick}
            onRemoveCategory={vm.onRemoveCategory}
            onRemoveDifficulty={vm.onRemoveDifficulty}
            onRemoveMaxTime={vm.onRemoveMaxTime}
            onResetFilters={vm.onResetFilters}
          />
        }
        ListEmptyComponent={
          vm.isReloadingResults ? (
            <FeedReloadingRows />
          ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="food-off" size={iconSizes.giant} color={colors.textMuted} />
            <ThemedText variant="body" muted style={styles.feedbackTitle}>
              {vm.activeFilterCount > ValueConstants.zero ? t().recipes.noResults : t().recipes.empty}
            </ThemedText>
            <View style={styles.retryButton}>
              {vm.activeFilterCount > ValueConstants.zero ? (
                <PrimaryButton label={t().recipes.clearFilters} onPress={vm.onResetFilters} />
              ) : (
                <PrimaryButton label={t().common.retry} onPress={vm.onRefresh} />
              )}
            </View>
          </View>
          )
        }
        ItemSeparatorComponent={ItemSeparator}
        onScroll={vm.scrollHandler}
        scrollEventThrottle={scrollThrottleMs.perFrame}
        onEndReached={vm.onEndReached}
        onEndReachedThreshold={ListConstants.endReachedThreshold}
        ListFooterComponent={<FeedFooter isLoadingMore={vm.isLoadingMore} />}
        contentContainerStyle={[styles.listContent, styles.mobileListContent]}
        style={styles.list}
        refreshControl={
          // progressViewOffset puts the spinner below the opaque header band; per-platform values.
          <RefreshControl
            refreshing={vm.isPullRefreshing}
            onRefresh={vm.onRefresh}
            progressViewOffset={Platform.select({
              android: layoutSizes.homeRefreshOffsetAndroid,
              default: layoutSizes.homeHeaderMax,
            })}
            tintColor={colors.textMuted}
            colors={[colors.primary]}
          />
        }
      />
    );
  }

  // The loaded mobile feed pads for the band itself, so the container must not.
  const isMobileLoadedFeed = !isExpanded && !isSearching && state.status === StoreStatus.Loaded;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>
      {isExpanded ? (
        <>
          <RecipesAppHeader onNotificationsPress={vm.onNotifications} unreadCount={vm.unreadCount} />
          <View style={styles.bodyContainer}>{body}</View>
        </>
      ) : (
        <>
          <View style={[styles.bodyContainer, isMobileLoadedFeed ? null : styles.bodyTopInset]}>{body}</View>
          <CollapsingHomeHeader
            scrollY={vm.scrollY}
            headerTranslateY={vm.headerTranslateY}
            reduceMotion={vm.reduceMotion}
            onNotificationsPress={vm.onNotifications}
            unreadCount={vm.unreadCount}
            searchValue={vm.search}
            onSearchChange={vm.onSearchChange}
          />
          {state.status === StoreStatus.Loaded ? (
            <FilterSortFab
              scrollY={vm.scrollY}
              reduceMotion={vm.reduceMotion}
              activeCount={vm.activeFilterCount}
              onPress={vm.onOpenFilter}
            />
          ) : null}
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: ValueConstants.one,
  },
  bodyContainer: {
    flex: ValueConstants.one,
  },
  bodyTopInset: {
    paddingTop: layoutSizes.homeHeaderMax,
  },
  list: {
    flex: ValueConstants.one,
  },
  listContent: {
    flexGrow: ValueConstants.one,
    paddingHorizontal: MOBILE_FEED_GUTTER,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  mobileListContent: {
    paddingTop: layoutSizes.homeHeaderMax,
    paddingBottom: controlSizes.fabExtended + spacing.xxl,
  },
  webContent: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: layoutSizes.webContentMax,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  separator: {
    height: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  feedbackTitle: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.lg,
  },
});
