import { type ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, controlSizes, iconSizes, opacities } from '@presentation/base/theme';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { ValueConstants } from '@core/constants';

export interface SettingsRowProps {
  icon: string;
  label: string;
  rightElement?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  showChevron?: boolean;
}

export const SettingsRow = ({
  icon,
  label,
  rightElement,
  onPress,
  destructive = false,
  showChevron,
}: SettingsRowProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const iconColor = destructive ? colors.danger : colors.primary;
  const chevronVisible = showChevron ?? (onPress !== undefined);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      // A row with a handler is a button; without one it is plain text. Saying
      // so is what lets assistive tech (and a test) tell the two apart.
      accessibilityRole={onPress !== undefined ? 'button' : 'text'}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.cardBackground,
          opacity: pressed && onPress ? opacities.pressedStrong : opacities.full,
        },
      ]}
    >
      <Ionicons
        name={icon as keyof typeof Ionicons.glyphMap}
        size={iconSizes.xxl}
        color={iconColor}
      />
      <ThemedText
        variant="body"
        style={[styles.label, destructive ? { color: colors.danger } : undefined]}
      >
        {label}
      </ThemedText>
      {rightElement}
      {chevronVisible && !rightElement ? (
        <Ionicons name="chevron-forward" size={iconSizes.lg} color={colors.textMuted} />
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    minHeight: controlSizes.settingsRow,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  label: {
    flex: ValueConstants.one,
    marginLeft: spacing.md,
  },
});
