import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { AiBannerCard } from '@presentation/app/recipes/items/banners/ai-banner-card';
import { CuisineStrip } from '@presentation/app/recipes/body/cuisine-strip';
import { ActiveFilterChips } from '@presentation/app/recipes/items/filters/active-filter-chips';
import type { UiFilters } from '@presentation/app/recipes/model/filtering/ui-filters';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import type { Difficulty } from '@domain/recipes/difficulty';
import { ValueConstants } from '@core/constants';

export interface MobileFeedHeaderProps {
  filters: UiFilters;
  resultCount: number;
  activeFilterCount: number;
  onOpenCreate: () => void;
  onToggleCuisine: (cuisine: string) => void;
  onRemoveCategory: (category: string) => void;
  onRemoveDifficulty: (difficulty: Difficulty) => void;
  onRemoveMaxTime: () => void;
  onResetFilters: () => void;
}

/**
 * Mobile feed list header (scrolls away with the rows): AI promo, cuisine strip,
 * result-count + Clear-all row, and the active-filter chips. Negative horizontal
 * margin cancels the list's `spacing.lg` inset so the banner/strip/chips are
 * full-bleed while the recipe rows keep their padding.
 */
export const MobileFeedHeader = ({
  filters,
  resultCount,
  activeFilterCount,
  onOpenCreate,
  onToggleCuisine,
  onRemoveCategory,
  onRemoveDifficulty,
  onRemoveMaxTime,
  onResetFilters,
}: MobileFeedHeaderProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View style={styles.mobileHeaderBleed}>
      <AiBannerCard onPress={onOpenCreate} />
      <CuisineStrip selectedCuisines={filters.cuisines} onToggle={onToggleCuisine} />
      <View style={styles.countRow}>
        <ThemedText variant="caption" muted>
          {resultCount} {t().recipes.results}
        </ThemedText>
        {activeFilterCount > ValueConstants.zero ? (
          <Pressable
            onPress={onResetFilters}
            accessibilityRole="button"
            accessibilityLabel={t().recipes.clearFilters}
          >
            <ThemedText variant="caption" style={{ color: colors.primary }}>
              {t().recipes.clearFilters}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
      <ActiveFilterChips
        filters={filters}
        onRemoveCategory={onRemoveCategory}
        onRemoveDifficulty={onRemoveDifficulty}
        onRemoveMaxTime={onRemoveMaxTime}
        onClearAll={onResetFilters}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mobileHeaderBleed: {
    marginHorizontal: -spacing.lg,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
});
