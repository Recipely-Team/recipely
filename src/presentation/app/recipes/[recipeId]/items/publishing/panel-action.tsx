import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, iconSizes, fontSizes, fontWeights, controlSizes, borderWidths, opacities } from '@presentation/base/theme';
import type { IoniconName } from '@presentation/base/errors/ionicon-name';

export interface PanelActionProps {
  label: string;
  icon: IoniconName;
  onPress: () => void;
  /** The one action the panel leads with (Publish); filled rather than outlined. */
  primary?: boolean;
  disabled?: boolean;
}

/** One pill button in the owner's status panel or its checklist. */
export const PanelAction = ({
  label,
  icon,
  onPress,
  primary = false,
  disabled = false,
}: PanelActionProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const fill = disabled ? colors.border : primary ? colors.primary : colors.surface;
  const ink = disabled ? colors.textMuted : primary ? colors.primaryText : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor: fill,
          borderColor: primary || disabled ? fill : colors.cardBorder,
          opacity: pressed ? opacities.pressed : opacities.full,
        },
      ]}
    >
      <Ionicons name={icon} size={iconSizes.md} color={ink} />
      <ThemedText variant="caption" style={[styles.label, { color: ink }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs2,
    minHeight: controlSizes.iconBtn,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
  },
  label: {
    fontWeight: fontWeights.semibold,
    fontSize: fontSizes.caption,
  },
});
