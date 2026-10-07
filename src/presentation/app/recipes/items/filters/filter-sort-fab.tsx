import { useState } from 'react';
import { StyleSheet, View, Pressable, type LayoutChangeEvent } from 'react-native';
import Animated, {
  interpolate,
  Extrapolation,
  FadeIn,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes, decorSizes, layoutSizes, borderWidths, zIndices, opacities, BrandColors, durations, maxFontScales } from '@presentation/base/theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';
import { countBadgeLabel } from '@presentation/base/widgets/text/count-badge-label';

/** Scroll distance past the resting header over which the FAB collapses to a circle. */
const MORPH_DISTANCE = 64;

export interface FilterSortFabProps {
  /** Live vertical scroll offset of the recipe list, in px. */
  scrollY: SharedValue<number>;
  /** When true, the FAB stays permanently extended with no scroll-driven morph. */
  reduceMotion: boolean;
  /** Number of active filters; drives the badge (hidden when 0). */
  activeCount: number;
  onPress: () => void;
}

/**
 * Mobile-only Filter & Sort FAB. Extended (icon + label + count badge) near the
 * top of the feed; on scroll-down it morphs to a 56pt circular icon FAB (label
 * width → 0 and fades) and re-extends on scroll-up. It never hides, so filter
 * access is always one tap away. Tapping opens the filter bottom sheet.
 */
export const FilterSortFab = ({
  scrollY,
  reduceMotion,
  activeCount,
  onPress,
}: FilterSortFabProps): React.JSX.Element => {
  const colors = useTheme().colors;
  // The widest layout seen: a web font loading after the first layout widens the label.
  const [extendedWidth, setExtendedWidth] = useState(ValueConstants.zero);
  const [labelWidth, setLabelWidth] = useState(ValueConstants.zero);

  const label = t().recipes.filtersAndSort;
  const accessibilityLabel = activeCount > ValueConstants.zero ? `${label}, ${activeCount}` : label;
  const badgeText = countBadgeLabel(activeCount);

  const onMeasure = (e: LayoutChangeEvent): void => {
    const w = e.nativeEvent.layout.width;
    if (w > extendedWidth) setExtendedWidth(w);
  };

  const onMeasureLabel = (e: LayoutChangeEvent): void => {
    const w = e.nativeEvent.layout.width;
    if (w > labelWidth) setLabelWidth(w);
  };

  const morphRange: [number, number] = [
    layoutSizes.homeHeaderMax,
    layoutSizes.homeHeaderMax + MORPH_DISTANCE,
  ];

  const containerStyle = useAnimatedStyle(() => {
    // At rest the button takes its natural width, so a late font can still widen it.
    if (reduceMotion || extendedWidth === ValueConstants.zero || scrollY.value <= morphRange[ValueConstants.zero]) return {};
    const width = interpolate(
      scrollY.value,
      morphRange,
      [extendedWidth, controlSizes.fab],
      Extrapolation.CLAMP,
    );
    return { width };
  });

  const labelStyle = useAnimatedStyle(() => {
    if (reduceMotion || labelWidth === ValueConstants.zero || scrollY.value <= morphRange[ValueConstants.zero]) {
      return { opacity: ValueConstants.one, marginLeft: spacing.xs2 };
    }
    const progress = interpolate(scrollY.value, morphRange, [ValueConstants.one, ValueConstants.zero], Extrapolation.CLAMP);
    return {
      opacity: progress,
      width: labelWidth * progress,
      marginLeft: spacing.xs2 * progress,
    };
  });

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeIn.duration(durations.controlReveal)}
      style={[
        styles.container,
        containerStyle,
        {
          // The TabBar sits outside the page, so only breathing room is needed.
          bottom: spacing.lg,
          backgroundColor: colors.primary,
          borderColor: colors.gradientBorder,
          ...shadows.lg,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onLayout={onMeasure}
        style={({ pressed }) => [styles.pressable, pressed ? styles.pressed : null]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <Ionicons name="funnel-outline" size={iconSizes.xl} color={colors.primaryText} />
        <Animated.View style={[styles.labelWrapper, labelStyle]}>
          <ThemedText
            variant="caption"
            numberOfLines={ValueConstants.one}
            onLayout={onMeasureLabel}
            style={[styles.label, { color: colors.primaryText }]}
          >
            {label}
          </ThemedText>
        </Animated.View>
      </Pressable>

      {activeCount > ValueConstants.zero ? (
        <View style={[styles.badge, { backgroundColor: colors.danger, borderColor: colors.background }]}>
          <ThemedText style={styles.badgeText} numberOfLines={ValueConstants.one} maxFontSizeMultiplier={maxFontScales.badge}>
            {badgeText}
          </ThemedText>
        </View>
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: spacing.lg,
    minHeight: controlSizes.fabExtended,
    minWidth: controlSizes.fab,
    borderRadius: radii.round,
    borderWidth: StyleSheet.hairlineWidth,
    zIndex: zIndices.floatingAction,
    overflow: 'visible',
  },
  pressable: {
    flex: ValueConstants.one,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radii.round,
    overflow: 'hidden',
  },
  pressed: {
    opacity: opacities.pressedSubtle,
  },
  labelWrapper: {
    overflow: 'hidden',
  },
  label: {
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.caption,
  },
  badge: {
    position: 'absolute',
    top: -spacing.xs,
    right: -spacing.xs,
    minWidth: decorSizes.notifBadge,
    height: decorSizes.notifBadge,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.round,
    borderWidth: borderWidths.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: BrandColors.white,
    fontSize: fontSizes.nano,
    lineHeight: decorSizes.notifBadgeLineHeight,
    fontWeight: fontWeights.bold,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
