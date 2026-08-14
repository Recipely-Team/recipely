import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, iconSizes, decorSizes, borderWidths, opacities } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface WebAiBannerProps {
  onPress: () => void;
  /**
   * Stacks icon, text and chip instead of laying them across a row. The wide
   * form is a full-width bar; inside the hero band's side column there is no
   * width to spread across, so the row form would crush the text to a couple of
   * words per line.
   */
  compact?: boolean;
}

/**
 * Wide web-only AI generator promo banner. Larger than the mobile
 * `AiBannerCard`: title + subtitle, sparkle decoration, and a "Start" chip.
 */
export const WebAiBanner = ({ onPress, compact = false }: WebAiBannerProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t().recipes.aiPromo}
      style={({ pressed }) => [compact ? styles.wrapperCompact : styles.wrapper, pressed ? styles.pressed : null]}
    >
      <LinearGradient
        colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
        start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
        end={{ x: ValueConstants.one, y: ValueConstants.zero }}
        style={[styles.card, compact ? styles.cardCompact : null, { borderColor: colors.gradientBorder }]}
      >
        {compact ? null : (
          <View pointerEvents="none" style={styles.decor}>
            <Ionicons name="sparkles" size={decorSizes.sparkleDecor} color={colors.onOverlay} />
          </View>
        )}

        <View
          style={[
            styles.iconTile,
            compact ? styles.iconTileCompact : null,
            { backgroundColor: colors.gradientSurface, borderColor: colors.gradientBorder },
          ]}
        >
          <Ionicons name="sparkles" size={compact ? iconSizes.lg : iconSizes.xxxl} color={colors.onOverlay} />
        </View>

        <View style={styles.textBlock}>
          <ThemedText
            numberOfLines={compact ? 2 : undefined}
            style={[styles.title, compact ? styles.titleCompact : null, { color: colors.onOverlay, textShadowColor: colors.overlayLight }]}
          >
            {t().recipes.aiPromo}
          </ThemedText>
          {compact ? null : (
            <ThemedText style={[styles.subtitle, { color: colors.onOverlay, textShadowColor: colors.overlayLight }]}>
              {t().recipes.aiPromoSubtitle}
            </ThemedText>
          )}
        </View>

        <View style={[styles.startChip, { backgroundColor: colors.onOverlay }]}>
          <ThemedText style={[styles.startLabel, { color: colors.heroButtonText }]}>
            {t().recipes.aiStart}
          </ThemedText>
          <Ionicons name="chevron-forward" size={iconSizes.md} color={colors.heroButtonText} />
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  // In the band's side column the banner is a tile, not a bar: no bottom margin
  // (the column's gap handles it) and it fills the width it is given.
  wrapperCompact: {
    width: '100%',
  },
  pressed: {
    opacity: opacities.pressedFaint,
  },
  // A slim ROW, not a stacked tile. Stacking icon + title + subtitle + chip
  // needed ~200px, but the side stack only has whatever the band's ratio left
  // after the cuisine list — the chip ended up drawn over the title. A row with
  // no subtitle fits in a fraction of that and leaves the list its room.
  cardCompact: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderWidth: borderWidths.hairline,
    borderRadius: radii.xxl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xxl,
    overflow: 'hidden',
  },
  decor: {
    position: 'absolute',
    top: -spacing.lg,
    right: -spacing.md,
    opacity: opacities.scrimFaint,
  },
  iconTile: {
    width: decorSizes.aiBannerIcon,
    height: decorSizes.aiBannerIcon,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: ValueConstants.zero,
  },
  textBlock: {
    flex: ValueConstants.one,
    gap: spacing.xs,
  },
  iconTileCompact: {
    width: decorSizes.aiBannerIconCompact,
    height: decorSizes.aiBannerIconCompact,
    borderRadius: radii.md,
  },
  titleCompact: {
    fontSize: fontSizes.medium,
  },
  title: {
    fontWeight: fontWeights.heavy,
    fontSize: fontSizes.subtitle,
    textShadowOffset: { width: ValueConstants.zero, height: ValueConstants.one },
    textShadowRadius: spacing.xs2,
  },
  subtitle: {
    fontWeight: fontWeights.regular,
    fontSize: fontSizes.medium,
    opacity: opacities.onMediaSubtle,
    textShadowOffset: { width: ValueConstants.zero, height: ValueConstants.one },
    textShadowRadius: spacing.xs,
  },
  startChip: {
    flexShrink: ValueConstants.zero,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radii.round,
    paddingVertical: spacing.xs2,
    paddingHorizontal: spacing.md,
  },
  startLabel: {
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.caption,
  },
});
