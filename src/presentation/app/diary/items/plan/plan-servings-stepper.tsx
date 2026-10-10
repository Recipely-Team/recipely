import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { formatPlanServings } from '@presentation/base/utils/meal-plan/format-plan-servings';
import { borderWidths, fontWeights, iconSizes, mealPlanSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface PlanServingsStepperProps {
  servings: number;
  onStep: (direction: number) => void;
  /** The web grid's smaller stepper (h26). */
  compact?: boolean;
}

/**
 * "− 2 servings +" on a planned meal (design spec → Meal planner, Planned
 * card): h32 on a phone, h26 in the web grid (spanning the card, one line);
 * each button reaches 44 pt through `hitSlop`.
 */
export const PlanServingsStepper = ({ servings, onStep, compact = false }: PlanServingsStepperProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  const strings = t().mealPlan;
  const height = compact ? mealPlanSizes.stepperWeb : mealPlanSizes.stepper;
  const button = (icon: 'remove' | 'add', direction: number, label: string): React.JSX.Element => (
    <Pressable
      onPress={() => onStep(direction)}
      hitSlop={mealPlanSizes.stepperHitSlop}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.button, { width: height, opacity: pressed ? opacities.pressedSubtle : opacities.full }]}
    >
      <Ionicons name={icon} size={iconSizes.sm} color={colors.text} />
    </Pressable>
  );
  return (
    <View style={[styles.track, compact ? styles.fill : null, { minHeight: height, backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
      {button('remove', ValueConstants.minusOne, strings.decreaseServings)}
      <SizedText
        size={compact ? mealPlanSizes.stepperTextWeb : mealPlanSizes.stepperText}
        weight={fontWeights.bold}
        numberOfLines={ValueConstants.one}
        style={[styles.value, compact ? styles.valueFill : null]}
      >
        {formatPlanServings(servings, locale)}
      </SizedText>
      {button('add', ValueConstants.one, strings.increaseServings)}
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
  },
  button: { alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  value: { paddingHorizontal: spacing.xs, fontVariant: ['tabular-nums'] },
  /** The web card's stepper spans the card, its label centred between the buttons. */
  fill: { alignSelf: 'stretch' },
  valueFill: { flex: ValueConstants.one, textAlign: 'center', paddingHorizontal: ValueConstants.zero },
});
