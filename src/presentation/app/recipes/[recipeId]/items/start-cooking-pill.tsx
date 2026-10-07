import { Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, controlSizes, fontSizes, fontWeights, iconSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { useOpenCookMode } from '@presentation/app/recipes/[recipeId]/hooks/use-open-cook-mode';

export interface StartCookingPillProps {
  recipeId: string;
}

/**
 * The web recipe header's "Start cooking" pill: the one filled action in the
 * row, because it is the one that starts the recipe rather than filing it.
 */
export const StartCookingPill = ({ recipeId }: StartCookingPillProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const openCookMode = useOpenCookMode(recipeId);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={openCookMode}
      style={({ pressed }) => [
        styles.pill,
        { backgroundColor: colors.primary, borderColor: colors.primary, opacity: pressed ? opacities.pressed : opacities.full },
      ]}
    >
      <Ionicons name="restaurant-outline" size={iconSizes.md} color={colors.primaryText} />
      <ThemedText variant="caption" style={[styles.label, { color: colors.primaryText }]}>
        {t().cookMode.start}
      </ThemedText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs2,
    minHeight: controlSizes.searchBar,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
  },
  label: {
    fontWeight: fontWeights.semibold,
    fontSize: fontSizes.caption,
  },
});
