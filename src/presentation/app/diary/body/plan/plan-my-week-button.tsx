import { Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { borderWidths, fontSizes, fontWeights, iconSizes, mealPlanSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { useTranslations } from '@presentation/i18n';

export interface PlanMyWeekButtonProps {
  wide: boolean;
  onPress: () => void;
}

/**
 * Opens "Plan my week" (prototype: Import Review - Plan My Week board, §2).
 * Phone: a full-width chip button under the week bar. Wide/web: a ghost button
 * with a `primary` sparkle, aligned to the end of the row.
 */
export const PlanMyWeekButton = ({ wide, onPress }: PlanMyWeekButtonProps): React.JSX.Element => {
  const t = useTranslations();
  const colors = useTheme().colors;
  const label = t.mealPlan.planWeek.title;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        wide ? styles.ghost : styles.full,
        wide
          ? { backgroundColor: colors.surface, borderColor: colors.cardBorder }
          : { backgroundColor: colors.chipBackground },
        { opacity: pressed ? opacities.pressedLight : opacities.full },
      ]}
    >
      <Ionicons name="sparkles" size={iconSizes.md} color={wide ? colors.primary : colors.chipText} />
      <SizedText size={fontSizes.body} weight={fontWeights.bold} color={wide ? colors.text : colors.chipText}>
        {label}
      </SizedText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  full: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: mealPlanSizes.ctaWeb,
    borderRadius: radii.lg,
  },
  ghost: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: spacing.sm,
    minHeight: mealPlanSizes.ghostWeb,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
  },
});
