import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { fontSizes, fontWeights, iconSizes, radii, spacing } from '@presentation/base/theme';
import { fillPhotoPosition } from '@presentation/app/recipes/[recipeId]/model/photos/fill-photo-position';
import { t } from '@presentation/i18n';

export interface PhotoCounterChipProps {
  current: number;
  total: number;
  /** Lifted clear of whatever the screen draws over the frame's bottom edge. */
  bottom: number;
}

/**
 * "2 / 5" on the hero's bottom-left, announced as it changes.
 *
 * The position is said here and in the strip, never in dots: the prototype
 * has none, and a row of twelve dots is a count nobody can read.
 */
export const PhotoCounterChip = ({ current, total, bottom }: PhotoCounterChipProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View
      style={[styles.chip, { bottom, backgroundColor: colors.overlay }]}
      accessibilityLiveRegion="polite"
      accessibilityLabel={fillPhotoPosition(t().photoViewer.position, current, total)}
    >
      <Ionicons name="image" size={iconSizes.xs} color={colors.onOverlay} />
      <ThemedText style={[styles.text, { color: colors.onOverlay }]}>
        {fillPhotoPosition(t().photoViewer.counter, current, total)}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    position: 'absolute',
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs2,
    paddingHorizontal: spacing.sm2,
    paddingVertical: spacing.xs2,
    borderRadius: radii.round,
  },
  text: {
    fontSize: fontSizes.small,
    fontWeight: fontWeights.bold,
    fontVariant: ['tabular-nums'],
  },
});
