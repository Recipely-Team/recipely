import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { WebSectionHead } from '@presentation/app/recipes/items/web-section-head';
import { useTaxonomyLabel } from '@presentation/base/taxonomy/use-taxonomy-label';
import { useTaxonomyOptions } from '@presentation/app/recipes/hooks/use-taxonomy-options';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, mediaSizes, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

/** Window width (px) below which cuisine tiles shrink so ≥4 fit per row. */
const TILE_SHRINK_WIDTH = 500;
/** Emoji shown on the "All" reset tile. */
const ALL_EMOJI = '🍽️';
/** Sentinel toggle key the parent maps to "clear cuisine filters". */
const ALL_KEY = 'ALL';

export interface WebCuisineGridProps {
  selectedCuisines: string[];
  /** Receives a real cuisine key, or `'ALL'` to reset cuisine filters. */
  onToggle: (cuisine: string) => void;
}

/**
 * Web-only cuisine tile grid (replaces the mobile `CuisineStrip`). A leading
 * "All" tile clears the cuisine filter; the rest are driven by the backend
 * taxonomy catalog via {@link useTaxonomyOptions} / {@link useTaxonomyLabel}.
 */
export const WebCuisineGrid = ({ selectedCuisines, onToggle }: WebCuisineGridProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const { cuisineLabel } = useTaxonomyLabel();
  const { cuisineKeys } = useTaxonomyOptions();
  const { width } = useLayout();
  const minWidth = width < TILE_SHRINK_WIDTH ? mediaSizes.cuisineTileMinSm : mediaSizes.cuisineTileMin;

  const tile = (key: string, name: string, emoji: string, active: boolean): React.JSX.Element => (
    <Pressable
      key={key}
      onPress={() => onToggle(key)}
      accessibilityRole="button"
      accessibilityLabel={name}
      style={[
        styles.tile,
        { minWidth },
        active
          ? { backgroundColor: colors.chipBackground, borderColor: colors.primary }
          : { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
      ]}
    >
      <ThemedText style={styles.emoji}>{emoji}</ThemedText>
      <ThemedText
        numberOfLines={1}
        style={[styles.label, { color: active ? colors.chipText : colors.textMuted }]}
      >
        {name}
      </ThemedText>
    </Pressable>
  );

  return (
    <View style={styles.section}>
      <WebSectionHead title={t().recipes.browseCuisines} sub={t().recipes.filterByCuisine} />
      <View style={styles.grid}>
        {tile(ALL_KEY, t().recipes.cuisineAll, ALL_EMOJI, selectedCuisines.length === ValueConstants.zero)}
        {cuisineKeys.map((key) => {
          const { name, emoji } = cuisineLabel(key);
          return tile(key, name, emoji, selectedCuisines.includes(key));
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  tile: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.xl,
    borderWidth: borderWidths.thin,
  },
  emoji: {
    fontSize: fontSizes.subheading,
  },
  label: {
    fontWeight: fontWeights.semibold,
    fontSize: fontSizes.small,
  },
});
