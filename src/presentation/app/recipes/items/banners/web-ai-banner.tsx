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
}

/**
 * Wide web-only AI generator promo banner. Larger than the mobile
 * `AiBannerCard`: title + subtitle, sparkle decoration, and a "Start" chip.
 */
export const WebAiBanner = ({ onPress }: WebAiBannerProps): React.JSX.Element => {
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
        end={{ x: ValueConstants.one, y: ValueConstants.zero }}
        style={[styles.card, { borderColor: colors.gradientBorder }]}
      >
        <View pointerEvents="none" style={styles.decor}>
          <Ionicons name="sparkles" size={decorSizes.sparkleDecor} color={colors.onOverlay} />
        </View>

        <View style={[styles.iconTile, { backgroundColor: colors.gradientSurface, borderColor: colors.gradientBorder }]}>
          <Ionicons name="sparkles" size={iconSizes.xxxl} color={colors.onOverlay} />
        </View>

        <View style={styles.textBlock}>
          <ThemedText style={[styles.title, { color: colors.onOverlay, textShadowColor: colors.overlayLight }]}>
            {t().recipes.aiPromo}
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: colors.onOverlay, textShadowColor: colors.overlayLight }]}>
            {t().recipes.aiPromoSubtitle}
          </ThemedText>
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
  pressed: {
    opacity: opacities.pressedFaint,
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
