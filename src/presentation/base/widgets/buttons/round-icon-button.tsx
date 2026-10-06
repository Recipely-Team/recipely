import { Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, iconSizes, opacities, radii } from '@presentation/base/theme';
import {
  RoundIconButtonTone,
  type RoundIconButtonToneType,
} from '@presentation/base/widgets/buttons/round-icon-button-tone';

export interface RoundIconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  /** The spoken name — the button has no visible text. */
  accessibilityLabel: string;
  onPress: () => void;
  /** Diameter; a `controlSizes` value. */
  size: number;
  tone?: RoundIconButtonToneType;
  disabled?: boolean;
  iconSize?: number;
}

/**
 * A circular icon-only button: steppers, week and month paging, header
 * actions. Dimmed and inert when `disabled`.
 */
export const RoundIconButton = ({
  icon,
  accessibilityLabel,
  onPress,
  size,
  tone = RoundIconButtonTone.Outlined,
  disabled = false,
  iconSize = iconSizes.lg,
}: RoundIconButtonProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const isPrimary = tone === RoundIconButtonTone.Primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        {
          width: size,
          height: size,
          backgroundColor: isPrimary ? colors.primary : colors.surface,
          borderColor: isPrimary ? colors.primary : colors.cardBorder,
          opacity: disabled ? opacities.inactive : pressed ? opacities.pressedSubtle : opacities.full,
        },
      ]}
    >
      <Ionicons name={icon} size={iconSize} color={isPrimary ? colors.primaryText : colors.text} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
