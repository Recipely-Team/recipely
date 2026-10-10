import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, controlSizes, fontSizes, fontWeights, iconSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { FridgeLimits } from '@domain/fridge/fridge-limits';
import { ValueConstants } from '@core/constants';

export interface ServingsStepperProps {
  value: number;
  onChange: (servings: number) => void;
}

/** − n + with 44 targets, held to the backend's 1–12; an end stop dims its button. */
export const ServingsStepper = ({ value, onChange }: ServingsStepperProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const copy = t().fridge;
  const canLess = value > FridgeLimits.servingsMin;
  const canMore = value < FridgeLimits.servingsMax;
  const button = (icon: 'remove' | 'add', enabled: boolean, label: string, delta: number) => (
    <Pressable
      onPress={() => onChange(value + delta)}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !enabled }}
      style={[styles.button, { borderColor: colors.border, opacity: enabled ? opacities.full : opacities.disabled }]}
    >
      <Ionicons name={icon} size={iconSizes.lg} color={colors.text} />
    </Pressable>
  );

  return (
    <View style={styles.row} accessibilityRole="adjustable" accessibilityLabel={copy.servings} accessibilityValue={{ now: value, min: FridgeLimits.servingsMin, max: FridgeLimits.servingsMax }}>
      {button('remove', canLess, copy.servingsLess, ValueConstants.minusOne)}
      <SizedText size={fontSizes.heading} weight={fontWeights.bold} style={styles.value}>
        {value}
      </SizedText>
      {button('add', canMore, copy.servingsMore, ValueConstants.one)}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  button: {
    width: controlSizes.touchTarget,
    height: controlSizes.touchTarget,
    borderRadius: radii.round,
    borderWidth: borderWidths.thin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    minWidth: controlSizes.checkbox,
    textAlign: 'center',
  },
});
