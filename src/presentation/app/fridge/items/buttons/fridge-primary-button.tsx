import { Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { controlSizes, fontSizes, fontWeights, iconSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface FridgePrimaryButtonProps {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  grow?: boolean;
}

/**
 * A solid `primary` button, 48 high — "Take photo" and the full-screen states'
 * main action. Not the shared `PrimaryButton`: that one is 52 high, full width
 * and carries no icon, and these sit two to a row.
 */
export const FridgePrimaryButton = ({ label, onPress, icon, grow = false }: FridgePrimaryButtonProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.button, { backgroundColor: colors.primary }, grow ? styles.grow : null, pressed ? styles.pressed : null]}
    >
      {icon === undefined ? null : <Ionicons name={icon} size={iconSizes.md} color={colors.primaryText} />}
      <SizedText size={fontSizes.medium} weight={fontWeights.bold} color={colors.primaryText}>
        {label}
      </SizedText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: controlSizes.buttonSm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
  },
  grow: {
    flex: ValueConstants.one,
  },
  pressed: {
    opacity: opacities.pressedSubtle,
  },
});
