import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { spacing, radii, fontWeights, iconSizes, controlSizes, opacities } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface MyRecipesHeaderProps {
  onCreate: () => void;
}

/** Mobile My-Recipes title row with the "Create new" action. */
export const MyRecipesHeader = ({ onCreate }: MyRecipesHeaderProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View style={styles.header}>
      <ThemedText variant="title">{t().myRecipes.title}</ThemedText>
      <View style={styles.headerActions}>
        <Pressable
          onPress={onCreate}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.createButton,
            shadows.sm,
            { backgroundColor: colors.primary, opacity: pressed ? opacities.pressedSubtle : opacities.full },
          ]}
        >
          <Ionicons name="add" size={iconSizes.md} color={colors.primaryText} />
          <ThemedText variant="caption" style={[styles.createLabel, { color: colors.primaryText }]}>
            {t().myRecipes.createNew}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs2,
    height: controlSizes.floatingBtn,
    paddingHorizontal: spacing.md,
    borderRadius: radii.round,
  },
  createLabel: {
    fontWeight: fontWeights.semibold,
  },
});
