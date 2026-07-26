import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { WebRecipeCard } from '@presentation/base/widgets/cards/web-recipe-card';
import { WebSectionHead } from '@presentation/app/recipes/items/web-section-head';
import { WebSortMenu } from '@presentation/app/recipes/items/filters/web-sort-menu';
import { SkeletonCard } from '@presentation/app/recipes/items/cards/skeleton-card';
import { difficultyLabel } from '@presentation/base/taxonomy/difficulty-label';
import type { SortKey } from '@presentation/app/recipes/model/sort-key';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes, borderWidths, zIndices } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { DIFFICULTY_VALUES, type Difficulty } from '@domain/recipes/difficulty';
import { ValueConstants } from '@core/constants';

const GRID_GAP = spacing.lg2;
/** Skeleton rows shown in the grid area while the list (re)loads. */
const SKELETON_ROWS = ValueConstants.two;

export interface WebRecipeGridProps {
  recipes: RecipeSummaryEntity[];
  isSearching: boolean;
  /**
   * True while the recipe list is (re)loading — e.g. after a sort/filter
   * change. The grid area shows shimmer cards while the section head (and its
   * sort/filter controls) and the surrounding page stay in place.
   */
  isLoading: boolean;
  /**
   * True while a filter/sort change is refetching an already-loaded list
   * (`state.isRefreshing` in the store). Unlike `isLoading`, this never
   * replaces the grid — it only shows a small inline spinner next to the
   * section-head controls so the stale cards stay fully visible underneath.
   */
  isRefreshing: boolean;
  /** First applied cuisine key, or `null` — drives the section-head title. */
  activeCuisineLabel: string | null;
  sortBy: SortKey;
  /** Selects a sort option; the parent applies it and reloads the list. */
  onChangeSort: (key: SortKey) => void;
  /** Opens the full filter sheet (cuisine / category / difficulty / max-time). */
  onOpenFilter: () => void;
  /** Count of applied filters; shown as a badge on the filter button when > 0. */
  activeFilterCount: number;
  activeDifficulty: Difficulty | null;
  onDifficultyChange: (d: Difficulty | null) => void;
  gridColumns: number;
  onOpenRecipe: (id: string) => void;
  /** True when the recipe id is in the signed-in user's saved set. */
  isSaved: (id: string) => boolean;
  onToggleSave: (id: string) => void;
}

/**
 * Web-only recipe grid: section head + difficulty segmented control + sort menu
 * above an auto-fill card grid of `WebRecipeCard`s.
 */
