import { Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, controlSizes, fontSizes, fontWeights, iconSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface GhostButtonProps {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  /** 44 high instead of 48 — the secondary row under the photo grid. */
  compact?: boolean;
  /** Fills a row shared with another button. */
  grow?: boolean;
}

/** The flow's secondary button: transparent, a 1.5 `border` outline, text-coloured label. */
export const GhostButton = ({ label, onPress, icon, compact = false, grow = false }: GhostButtonProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.button,
        { minHeight: compact ? controlSizes.touchTarget : controlSizes.buttonSm, borderColor: colors.border },
        grow ? styles.grow : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {icon === undefined ? null : <Ionicons name={icon} size={iconSizes.md} color={colors.text} />}
      <SizedText size={fontSizes.medium} weight={fontWeights.bold} color={colors.text}>
        {label}
      </SizedText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: borderWidths.thin,
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
