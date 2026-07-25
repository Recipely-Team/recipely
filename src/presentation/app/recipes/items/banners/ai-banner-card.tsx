import { StyleSheet, View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes, avatarSizes, borderWidths, opacities } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface AiBannerCardProps {
  onPress: () => void;
}

/**
 * Compact single-line promo for the AI recipe generator. Slimmed from the
 * earlier two-line card so the home recipe list keeps more vertical room
 * (mobile and web).
 */
export const AiBannerCard = ({ onPress }: AiBannerCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t().recipes.aiPromo}
      style={styles.wrapper}
    >
      <LinearGradient
        colors={[colors.primaryGradientStart, colors.primaryGradientEnd]}
        start={{ x: ValueConstants.zero, y: ValueConstants.zero }}
        end={{ x: ValueConstants.one, y: ValueConstants.one }}
        style={[styles.card, { borderColor: colors.primary }]}
      >
        <View pointerEvents="none" style={styles.decor}>
          <Ionicons name="sparkles" size={avatarSizes.xl} color={colors.onOverlay} />
        </View>

        <View style={[styles.iconBadge, { backgroundColor: colors.gradientSurface, borderColor: colors.gradientBorder }]}>
          <Ionicons name="sparkles" size={iconSizes.md} color={colors.onOverlay} />
        </View>

        <ThemedText
          variant="body"
          numberOfLines={1}
          style={[styles.title, { color: colors.onOverlay }]}
        >
          {t().recipes.aiPromo}
        </ThemedText>

        <Ionicons name="arrow-forward" size={iconSizes.md} color={colors.onOverlay} />
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  decor: {
    position: 'absolute',
    right: -spacing.lg,
    top: -spacing.lg,
    opacity: opacities.scrimSubtle,
  },
  iconBadge: {
    width: controlSizes.chip,
    height: controlSizes.chip,
    borderRadius: radii.md,
    borderWidth: borderWidths.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: ValueConstants.one,
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.medium,
  },
});