export const WebRecipeGrid = ({
  recipes, isSearching, activeCuisineLabel, sortBy, onChangeSort,
  onOpenFilter, activeFilterCount, activeDifficulty, onDifficultyChange,
  gridColumns, isLoading, isRefreshing, onOpenRecipe, isSaved, onToggleSave,
}: WebRecipeGridProps): React.JSX.Element => {
  const colors = useTheme().colors;

  const title = isSearching
    ? t().recipes.webSearchResults
    : activeCuisineLabel !== null
      ? t().recipes.webCuisineRecipes.replace('{cuisine}', activeCuisineLabel)
      : t().recipes.webAllRecipes;

  const renderItem = useCallback(
    ({ item }: { item: RecipeSummaryEntity }): React.JSX.Element => (
      <View style={styles.gridCell}>
        <WebRecipeCard
          recipe={item}
          saved={isSaved(item.id)}
          onOpen={onOpenRecipe}
          onToggleSave={onToggleSave}
        />
      </View>
    ),
    [onOpenRecipe, isSaved, onToggleSave],
  );

  const segButton = (key: string, label: string, active: boolean, onPress: () => void): React.JSX.Element => (
    <Pressable
      key={key}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.segBtn, active ? [shadows.sm, { backgroundColor: colors.cardBackground }] : null]}
    >
      <ThemedText style={[styles.segText, { color: colors.text, fontWeight: active ? '700' : '400' }]}>
        {label}
      </ThemedText>
    </Pressable>
  );

  const right = (
    <View style={styles.controls}>
      {isRefreshing ? (
        <ActivityIndicator
          size="small"
          color={colors.primary}
          testID="web-recipe-grid-refresh-indicator"
          accessibilityLabel={t().recipes.refreshing}
        />
      ) : null}
      <View style={[styles.segment, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
        {segButton('ALL', t().recipes.difficultyAll, activeDifficulty === null, () => onDifficultyChange(null))}
        {DIFFICULTY_VALUES.map((d) =>
          segButton(d, difficultyLabel(d), activeDifficulty === d, () => onDifficultyChange(d)),
        )}
      </View>
      <Pressable
        onPress={onOpenFilter}
        accessibilityRole="button"
        accessibilityLabel={t().recipes.filter}
        style={[styles.filterBtn, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
      >
        <Ionicons name="funnel-outline" size={iconSizes.md} color={colors.textMuted} />
        <ThemedText style={[styles.filterLabel, { color: colors.text }]}>
          {t().recipes.filter}
        </ThemedText>
        {activeFilterCount > ValueConstants.zero ? (
          <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
            <ThemedText
              style={[styles.filterBadgeText, { color: colors.primaryText }]}
              numberOfLines={1}
            >
              {activeFilterCount}
            </ThemedText>
          </View>
        ) : null}
      </Pressable>
      <WebSortMenu current={sortBy} onChange={onChangeSort} />
    </View>
  );

  return (
    <View>
      {/* Lift the section head (which hosts the sort dropdown) above the recipe
          grid: the grid is a later sibling and would otherwise paint over the
          absolutely-positioned popover. */}
      <View style={styles.headRow}>
        <WebSectionHead
          title={title}
          // Suppress the count while reloading — the previous list is gone and
          // a stale "0 recipes" would be misleading until the fetch resolves.
          sub={isLoading ? undefined : t().recipes.webRecipesCount.replace('{n}', String(recipes.length))}
          right={right}
        />
      </View>
      {isLoading ? (
        <View style={styles.skeletonGrid}>
          {Array.from({ length: SKELETON_ROWS }, (_, row) => (
            <View key={row} style={styles.skeletonRow}>
              {Array.from({ length: gridColumns }, (_, col) => (
                <View key={col} style={styles.gridCell}>
                  <SkeletonCard />
                </View>
              ))}
            </View>
          ))}
        </View>
      ) : recipes.length === ValueConstants.zero ? (
        <View style={[styles.empty, { borderColor: colors.border }]}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.surface }]}>
            <Ionicons name="search" size={iconSizes.xxxl} color={colors.textMuted} />
          </View>
          <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
            {t().recipes.noResults}
          </ThemedText>
          <ThemedText style={[styles.emptyBody, { color: colors.textMuted }]}>
            {t().recipes.webEmptyBody}
          </ThemedText>
        </View>
      ) : (
        <FlatList
          key={`web-grid-${gridColumns}`}
          data={recipes}
          keyExtractor={(r) => r.id}
          renderItem={renderItem}
          numColumns={gridColumns}
          scrollEnabled={false}
          columnWrapperStyle={gridColumns > ValueConstants.one ? styles.gridRow : undefined}
          contentContainerStyle={styles.gridContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Establishes a stacking context above the grid so the sort dropdown popover
  // (absolutely positioned inside the head) is not painted over by the cards.
  headRow: {
    position: 'relative',
    zIndex: zIndices.raised,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    height: controlSizes.webSortBtn,
    paddingHorizontal: spacing.md,
    borderWidth: borderWidths.hairline,
    borderRadius: radii.lg,
  },
  filterLabel: {
    fontSize: fontSizes.caption,
    fontWeight: fontWeights.semibold,
  },
  filterBadge: {
    minWidth: iconSizes.lg,
    height: iconSizes.lg,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: fontSizes.micro,
    lineHeight: fontSizes.micro,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
    includeFontPadding: false,
  },
  segment: {
    flexDirection: 'row',
    borderWidth: borderWidths.hairline,
    borderRadius: radii.lg,
    padding: spacing.xxs,
  },
  segBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs2,
    borderRadius: radii.md,
  },
  segText: {
    fontSize: fontSizes.caption,
  },
  gridContent: {
    gap: GRID_GAP,
    paddingBottom: spacing.xxl,
  },
  skeletonGrid: {
    gap: GRID_GAP,
    paddingBottom: spacing.xxl,
  },
  // Skeleton rows are plain Views (no FlatList numColumns), so they must lay
  // their cells out horizontally themselves — otherwise the cards stack into a
  // single column like the mobile skeleton.
  skeletonRow: {
    flexDirection: 'row',
    gap: GRID_GAP,
  },
  gridRow: {
    gap: GRID_GAP,
  },
  gridCell: {
    flex: ValueConstants.one,
    minWidth: ValueConstants.zero,
  },
  empty: {
    borderWidth: borderWidths.thin,
    borderStyle: 'dashed',
    borderRadius: radii.xl,
    padding: spacing.xxxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyIcon: {
    width: iconSizes.jumbo,
    height: iconSizes.jumbo,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.subtitle,
  },
  emptyBody: {
    fontSize: fontSizes.body,
  },
});
