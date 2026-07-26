import { Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, iconSizes, controlSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface PasswordEyeToggleProps {
  visible: boolean;
  onToggle: () => void;
}

/**
 * Show/hide toggle for a password field: swaps the eye icon and announces the
 * next action to screen readers. Positioning is owned by the caller's slot.
 */
export const PasswordEyeToggle = ({ visible, onToggle }: PasswordEyeToggleProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <Pressable
      onPress={onToggle}
      hitSlop={spacing.sm}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel={visible ? t().register.hidePassword : t().register.showPassword}
    >
      <MaterialCommunityIcons
        name={visible ? 'eye-off-outline' : 'eye-outline'}
        size={iconSizes.lg}
        color={colors.textMuted}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
