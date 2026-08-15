import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, letterSpacings, lineHeightFor, iconSizes, decorSizes, controlSizes, borderWidths, opacities } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface WebAiBannerProps {
  onPress: () => void;
  /**
   * The full-width band form: everything on one line, supporting sentence
   * dropped. Used when the panel has wrapped out of the hero row and has a
   * whole line to itself, where the tall form would be mostly empty gradient.
   */
  wide?: boolean;
}

/**
 * The AI generator's promo, as the hero row's third block.
 *
 * @remarks
 * - **Two forms, one component.** In the row it is a tall panel — mark, kicker,
 *   headline, one paragraph, and a button pinned to the bottom edge so the
 *   three blocks in the row end level. Once it wraps onto its own line it turns
 *   into a band: the same content on one line with the paragraph dropped,
 *   because a full-width bar of body copy is a wall, not a promo.
 * - The button is pinned with `marginTop: auto` rather than a spacer, so the
 *   panel keeps its shape whatever height the row settles at.
 */
export const WebAiBanner = ({ onPress, wide = false }: WebAiBannerProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t().recipes.aiPromo}
      style={({ pressed }) => [styles.wrapper, pressed ? styles.pressed : null]}
    >
      <LinearGradient
        colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
        start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
        end={{ x: ValueConstants.one, y: ValueConstants.one }}
        style={[styles.card, wide ? styles.cardWide : null, { borderColor: colors.gradientBorder }]}
      >
        <View pointerEvents="none" style={styles.decor}>
          <Ionicons name="sparkles" size={decorSizes.sparkleDecor} color={colors.onOverlay} />
        </View>

        <View style={[styles.text, wide ? styles.textWide : null]}>
          <View style={[styles.mark, { backgroundColor: colors.gradientSurface, borderColor: colors.gradientBorder }]}>
            <Ionicons name="sparkles" size={iconSizes.md} color={colors.onOverlay} />
          </View>
          <ThemedText style={[styles.kicker, { color: colors.onOverlay }]}>
            {t().recipes.aiKicker}
          </ThemedText>
          <ThemedText style={[styles.title, wide ? styles.titleWide : null, { color: colors.onOverlay }]}>
            {t().recipes.aiPromo}
          </ThemedText>
          {wide ? null : (
            <ThemedText style={[styles.body, { color: colors.onOverlay }]}>
              {t().recipes.aiPromoSubtitle}
            </ThemedText>
          )}
        </View>

        <View style={[styles.foot, wide ? styles.footWide : null]}>
          <View style={[styles.action, { backgroundColor: colors.onOverlay }]}>
            <ThemedText style={[styles.actionLabel, { color: colors.heroButtonText }]}>
              {t().recipes.aiStart}
            </ThemedText>
            <Ionicons name="arrow-forward" size={iconSizes.md} color={colors.heroButtonText} />
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    flexGrow: ValueConstants.one,
  },
  pressed: {
    opacity: opacities.pressedFaint,
  },
  card: {
    flexGrow: ValueConstants.one,
    flexDirection: 'column',
    gap: spacing.md,
    borderWidth: borderWidths.hairline,
    borderRadius: radii.xxl,
    padding: spacing.lg2,
    overflow: 'hidden',
  },
  cardWide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  decor: {
    position: 'absolute',
    top: -spacing.xl,
    right: -spacing.md,
    opacity: opacities.scrimFaint,
  },
  text: {
    gap: spacing.xs,
  },
  textWide: {
    flexShrink: ValueConstants.one,
    flexGrow: ValueConstants.one,
  },
  mark: {
    width: decorSizes.aiBannerIconCompact,
    height: decorSizes.aiBannerIconCompact,
    borderRadius: radii.md,
    borderWidth: borderWidths.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  kicker: {
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.caption,
    letterSpacing: letterSpacings.wide,
    opacity: opacities.onMediaSubtle,
  },
  title: {
    fontWeight: fontWeights.heavy,
    fontSize: fontSizes.title,
    lineHeight: lineHeightFor(fontSizes.title),
  },
  titleWide: {
    fontSize: fontSizes.subtitle,
    lineHeight: lineHeightFor(fontSizes.subtitle),
  },
  body: {
    fontWeight: fontWeights.regular,
    fontSize: fontSizes.medium,
    lineHeight: lineHeightFor(fontSizes.medium),
    opacity: opacities.onMediaSubtle,
  },
  // Pinned to the bottom edge so the panel ends level with the cards beside it,
  // whatever height the row settles at.
  foot: {
    marginTop: 'auto',
    alignSelf: 'stretch',
  },
  footWide: {
    marginTop: ValueConstants.zero,
    alignSelf: 'auto',
  },
  action: {
    minHeight: controlSizes.button,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  actionLabel: {
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.body,
  },
});
