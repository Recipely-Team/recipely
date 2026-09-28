import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, fontSizes, fontWeights, iconSizes, lineHeightFor, lineHeights, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface PhotoGridAddTileProps {
  size: number;
  x: number;
  y: number;
  onPress: () => void;
}

/** The last cell of the editor's grid: pick more photos. */
export const PhotoGridAddTile = ({ size, x, y, onPress }: PhotoGridAddTileProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t().mediaPicker.more}
      onPress={onPress}
      style={[styles.tile, { width: size, height: size, left: x, top: y, borderColor: colors.inputBorder }]}
    >
      <Ionicons name="add" size={iconSizes.xl} color={colors.primary} />
      <ThemedText style={[styles.label, { color: colors.text }]}>{t().mediaPicker.more}</ThemedText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  tile: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.xs2,
    borderRadius: radii.md,
    borderWidth: borderWidths.medium,
    borderStyle: 'dashed',
  },
  label: {
    fontSize: fontSizes.small,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeightFor(fontSizes.small, lineHeights.tight),
    textAlign: 'center',
  },
});
