import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ALL_CUISINES_KEY } from '@presentation/app/recipes/model/filtering/cuisine-filter';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTaxonomyLabel } from '@presentation/base/taxonomy/use-taxonomy-label';
import { useTaxonomyOptions } from '@presentation/app/recipes/hooks/use-taxonomy-options';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

/** Emoji shown on the "All" reset tile. */
const ALL_EMOJI = '🍽️';

export interface WebCuisineColumnProps {
  selectedCuisines: string[];
  /** Receives a real cuisine key, or `'ALL'` to reset cuisine filters. */
  onToggle: (cuisine: string) => void;
}

/**
 * The cuisine filter as the third column of the home hero band.
 *
 * @remarks
 * - **It moved here to stop eating the fold.** As a wrapping grid the full
 *   catalogue ran to six rows on a tablet and pushed the recipes themselves far
 *   below the fold — the least important block on the page taking the most
 *   room. Beside the hero it costs no vertical space at all, and it fills the
 *   width the hero cannot use, which is what lets the band span the whole feed
 *   and stay aligned with the grid below.
 * - **It scrolls rather than truncating**, so the catalogue stays complete. The
 *   band's height is the bound, and the list simply runs inside it.
 * - The narrow path keeps the horizontal `CuisineStrip`; this component is only
 *   mounted when {@link bandFitsCuisines} says the column is wide enough to read.
 */
export const WebCuisineColumn = ({ selectedCuisines, onToggle }: WebCuisineColumnProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const { cuisineLabel } = useTaxonomyLabel();
  const { cuisineKeys } = useTaxonomyOptions();

  const tile = (key: string, name: string, emoji: string, active: boolean): React.JSX.Element => (
    <Pressable
      key={key}
      onPress={() => onToggle(key)}
      accessibilityRole="button"
      accessibilityLabel={name}
      style={[
        styles.tile,
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
    <View style={[styles.panel, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
      <ThemedText style={[styles.head, { color: colors.text }]}>{t().recipes.browseCuisines}</ThemedText>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {tile(ALL_CUISINES_KEY, t().recipes.cuisineAll, ALL_EMOJI, selectedCuisines.length === ValueConstants.zero)}
        {cuisineKeys.map((key) => {
          const { name, emoji } = cuisineLabel(key);
          return tile(key, name, emoji, selectedCuisines.includes(key));
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  // Absolutely filled, NOT flexed. A ScrollView with no bounded parent takes
  // its content height, and forty tiles then drove the whole band's height
  // instead of the featured card's ratio — the band grew to several screens.
  // Filling the slot the band already sized keeps the ratio the only thing
  // deciding how tall the row is.
  panel: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.xxl,
    borderWidth: borderWidths.thin,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
  },
  head: {
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.medium,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  // flexShrink lets the list give up height to the header instead of claiming
  // its content height and pushing the panel past the band.
  scroll: {
    flexShrink: ValueConstants.one,
  },
  list: {
    gap: spacing.xs2,
  },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: borderWidths.thin,
  },
  emoji: {
    fontSize: fontSizes.medium,
  },
  label: {
    fontWeight: fontWeights.semibold,
    fontSize: fontSizes.small,
    flexShrink: ValueConstants.one,
  },
});
