import { useCallback } from 'react';
import { Platform, RefreshControl, StyleSheet, View } from 'react-native';
import { ListConstants } from '@presentation/base/constants';
import { StoreStatus } from '@application/store/store-status';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { RecipeListItem } from '@presentation/app/recipes/items/cards/recipe-list-item';
import { RecipeSearchOverlay } from '@presentation/app/recipes/sheets/recipe-search-overlay';
import { RecipesAppHeader } from '@presentation/app/recipes/body/recipes-app-header';
import { CollapsingHomeHeader } from '@presentation/app/recipes/body/collapsing-home-header';
import { FilterSortFab } from '@presentation/app/recipes/items/filters/filter-sort-fab';
import { LoadingSkeleton } from '@presentation/app/recipes/body/loading-skeleton';
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
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
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
  const { state, recipes, isWebShell, isSearching, gridColumns } = vm;

  // Stable across renders so `RecipeListItem`'s memo actually holds. A fresh
  // arrow per row per render defeats memoisation completely — the rows would
  // re-render on every scroll frame the parent reacts to, which is what they
  // were doing.
  const { onOpenRecipe } = vm;
  const openRecipe = useCallback(
    (id: string) => () => onOpenRecipe(id),
    [onOpenRecipe],
  );

  const renderItem = useCallback(
    ({ item }: { item: RecipeSummaryEntity }): React.JSX.Element => {
      if (gridColumns > ValueConstants.one) {
        return (
          <View style={styles.gridCell}>
            <RecipeListItem recipe={item} onPress={openRecipe(item.id)} />
          </View>
        );
      }
      return <RecipeListItem recipe={item} onPress={openRecipe(item.id)} />;
    },
    [gridColumns, openRecipe],
  );

  const keyExtractor = useCallback((r: RecipeSummaryEntity): string => r.id, []);

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
  } else if (isWebShell) {
    body = <WebRecipeFeed vm={vm} />;
  } else if (state.status === StoreStatus.Idle || state.status === StoreStatus.Loading) {
    body = <LoadingSkeleton />;
  } else if (isSearching) {
    body = (
      <RecipeSearchOverlay
        recipes={recipes}
        isLoading={vm.isRefetching}
        onOpenRecipe={vm.onOpenRecipe}
      />
    );
  } else {
    body = (
      <Animated.FlatList
        // Emptied on purpose while the next set is fetched: the rows on screen
        // answer the PREVIOUS filter, and leaving them up read as a second
        // load. `ListEmptyComponent` carries the loading placeholder, so the
        // feed header above it (cuisine strip, active-filter chips) stays.
        data={vm.isReloadingResults ? [] : recipes}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        // Windowing defaults are tuned for short rows; these are tall photo
        // cards, so the defaults kept ~21 screens of them mounted. Measured
        // against a full feed: fewer mounted rows, less memory, and the scroll
        // stops dropping frames on the mid-range Android box the app targets.
        initialNumToRender={ListConstants.initialRows}
        maxToRenderPerBatch={ListConstants.rowsPerBatch}
        windowSize={ListConstants.windowSize}
        // Android only: detaches off-screen views from the native hierarchy.
        // A no-op-to-harmful on iOS, where it has caused blank cells.
        removeClippedSubviews={Platform.OS === 'android'}
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
        scrollEventThrottle={16}
        onEndReached={vm.onEndReached}
        onEndReachedThreshold={ListConstants.endReachedThreshold}
        ListFooterComponent={<FeedFooter isLoadingMore={vm.isLoadingMore} />}
        contentContainerStyle={[styles.listContent, styles.mobileListContent]}
        style={styles.list}
        refreshControl={
          // `progressViewOffset` drops the spinner below the collapsing header
          // band, which is absolutely positioned and opaque over the list — the
          // spinner would otherwise render behind it and be invisible. iOS
          // applies the value as a raw frame shift, so the full band height is
          // right; Android's SwipeRefreshLayout rests the circle lower (see
          // homeRefreshOffsetAndroid) and needs the smaller value to tuck the
          // spinner under the band instead of floating it over the AI banner.
          // `tintColor` is iOS-only and `colors` is Android-only; both are
          // needed for the spinner to follow the theme on each platform.
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

  // The loaded mobile feed pads for the header band inside its own list content
  // (`mobileListContent`), so the container must not add the inset a second
  // time. Every other mobile branch renders a plain surface and needs it.
  const isMobileLoadedFeed = !isWebShell && !isSearching && state.status === StoreStatus.Loaded;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>
      {isWebShell ? (
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
    paddingHorizontal: spacing.lg,
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
  gridCell: {
    flex: ValueConstants.one,
    minWidth: ValueConstants.zero,
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
