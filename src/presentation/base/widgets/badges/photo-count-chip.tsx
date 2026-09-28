import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { fontSizes, fontWeights, iconSizes, radii, spacing } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface PhotoCountChipProps {
  /** How many photos the recipe has. Nothing is drawn below two — one photo is the cover you are looking at. */
  count: number;
}

/**
 * The number of photos behind a card's cover, as a glyph and a digit.
 *
 * No word beside the number, so there is nothing to translate and nothing to
 * wrap; the image glyph says what is being counted.
 */
export const PhotoCountChip = ({ count }: PhotoCountChipProps): React.JSX.Element | null => {
  const colors = useTheme().colors;
  if (count < ValueConstants.two) return null;

  return (
    <View style={[styles.chip, { backgroundColor: colors.overlay }]}>
      <Ionicons name="image" size={iconSizes.xs} color={colors.onOverlay} />
      <ThemedText style={[styles.count, { color: colors.onOverlay }]}>{String(count)}</ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.round,
  },
  count: {
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
    fontVariant: ['tabular-nums'],
  },
});
