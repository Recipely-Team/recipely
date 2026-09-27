import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { PhotoThumb } from '@presentation/app/recipes/[recipeId]/items/photo-strip/photo-thumb';
import { PhotoAddTile } from '@presentation/app/recipes/[recipeId]/items/photo-strip/photo-add-tile';
import { PhotoViewerVariant, type PhotoViewerVariantType } from '@presentation/app/recipes/[recipeId]/model/photos/photo-viewer-variant';
import type { GalleryOwnerControls } from '@presentation/app/recipes/[recipeId]/model/gallery-owner-controls';
import { borderWidths, spacing } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';
import type { MediaItem } from '@domain/recipes/media/media-item';

/** Room for the selection ring, which draws outside its thumb. */
const RING_ROOM = borderWidths.medium * ValueConstants.two;

export interface PhotoThumbStripProps {
  media: readonly MediaItem[];
  current: number;
  thumbWidth: number;
  variant: PhotoViewerVariantType;
  onSelect: (index: number) => void;
  owner?: GalleryOwnerControls;
}

/**
 * The strip under the hero: every photo as a tab, and the owner's Add.
 *
 * The selected thumb is scrolled to the middle of the strip, so the photos on
 * either side of it are always the ones in view.
 */
export const PhotoThumbStrip = ({ media, current, thumbWidth, variant, onSelect, owner }: PhotoThumbStripProps): React.JSX.Element => {
  const scrollRef = useRef<ScrollView>(null);
  const [viewport, setViewport] = useState(ValueConstants.zero);

  useEffect(() => {
    if (viewport <= ValueConstants.zero) return;
    const centre = RING_ROOM + current * (thumbWidth + spacing.sm) - (viewport - thumbWidth) / ValueConstants.two;
    scrollRef.current?.scrollTo({ x: Math.max(centre, ValueConstants.zero), animated: true });
  }, [current, thumbWidth, viewport]);

  const onLayout = (event: LayoutChangeEvent): void => setViewport(event.nativeEvent.layout.width);

  return (
    <View style={[styles.row, variant === PhotoViewerVariant.Bleed ? styles.bleed : null]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onLayout={onLayout}
        style={styles.scroll}
        contentContainerStyle={styles.thumbs}
        accessibilityRole="tablist"
      >
        {media.map((item, index) => (
          <PhotoThumb
            key={`${item.url}:${String(index)}`}
            url={item.url}
            index={index}
            total={media.length}
            selected={index === current}
            width={thumbWidth}
            coverBand={owner !== undefined && index === ValueConstants.zero}
            onPress={() => onSelect(index)}
          />
        ))}
      </ScrollView>
      {owner !== undefined ? (
        <PhotoAddTile thumbWidth={thumbWidth} disabled={owner.isBusy} onPress={owner.onAdd} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  bleed: {
    paddingHorizontal: spacing.lg,
  },
  scroll: {
    flexGrow: ValueConstants.zero,
    flexShrink: ValueConstants.one,
  },
  thumbs: {
    gap: spacing.sm,
    padding: RING_ROOM,
  },
});
