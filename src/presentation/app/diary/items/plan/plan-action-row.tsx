import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { fontSizes, fontWeights, iconSizes, mealPlanSizes, opacities, spacing } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface PlanActionRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  /** Red text and glyph — Remove, Clear week. */
  danger?: boolean;
  /** Greyed out, with the reason under the label. */
  disabledHint?: string;
}

/** One row of a Plan menu sheet (design spec → Meal planner, Meal actions): glyph, label, min-height 52. */
export const PlanActionRow = ({ icon, label, onPress, danger = false, disabledHint }: PlanActionRowProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const disabled = disabledHint !== undefined;
  const ink = danger ? colors.danger : colors.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityHint={disabledHint}
      style={({ pressed }) => [
        styles.row,
        { opacity: disabled ? opacities.inactive : pressed ? opacities.pressedSubtle : opacities.full },
      ]}
    >
      <Ionicons name={icon} size={iconSizes.lg} color={ink} />
      <View style={styles.text}>
        <SizedText size={fontSizes.medium} weight={fontWeights.semibold} color={ink}>
          {label}
        </SizedText>
        {disabledHint === undefined ? null : (
          <SizedText size={fontSizes.small} color={colors.textMuted}>
            {disabledHint}
          </SizedText>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: mealPlanSizes.actionRowMin },
  text: { flex: ValueConstants.one, gap: spacing.xxs },
});
