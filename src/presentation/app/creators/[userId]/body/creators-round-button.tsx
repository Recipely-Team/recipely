import type { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, controlSizes, iconSizes, opacities, radii } from '@presentation/base/theme';

export interface CreatorsRoundButtonProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}

/** The 44 round surface button of the creators pages' top bar — back, share. */
export const CreatorsRoundButton = ({ icon, label, onPress }: CreatorsRoundButtonProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.round,
        { backgroundColor: colors.surface, borderColor: colors.border },
        { opacity: pressed ? opacities.pressed : opacities.full },
      ]}
    >
      <Ionicons name={icon} size={iconSizes.xl} color={colors.text} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  round: {
    width: controlSizes.touchTarget,
    height: controlSizes.touchTarget,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
