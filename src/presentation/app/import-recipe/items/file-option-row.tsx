import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontWeights, iconSizes, controlSizes, borderWidths } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface FileOptionRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint: string;
  onPress: () => void;
}

/** One way to add pages — the camera, the library — as a tappable row. */
export const FileOptionRow = ({ icon, label, hint, onPress }: FileOptionRowProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
    >
      <View style={[styles.tile, { backgroundColor: colors.chipBackground }]}>
        <Ionicons name={icon} size={iconSizes.xl} color={colors.chipText} />
      </View>
      <View style={styles.body}>
        <ThemedText variant="body" style={styles.label}>
          {label}
        </ThemedText>
        <ThemedText variant="caption" style={{ color: colors.textMuted }}>
          {hint}
        </ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={iconSizes.md} color={colors.textMuted} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm2,
    borderRadius: radii.lg,
    borderWidth: borderWidths.hairline,
  },
  tile: {
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: ValueConstants.one,
    gap: spacing.xxs,
  },
  label: {
    fontWeight: fontWeights.bold,
  },
});
