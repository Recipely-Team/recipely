import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { aspectRatios, borderWidths, fontSizes, fontWeights, iconSizes, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface PhotoAddTileProps {
  /** The strip's thumb width; the tile matches its height. */
  thumbWidth: number;
  disabled: boolean;
  onPress: () => void;
}

/** The owner's Add at the end of the strip — outside the scrolling list, so it is always in reach. */
export const PhotoAddTile = ({ thumbWidth, disabled, onPress }: PhotoAddTileProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t().photoViewer.add}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.tile,
        { minHeight: thumbWidth / aspectRatios.hero, minWidth: thumbWidth, borderColor: colors.inputBorder },
      ]}
    >
      <Ionicons name="add" size={iconSizes.md} color={colors.primary} />
      <ThemedText style={[styles.label, { color: colors.text }]}>{t().photoViewer.add}</ThemedText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs2,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: borderWidths.thin,
    borderStyle: 'dashed',
  },
  label: {
    fontSize: fontSizes.small,
    fontWeight: fontWeights.bold,
  },
});
