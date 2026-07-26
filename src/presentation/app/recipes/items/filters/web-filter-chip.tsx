import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, iconSizes, borderWidths } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface WebFilterChipProps {
  label: string;
  active: boolean;
  onToggle: () => void;
  /** Difficulty-style chip: grows to fill the row (flex:1), taller, centered. */
  grow?: boolean;
}

/**
 * Pill filter chip for the web filter modal. Active chips fill with
 * `colors.primary` and show a leading checkmark; inactive chips sit on
 * `colors.cardBackground` with a `colors.cardBorder` outline.
 */
export const WebFilterChip = ({
  label,
  active,
  onToggle,
  grow = false,
}: WebFilterChipProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      style={[
        styles.chip,
        grow ? styles.grow : null,
        {
          borderColor: active ? colors.primary : colors.cardBorder,
          backgroundColor: active ? colors.primary : colors.cardBackground,
        },
      ]}
    >
      {active ? (
        <Ionicons
          name="checkmark"
          size={iconSizes.md}
          color={colors.primaryText}
          style={styles.check}
        />
      ) : null}
      <ThemedText
        variant="caption"
        style={[
          styles.label,
          { color: active ? colors.primaryText : colors.text, fontWeight: active ? '700' : '500' },
        ]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.round,
    borderWidth: borderWidths.thin,
  },
  grow: {
    flex: ValueConstants.one,
    justifyContent: 'center',
    paddingVertical: spacing.sm2,
  },
  check: {
    marginRight: spacing.xxs,
  },
  label: {
    fontSize: fontSizes.caption,
  },
});
