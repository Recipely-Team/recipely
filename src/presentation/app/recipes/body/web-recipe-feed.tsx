import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { StoreStatus } from '@application/store/store-status';
import { ValueConstants } from '@core/constants';
import { spacing, layoutSizes } from '@presentation/base/theme';
import { WebHeroSection } from '@presentation/app/recipes/body/web-hero-section';
import { WebAiBanner } from '@presentation/app/recipes/items/banners/web-ai-banner';
import { WebCuisineGrid } from '@presentation/app/recipes/body/web-cuisine-grid';
import { WebRecipeGrid } from '@presentation/app/recipes/body/web-recipe-grid';
import type { UseRecipeListResult } from '@presentation/app/recipes/model/use-recipe-list-result';

export interface WebRecipeFeedProps {
  vm: UseRecipeListResult;
}

/**
 * The whole feed as the web shell renders it: hero, banner, cuisine grid and
 * the responsive card grid, in one scroll view.
 *
 * Split out of `RecipeListBody` because that file carried two entirely separate
 * layouts — a windowed `FlatList` for the phone and this scrolling document for
 * the browser — and only ever rendered one of them. Keeping both in one file
 * made a 300-line component whose top half a mobile reader had to skip past.
 */
export const WebRecipeFeed = ({ vm }: WebRecipeFeedProps): React.JSX.Element => (
  <ScrollView
    style={styles.list}
    contentContainerStyle={styles.webContent}
    refreshControl={<RefreshControl refreshing={false} onRefresh={vm.onRefresh} />}
  >
    {vm.isSearching ? null : (
      <>
        <WebHeroSection onOpenRecipe={vm.onOpenRecipe} isSaved={vm.isSaved} onToggleSave={vm.onToggleSave} />
        <WebAiBanner onPress={vm.onOpenCreate} />
        <WebCuisineGrid selectedCuisines={vm.filters.cuisines} onToggle={vm.onToggleCuisineQuick} />
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
      onOpenRecipe={vm.onOpenRecipe}
      isSaved={vm.isSaved}
      onToggleSave={vm.onToggleSave}
    />
  </ScrollView>
);

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  // The cap and the gutter the column maths in `use-recipe-list` has always
  // assumed — it sizes a card against `min(width, webContentMax) - xl * 2` —
  // but which the layout never actually applied. Nothing capped or padded this
  // feed, so it ran edge-to-edge: on a wide monitor that passes for a
  // deliberate full-bleed dashboard, and on a 1032pt iPad it just reads as
  // content jammed against both bezels.
  webContent: {
    width: '100%',
    maxWidth: layoutSizes.webContentMax,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
});
