import { StyleSheet, View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes, avatarSizes, borderWidths, opacities } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';
import { FridgeCameraButton } from '@presentation/app/recipes/items/banners/fridge-camera-button';

export interface AiBannerCardProps {
  onPress: () => void;
}

/**
 * Compact single-line promo for the AI recipe generator. Slimmed from the
 * earlier two-line card so the home recipe list keeps more vertical room
 * (mobile and web). With `fridgeToRecipe` on, a camera shortcut to "Cook
 * from my fridge" sits on its right.
 */
export const AiBannerCard = ({ onPress }: AiBannerCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View style={styles.wrapper}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={t().recipes.aiPromo} style={styles.banner}>
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

          <ThemedText variant="body" numberOfLines={ValueConstants.one} style={[styles.title, { color: colors.onOverlay }]}>
            {t().recipes.aiPromo}
          </ThemedText>

          <Ionicons name="arrow-forward" size={iconSizes.md} color={colors.onOverlay} />
        </LinearGradient>
      </Pressable>
      <FridgeCameraButton />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  banner: { flex: ValueConstants.one },
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
