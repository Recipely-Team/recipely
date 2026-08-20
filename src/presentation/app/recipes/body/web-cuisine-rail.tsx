import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ALL_CUISINES_KEY } from '@presentation/app/recipes/model/filtering/cuisine-filter';
import { railChipCount } from '@presentation/app/recipes/model/filtering/cuisine-rail-rows';
import { feedContentWidth } from '@presentation/app/recipes/model/feed-content-width';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTaxonomyLabel } from '@presentation/base/taxonomy/use-taxonomy-label';
import { useTaxonomyOptions } from '@presentation/app/recipes/hooks/use-taxonomy-options';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, iconSizes, avatarSizes, controlSizes, borderWidths } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface WebCuisineRailProps {
  selectedCuisines: string[];
  /** Receives a real cuisine key, or `'ALL'` to reset cuisine filters. */
  onToggle: (cuisine: string) => void;
  /** Opens the sheet holding the whole catalogue. */
  onOpenAll: () => void;
  /** Hides the leading label where the row has no width to spare. */
  showTitle: boolean;
}

/**
 * The cuisine filter above the recipe grid — the phone's chips, wrapped.
 *
 * @remarks
 * - **Same chip as the phone strip** (circular emoji tile, label beneath), so
 *   the filter looks like one control across the app rather than two designs
 *   that happen to filter the same thing.
 * - **Wrapped, not scrolled sideways.** A horizontal rail has to advertise that
 *   it continues, and the first cut shipped a chevron that looked tappable and
 *   did nothing. Rows have no hidden state to advertise. They are capped
 *   ({@link railChipCount}) so the catalogue cannot push the recipes off the
 *   fold, which was the original complaint.
 * - Whatever the cap leaves out stays reachable behind the "all cuisines"
 *   button, which is also where search and multi-select live.
 */
export const WebCuisineRail = ({
  selectedCuisines,
  onToggle,
  onOpenAll,
  showTitle,
}: WebCuisineRailProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const { cuisineLabel } = useTaxonomyLabel();
  const { cuisineKeys } = useTaxonomyOptions();
  const { width, height } = useLayout();

  const visible = railChipCount(feedContentWidth(width), width, height);
  const railKeys = cuisineKeys.slice(ValueConstants.zero, visible);
  const noneSelected = selectedCuisines.length === ValueConstants.zero;

  const chip = (key: string, name: string, emoji: string, active: boolean): React.JSX.Element => (
    <Pressable
      key={key}
      onPress={() => onToggle(key)}
      accessibilityRole="button"
      accessibilityLabel={name}
      style={styles.item}
    >
      <View
        style={[
          styles.circle,
          {
            backgroundColor: active ? colors.primary : colors.surface,
            borderColor: active ? colors.primary : colors.border,
          },
        ]}
      >
        <ThemedText style={styles.emoji}>{emoji}</ThemedText>
      </View>
      <ThemedText
        numberOfLines={ValueConstants.one}
        style={[styles.label, { color: active ? colors.primary : colors.textMuted }]}
      >
        {name}
      </ThemedText>
    </Pressable>
  );

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        {showTitle ? (
          <ThemedText style={[styles.title, { color: colors.text }]}>
            {t().recipes.browseCuisines}
          </ThemedText>
        ) : null}
        <Pressable
          onPress={onOpenAll}
          accessibilityRole="button"
          accessibilityLabel={t().recipes.allCuisines}
          style={[styles.allBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="options-outline" size={iconSizes.md} color={colors.text} />
          <ThemedText style={[styles.allLabel, { color: colors.text }]}>
            {t().recipes.allCuisines}
          </ThemedText>
          <ThemedText style={[styles.allCount, { color: colors.textMuted }]}>
            {cuisineKeys.length}
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.wrap}>
        {chip(ALL_CUISINES_KEY, t().recipes.cuisineAll, ALL_EMOJI, noneSelected)}
        {railKeys.map((key) => {
          const { name, emoji } = cuisineLabel(key);
          return chip(key, name, emoji, selectedCuisines.includes(key));
        })}
      </View>
    </View>
  );
};

/** Emoji on the "All" reset chip. */
const ALL_EMOJI = '🍽️';

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm2,
    marginBottom: spacing.md,
  },
  title: {
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.body,
  },
  allBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: controlSizes.chip,
    paddingHorizontal: spacing.md,
    borderRadius: radii.round,
    borderWidth: borderWidths.thin,
    marginLeft: 'auto',
  },
  allLabel: {
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.caption,
  },
  allCount: {
    fontWeight: fontWeights.semibold,
    fontSize: fontSizes.caption,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
  },
  item: {
    alignItems: 'center',
    gap: spacing.xs,
    width: avatarSizes.lg,
  },
  circle: {
    width: avatarSizes.lg,
    height: avatarSizes.lg,
    borderRadius: radii.round,
    borderWidth: borderWidths.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: fontSizes.subtitle,
  },
  label: {
    fontWeight: fontWeights.semibold,
    fontSize: fontSizes.small,
  },
});
