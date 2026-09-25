import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontWeights, iconSizes, borderWidths, aspectRatios } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface FileAddTileProps {
  width: number;
  onPress: () => void;
}

/** The dashed tile after the last page, while the batch has room for another. */
export const FileAddTile = ({ width, onPress }: FileAddTileProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const label = t().fileImport.addPage;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.tile, { width, borderColor: colors.inputBorder }]}
    >
      <Ionicons name="add" size={iconSizes.xxl} color={colors.text} />
      <ThemedText variant="caption" style={styles.label}>
        {label}
      </ThemedText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  tile: {
    aspectRatio: aspectRatios.pagePortrait,
    borderRadius: radii.md,
    borderWidth: borderWidths.thin,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs2,
    padding: spacing.xs,
  },
  label: {
    fontWeight: fontWeights.semibold,
    textAlign: 'center',
  },
});
