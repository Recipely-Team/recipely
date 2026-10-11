import { Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { aspectRatios, borderWidths, fontSizes, fontWeights, iconSizes, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface AddPhotoTileProps {
  onPress: () => void;
}

/** An empty slot in the capture grid: dashed, "+ Add photo" — opens the library (or the browser's file picker). */
export const AddPhotoTile = ({ onPress }: AddPhotoTileProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={t().fridge.addPhoto}
      style={[styles.tile, { borderColor: colors.border }]}
    >
      <Ionicons name="add" size={iconSizes.xl} color={colors.textMuted} />
      <SizedText size={fontSizes.small} weight={fontWeights.semibold} color={colors.textMuted} style={styles.label}>
        {t().fridge.addPhoto}
      </SizedText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  tile: {
    flex: ValueConstants.one,
    aspectRatio: aspectRatios.pagePortrait,
    borderRadius: radii.lg,
    borderWidth: borderWidths.thin,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  label: {
    textAlign: 'center',
  },
});
