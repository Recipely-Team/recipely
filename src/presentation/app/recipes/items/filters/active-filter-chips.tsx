import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTaxonomyLabel } from '@presentation/base/taxonomy/use-taxonomy-label';
import { formatLabel } from '@presentation/app/recipes/model/format-label';
import type { UiFilters } from '@presentation/app/recipes/model/filtering/ui-filters';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { t } from '@presentation/i18n';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes, borderWidths, colorAlphas } from '@presentation/base/theme';
import type { Difficulty } from '@domain/recipes/difficulty';
import { ValueConstants } from '@core/constants';

export interface ActiveFilterChipsProps {
  filters: UiFilters;
  onRemoveCategory: (category: string) => void;
  onRemoveDifficulty: (difficulty: Difficulty) => void;
  onRemoveMaxTime: () => void;
  onClearAll: () => void;
}

/**
 * Horizontal row of removable chips for every applied non-cuisine filter, plus a
 * "Clear all" link. Renders nothing when no non-cuisine filter is active. Shared
 * between the web sticky header and the mobile scrolling list header.
 */
export const ActiveFilterChips = ({
  filters,
  onRemoveCategory,
  onRemoveDifficulty,
  onRemoveMaxTime,
  onClearAll,
}: ActiveFilterChipsProps): React.JSX.Element | null => {
  const colors = useTheme().colors;
  const { categoryLabel } = useTaxonomyLabel();

  const nonCuisineFilterCount =
    filters.categories.length +
    filters.difficulties.length +
    (filters.maxTime > ValueConstants.zero ? ValueConstants.one : ValueConstants.zero);

  if (nonCuisineFilterCount === ValueConstants.zero) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.activeChipsScroll}
    >
      {filters.categories.map((c) => (
        <Pressable
          key={c}
          onPress={() => onRemoveCategory(c)}
          style={[styles.activeChip, { backgroundColor: colors.primary + colorAlphas.faint, borderColor: colors.primary + colorAlphas.soft }]}
          accessibilityRole="button"
          accessibilityLabel={`${categoryLabel(c).name} ${t().recipes.removeFilter}`}
        >
          <ThemedText variant="caption" style={[styles.activeChipText, { color: colors.primary }]}>
            {categoryLabel(c).name}
          </ThemedText>
          <Ionicons name="close-circle" size={iconSizes.sm} color={colors.primary} />
        </Pressable>
      ))}
      {filters.difficulties.map((d) => (
        <Pressable
          key={d}
          onPress={() => onRemoveDifficulty(d)}
          style={[styles.activeChip, { backgroundColor: colors.primary + colorAlphas.faint, borderColor: colors.primary + colorAlphas.soft }]}
          accessibilityRole="button"
          accessibilityLabel={`${formatLabel(d)} ${t().recipes.removeFilter}`}
        >
          <ThemedText variant="caption" style={[styles.activeChipText, { color: colors.primary }]}>
            {formatLabel(d)}
          </ThemedText>
          <Ionicons name="close-circle" size={iconSizes.sm} color={colors.primary} />
        </Pressable>
      ))}
      {filters.maxTime > ValueConstants.zero ? (
        <Pressable
          onPress={onRemoveMaxTime}
          style={[styles.activeChip, { backgroundColor: colors.primary + colorAlphas.faint, borderColor: colors.primary + colorAlphas.soft }]}
          accessibilityRole="button"
          accessibilityLabel={t().recipes.removeTimeFilter}
        >
          <ThemedText variant="caption" style={[styles.activeChipText, { color: colors.primary }]}>
            ≤ {filters.maxTime} {t().recipes.minutes}
          </ThemedText>
          <Ionicons name="close-circle" size={iconSizes.sm} color={colors.primary} />
        </Pressable>
      ) : null}
      <Pressable
        onPress={onClearAll}
        style={[styles.activeChip, styles.clearChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
        accessibilityRole="button"
        accessibilityLabel={t().recipes.clearFilters}
      >
        <ThemedText variant="caption" style={[styles.activeChipText, { color: colors.textMuted }]}>
          {t().recipes.clearFilters}
        </ThemedText>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  activeChipsScroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.xs2,
    alignItems: 'center',
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: controlSizes.selector,
    paddingHorizontal: spacing.sm2,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
  },
  activeChipText: {
    fontWeight: fontWeights.semibold,
    fontSize: fontSizes.small,
  },
  clearChip: {
    marginLeft: spacing.xs2,
  },
});
