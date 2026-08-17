import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { CountBadgeTone } from '@presentation/base/widgets/text/count-badge-tone';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, decorSizes, borderWidths, maxFontScales, BrandColors } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

/**
 * Where each tone stops counting, and what it shows instead.
 *
 * An alert is a queue the user has to work through, and past a handful the
 * exact depth stops being the point. A tally is their own content — capping
 * "you have 43 drafts" at "9+" throws away the answer they opened the screen
 * for — so it only rounds off where the digits would burst the shape.
 */
const OVERFLOW = {
  [CountBadgeTone.Alert]: { max: 9, label: '9+' },
  [CountBadgeTone.Tally]: { max: 99, label: '99+' },
} as const;

export interface CountBadgeProps {
  count: number;
  /** What the number means. Defaults to {@link CountBadgeTone.Alert}. */
  tone?: CountBadgeTone;
  /**
   * Where the badge sits. It is the CALLER that knows what it is counting —
   * the bell pins it to the corner of a round button, the My-Recipes tabs hang
   * it off a bare glyph — so placement is passed in rather than assumed.
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * The count marker worn by an icon: unread notifications on the bell, how many
 * recipes are behind each My-Recipes tab.
 *
 * @remarks
 * - **Nothing at zero** — a badge reading "0" is a marker that something needs
 *   attention when nothing does, so the component renders null instead.
 * - **Tone carries the meaning, not just the colour** — see
 *   {@link CountBadgeTone}. A tally is drawn in the chip palette because red is
 *   the app's word for "deal with me", and a shelf of saved recipes is not
 *   asking for anything.
 * - **The ring is the page, not the badge** — the border is drawn in
 *   `colors.background` so the badge appears cut out of the surface behind it,
 *   which is what keeps it legible where it overlaps its own glyph.
 * - **The true count belongs to the label** — this rounds off past the tone's
 *   maximum, so the pressable that owns the badge must put the real number in
 *   its `accessibilityLabel`; a screen reader hearing "9+" has lost information
 *   the screen never had to give up.
 */
export const CountBadge = ({
  count,
  tone = CountBadgeTone.Alert,
  style,
}: CountBadgeProps): React.JSX.Element | null => {
  const colors = useTheme().colors;
  if (count <= ValueConstants.zero) return null;

  const isAlert = tone === CountBadgeTone.Alert;
  const { max, label } = OVERFLOW[tone];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: isAlert ? colors.danger : colors.chipBackground,
          borderColor: colors.background,
        },
        style,
      ]}
    >
      <ThemedText
        style={[styles.badgeText, { color: isAlert ? BrandColors.white : colors.chipText }]}
        maxFontSizeMultiplier={maxFontScales.badge}
      >
        {count > max ? label : String(count)}
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
    fontSize: fontSizes.nano,
    fontWeight: fontWeights.bold,
    // A badge is a fixed disc: the digits inside it cannot reflow, so the line
    // box is pinned and the OS font multiplier is capped rather than allowed to
    // push the number out of its circle.
    lineHeight: decorSizes.notifBadgeLineHeight,
    includeFontPadding: false,
  },
});
