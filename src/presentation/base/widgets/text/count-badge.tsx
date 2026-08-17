import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, decorSizes, borderWidths, maxFontScales, BrandColors } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

/**
 * A two-digit count widens the badge past the circle it is drawn in, and the
 * exact number stops being the point once it is "a lot".
 */
const COUNT_BADGE_MAX = 9;

/** What the badge shows once the count passes {@link COUNT_BADGE_MAX}. */
const COUNT_BADGE_OVERFLOW_LABEL = '9+';

export interface CountBadgeProps {
  count: number;
  /**
   * Where the badge sits. It is the CALLER that knows what it is counting —
   * the bell pins it to the corner of a round button, the My-Recipes tabs hang
   * it off a bare glyph — so placement is passed in rather than assumed.
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * The red count marker worn by an icon: unread notifications on the bell,
 * how many recipes are behind each My-Recipes tab.
 *
 * @remarks
 * - **Nothing at zero** — a badge reading "0" is a marker that something needs
 *   attention when nothing does, so the component renders null instead.
 * - **The ring is the page, not the badge** — the border is drawn in
 *   `colors.background` so the badge appears cut out of the surface behind it,
 *   which is what keeps it legible where it overlaps its own glyph.
 * - **The true count belongs to the label** — this shows "9+" past
 *   {@link COUNT_BADGE_MAX}, so the pressable that owns the badge must put the
 *   real number in its `accessibilityLabel`; a screen reader hearing "9+" has
 *   lost information the screen never had to give up.
 */
export const CountBadge = ({ count, style }: CountBadgeProps): React.JSX.Element | null => {
  const colors = useTheme().colors;
  if (count <= ValueConstants.zero) return null;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.danger, borderColor: colors.background },
        style,
      ]}
    >
      <ThemedText style={styles.badgeText} maxFontSizeMultiplier={maxFontScales.badge}>
        {count > COUNT_BADGE_MAX ? COUNT_BADGE_OVERFLOW_LABEL : String(count)}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
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
    fontWeight: fontWeights.bold,
    // A badge is a fixed disc: the digits inside it cannot reflow, so the line
    // box is pinned and the OS font multiplier is capped rather than allowed to
    // push the number out of its circle.
    lineHeight: decorSizes.notifBadgeLineHeight,
    includeFontPadding: false,
  },
});
