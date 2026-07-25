import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { spacing, radii, fontSizes, fontWeights, letterSpacings, iconSizes, controlSizes, opacities } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface WebMyRecipesHeaderProps {
  onCreate: () => void;
}

/** Web My Recipes header band: h1 title + muted subtitle + "Create recipe" CTA. */
export const WebMyRecipesHeader = ({ onCreate }: WebMyRecipesHeaderProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View style={[styles.band, { borderBottomColor: colors.border }]}>
      <View style={styles.text}>
        <ThemedText accessibilityRole="header" style={[styles.title, { color: colors.text }]}>
          {t().myRecipes.title}
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textMuted }]}>
          {t().myRecipes.webSubtitle}
        </ThemedText>
      </View>
      <Pressable
        onPress={onCreate}
        accessibilityRole="button"
        accessibilityLabel={t().myRecipes.createNew}
        style={({ pressed }) => [
          styles.createBtn,
          shadows.sm,
          { backgroundColor: colors.primary, opacity: pressed ? opacities.pressedFaint : opacities.full },
        ]}
      >
        <Ionicons name="add" size={iconSizes.xl} color={colors.primaryText} />
        <ThemedText style={[styles.createLabel, { color: colors.primaryText }]}>
          {t().myRecipes.createNew}
        </ThemedText>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  band: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingBottom: spacing.lg,
    marginBottom: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  text: {
    flex: ValueConstants.one,
    minWidth: ValueConstants.zero,
    gap: spacing.xs,
  },
  title: {
    fontWeight: fontWeights.heavy,
    fontSize: fontSizes.headline,
    letterSpacing: letterSpacings.tighter,
  },
  subtitle: {
    fontSize: fontSizes.medium,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: controlSizes.heroActionBtn,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    flexShrink: ValueConstants.zero,
  },
  createLabel: {
    fontWeight: fontWeights.bold,
    fontSize: fontSizes.body,
  },
});
