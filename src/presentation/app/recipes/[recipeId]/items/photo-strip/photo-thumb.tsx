import { Pressable, StyleSheet, View } from 'react-native';
import { RecipeImage } from '@presentation/base/widgets/media/recipe-image';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import {
  aspectRatios,
  borderWidths,
  fontSizes,
  fontWeights,
  letterSpacings,
  opacities,
  radii,
  spacing,
} from '@presentation/base/theme';
import { fillPhotoPosition } from '@presentation/app/recipes/[recipeId]/model/photos/fill-photo-position';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

/** The selection ring sits this far outside the thumb: a gap in the page colour, then the ring. */
const RING_OFFSET = borderWidths.medium * ValueConstants.two;

export interface PhotoThumbProps {
  url: string;
  index: number;
  total: number;
  selected: boolean;
  width: number;
  /** The owner's thumb 0 says it is the cover — the one the feed shows. */
  coverBand: boolean;
  onPress: () => void;
}

/** One photo in the strip under the hero; a tab that brings it into view. */
export const PhotoThumb = ({ url, index, total, selected, width, coverBand, onPress }: PhotoThumbProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={fillPhotoPosition(t().photoViewer.position, index, total)}
      onPress={onPress}
      style={[styles.cell, { width, opacity: selected ? opacities.full : opacities.onMedia }]}
    >
      {selected ? <View pointerEvents="none" style={[styles.ring, { borderColor: colors.primary }]} /> : null}
      <View
        style={[
          styles.thumb,
          { backgroundColor: colors.skeleton, borderColor: colors.cardBorder },
          selected ? styles.thumbSelected : null,
        ]}
      >
        <RecipeImage uri={url} style={styles.image} placeholderCompact />
        {coverBand ? (
          <View style={[styles.band, { backgroundColor: colors.overlay }]}>
            <ThemedText style={[styles.bandText, { color: colors.onOverlay }]}>{t().photoViewer.cover}</ThemedText>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cell: {
    aspectRatio: aspectRatios.hero,
  },
  ring: {
    position: 'absolute',
    top: -RING_OFFSET,
    left: -RING_OFFSET,
    right: -RING_OFFSET,
    bottom: -RING_OFFSET,
    borderWidth: borderWidths.medium,
    borderRadius: radii.md + RING_OFFSET,
  },
  thumb: {
    flex: ValueConstants.one,
    borderRadius: radii.md,
    borderWidth: borderWidths.hairline,
    overflow: 'hidden',
  },
  // The outer ring takes over; an inner hairline inside it would read as a third line.
  thumbSelected: {
    borderWidth: ValueConstants.zero,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  band: {
    position: 'absolute',
    left: ValueConstants.zero,
    right: ValueConstants.zero,
    bottom: ValueConstants.zero,
    paddingVertical: spacing.xxs,
    alignItems: 'center',
  },
  bandText: {
    fontSize: fontSizes.tiny,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.subtle,
  },
});
