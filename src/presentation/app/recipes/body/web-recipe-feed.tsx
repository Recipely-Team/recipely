import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { StoreStatus } from '@application/store/store-status';
import { ValueConstants } from '@core/constants';
import { useState } from 'react';
import { spacing } from '@presentation/base/theme';
import { BREAKPOINTS, WEB_CONTENT_MAX_WIDTH } from '@presentation/base/responsive/breakpoints';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { WebHeroSection } from '@presentation/app/recipes/body/web-hero-section';
import { WebCuisineRail } from '@presentation/app/recipes/body/web-cuisine-rail';
import { AllCuisinesSheet } from '@presentation/app/recipes/sheets/all-cuisines-sheet';
import { feedGutter } from '@presentation/app/recipes/model/feed-content-width';
import { WebRecipeGrid } from '@presentation/app/recipes/body/web-recipe-grid';
import { WebBannerAd } from '@presentation/base/widgets/ads/web-banner-ad';
import { webFeedSlotId } from '@infrastructure/constants/ads';
import { t } from '@presentation/i18n';
import type { UseRecipeListResult } from '@presentation/app/recipes/model/use-recipe-list-result';

export interface WebRecipeFeedProps {
  vm: UseRecipeListResult;
}

/**
 * The whole feed on an expanded viewport: the hero row, the cuisine rail, and
 * the recipe grid, in one scroll view and one content column.
 *
 * Split out of `RecipeListBody` because that file carried two entirely separate
 * layouts — a windowed `FlatList` for the phone and this scrolling document for
 * the browser — and only ever rendered one of them. Keeping both in one file
 * made a 300-line component whose top half a mobile reader had to skip past.
 */
export const WebRecipeFeed = ({ vm }: WebRecipeFeedProps): React.JSX.Element => {
  const { width } = useLayout();
  const [allCuisinesOpen, setAllCuisinesOpen] = useState(false);
  const recipesLoaded =
    vm.state.status === StoreStatus.Loaded && !vm.isReloadingResults && vm.recipes.length > ValueConstants.zero;
  // The rail's label is the first thing to go when the row runs out of width.
  const showRailTitle = width >= BREAKPOINTS.desktop;

  return (
  <>
  <ScrollView
    ref={vm.attachList}
    style={styles.list}
    contentContainerStyle={[styles.webContent, { paddingHorizontal: feedGutter(width) }]}
    refreshControl={<RefreshControl refreshing={false} onRefresh={vm.onRefresh} />}
  >
    {vm.isSearching ? null : (
      <>
        <WebHeroSection
          onOpenRecipe={vm.onOpenRecipe}
          onOpenCreate={vm.onOpenCreate}
          isSaved={vm.isSaved}
          onToggleSave={vm.onToggleSave}
        />
        <WebCuisineRail
          selectedCuisines={vm.filters.cuisines}
          onToggle={vm.onToggleCuisineQuick}
          onOpenAll={() => setAllCuisinesOpen(true)}
          showTitle={showRailTitle}
        />
        {/* Between the rail and the grid, which is the only place on this page
            with finished content both above and below it. Not above the hero
            (the ad would BE the page on arrival) and not inside the grid, where
            a cell-sized banner sits among the photo cards it is trying not to
            be mistaken for. Hidden during search for the same reason: the
            results are the whole page then, with nothing above them.

            And only once the recipes have ARRIVED. Rendered unconditionally it
            mounted while the grid was still skeletons, so the request went out
            against a page with nothing on it yet — which is the shape of the
            violation this placement exists to avoid, and on a failed load the
            unit was thrown away unread when the error state replaced the feed. */}
        {recipesLoaded ? (
          <WebBannerAd slotId={webFeedSlotId()} accessibilityLabel={t().createRecipe.adLabel} />
        ) : null}
      </>
    )}
    <WebRecipeGrid
      recipes={vm.recipes}
      isLoading={vm.state.status !== StoreStatus.Loaded || vm.isReloadingResults}
      isRefreshing={vm.isRefetching && !vm.isReloadingResults}
      isSearching={vm.isSearching}
      activeCuisineLabel={vm.activeCuisineLabel}
      sortBy={vm.sortBy}
      onChangeSort={vm.onChangeSort}
      onOpenFilter={vm.onOpenFilter}
      activeFilterCount={vm.activeFilterCount}
      activeDifficulty={vm.filters.difficulties[ValueConstants.zero] ?? null}
      onDifficultyChange={vm.onDifficultyChange}
      gridColumns={vm.gridColumns}
      gridCellMaxWidth={vm.gridCellMaxWidth}
      onOpenRecipe={vm.onOpenRecipe}
      isSaved={vm.isSaved}
      onToggleSave={vm.onToggleSave}
    />
  </ScrollView>
  <AllCuisinesSheet
    visible={allCuisinesOpen}
    selectedCuisines={vm.filters.cuisines}
    onToggle={vm.onToggleCuisineQuick}
    onClear={vm.onResetFilters}
    onClose={() => setAllCuisinesOpen(false)}
  />
  </>
  );
};

const styles = StyleSheet.create({
  list: {
    flex: ValueConstants.one,
  },
  // ONE content column for the whole feed. Every block inside — hero, rail,
  // grid — sits in it and shares its edges, which is the thing that stops the
  // page reading as three loosely stacked slabs. The gutter narrows with the
  // viewport, so a small screen spends its width on content, not margin.
  webContent: {
    width: '100%',
    maxWidth: WEB_CONTENT_MAX_WIDTH.recipes,
    alignSelf: 'center',
    paddingBottom: spacing.xl,
  },
});
