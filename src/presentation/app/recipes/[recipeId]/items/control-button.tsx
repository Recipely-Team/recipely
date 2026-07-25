import { StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, iconSizes, controlSizes, opacities } from '@presentation/base/theme';

interface ControlButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  bg: string;
  iconColor: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export const ControlButton = ({
  icon,
  bg,
  iconColor,
  label,
  onPress,
  disabled,
}: ControlButtonProps): React.JSX.Element => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      styles.ctrlBtn,
      {
        backgroundColor: bg,
        opacity: disabled
          ? opacities.inactive
          : pressed
            ? opacities.pressedStrong
            : opacities.full,
      },
    ]}
  >
    <Ionicons name={icon} size={iconSizes.md} color={iconColor} />
  </Pressable>
);

const styles = StyleSheet.create({
  ctrlBtn: {
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
