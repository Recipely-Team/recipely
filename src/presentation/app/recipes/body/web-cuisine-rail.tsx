import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isWeb } from '@infrastructure/constants/platform';
import { ALL_CUISINES_KEY } from '@presentation/app/recipes/model/filtering/cuisine-filter';
import { RAIL_CUISINE_COUNT } from '@presentation/app/recipes/model/filtering/rail-cuisine-count';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTaxonomyLabel } from '@presentation/base/taxonomy/use-taxonomy-label';
import { useTaxonomyOptions } from '@presentation/app/recipes/hooks/use-taxonomy-options';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes, decorSizes, borderWidths } from '@presentation/base/theme';
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
 * The cuisine filter as one full-width band above the recipe grid.
 *
 * @remarks
 * - **A rail, not a column.** As a vertical list beside the hero it could only
 *   ever show a truncated seven of forty, and it cost a 300px column that the
 *   photography wanted. Here it costs one row: the handful people actually use
 *   ride the rail, and completeness lives behind the button — so neither has to
 *   grow with the catalogue.
 * - **The overflow has to be visible**, or a rail that scrolls looks like a rail
 *   that was cut off. The fade and the chevron appear only when the chips
 *   genuinely exceed the track, measured rather than assumed.
 * - On web a horizontal `ScrollView` ignores the vertical wheel, so the wheel
 *   delta is translated into horizontal scrolling — the same fix
 *   `cuisine-strip` carries for the phone feed.
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
  const scrollRef = useRef<ScrollView>(null);
  const [overflows, setOverflows] = useState(false);
  const trackWidth = useRef(ValueConstants.zero);

  useEffect(() => {
    if (!isWeb()) return;
    const node = scrollRef.current?.getScrollableNode() as unknown as HTMLElement | undefined;
    if (!node) return;
    const onWheel = (event: WheelEvent): void => {
      if (event.deltaY === ValueConstants.zero) return;
      event.preventDefault();
      node.scrollLeft += event.deltaY;
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, []);

  const onTrackLayout = (event: LayoutChangeEvent): void => {
    trackWidth.current = event.nativeEvent.layout.width;
  };

  const onChipsLayout = (width: number): void => {
    setOverflows(width > trackWidth.current + ValueConstants.one);
  };

  const railKeys = cuisineKeys.slice(ValueConstants.zero, RAIL_CUISINE_COUNT);
  const noneSelected = selectedCuisines.length === ValueConstants.zero;

  const chip = (key: string, name: string, emoji: string, active: boolean): React.JSX.Element => (
    <Pressable
      key={key}
      onPress={() => onToggle(key)}
      accessibilityRole="button"
      accessibilityLabel={name}
      style={[
        styles.chip,
        active
          ? { backgroundColor: colors.primary, borderColor: colors.primary }
          : { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: active ? colors.gradientSurface : colors.cardBackground }]}>
        <ThemedText style={styles.emoji}>{emoji}</ThemedText>
      </View>
      <ThemedText style={[styles.chipLabel, { color: active ? colors.primaryText : colors.text }]}>
        {name}
      </ThemedText>
    </Pressable>
  );

  return (
    <View style={styles.row}>
      {showTitle ? (
        <ThemedText style={[styles.title, { color: colors.text }]}>{t().recipes.browseCuisines}</ThemedText>
      ) : null}

      <Pressable
        onPress={onOpenAll}
        accessibilityRole="button"
        accessibilityLabel={t().recipes.allCuisines}
        style={[styles.allBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Ionicons name="menu" size={iconSizes.md} color={colors.text} />
        <ThemedText style={[styles.allLabel, { color: colors.text }]}>{t().recipes.allCuisines}</ThemedText>
        <ThemedText style={[styles.allCount, { color: colors.textMuted }]}>{cuisineKeys.length}</ThemedText>
      </Pressable>

      <View style={styles.track} onLayout={onTrackLayout}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          onContentSizeChange={onChipsLayout}
        >
          {chip(ALL_CUISINES_KEY, t().recipes.cuisineAll, ALL_EMOJI, noneSelected)}
          {railKeys.map((key) => {
            const { name, emoji } = cuisineLabel(key);
            return chip(key, name, emoji, selectedCuisines.includes(key));
          })}
        </ScrollView>
        {overflows ? (
          <>
            <View pointerEvents="none" style={[styles.fade, { backgroundColor: colors.background }]} />
            <View style={[styles.next, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="chevron-forward" size={iconSizes.md} color={colors.text} />
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
};

/** Emoji on the "All" reset chip. */
const ALL_EMOJI = '🍽️';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm2,
    marginBottom: spacing.lg,
  },
  title: {
    fontWeight: fontWeights.heavy,
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
    flexShrink: ValueConstants.zero,
  },
  allLabel: {
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.caption,
  },
  allCount: {
    fontWeight: fontWeights.semibold,
    fontSize: fontSizes.caption,
  },
  // `overflow: hidden` is what the fade sits against; `minWidth: 0` lets the
  // track actually shrink inside the row instead of forcing it wider.
  track: {
    flex: ValueConstants.one,
    minWidth: ValueConstants.zero,
    overflow: 'hidden',
  },
  chips: {
    gap: spacing.xs2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: controlSizes.chip,
    paddingLeft: spacing.xs2,
    paddingRight: spacing.md,
    borderRadius: radii.round,
    borderWidth: borderWidths.thin,
  },
  dot: {
    width: decorSizes.badgeSm,
    height: decorSizes.badgeSm,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: fontSizes.caption,
  },
  chipLabel: {
    fontWeight: fontWeights.semibold,
    fontSize: fontSizes.caption,
  },
  fade: {
    position: 'absolute',
    right: ValueConstants.zero,
    top: ValueConstants.zero,
    bottom: ValueConstants.zero,
    width: decorSizes.sparkleDecor,
    opacity: 0.9,
  },
  next: {
    position: 'absolute',
    right: ValueConstants.zero,
    top: ValueConstants.zero,
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    borderRadius: radii.round,
    borderWidth: borderWidths.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
