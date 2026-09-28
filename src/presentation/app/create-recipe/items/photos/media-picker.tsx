import { useCallback, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { lineHeightFor, lineHeights, fontSizes, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';
import type { MediaItem } from '@domain/recipes/media/media-item';
import { useMediaPick } from '@presentation/app/create-recipe/hooks/use-media-pick';
import { photoGridLayout } from '@presentation/app/create-recipe/model/photos/photo-grid-layout';
import { PhotoGridTile } from '@presentation/app/create-recipe/items/photos/photo-grid-tile';
import { PhotoGridAddTile } from '@presentation/app/create-recipe/items/photos/photo-grid-add-tile';
import { PhotoDropZone } from '@presentation/app/create-recipe/items/photos/photo-drop-zone';

export interface MediaPickerProps {
  media: readonly MediaItem[];
  onAdd: (items: MediaItem[]) => void;
  onRemove: (index: number) => void;
  onSetCover: (index: number) => void;
}

/**
 * The editor's photo grid: the cover as a 2×2 tile, the rest flowing into the
 * cells beside and below it, and an Add tile last.
 *
 * @remarks
 * - **Columns follow the grid's measured width** — three on a phone sheet,
 *   up to five in the web dialog — see `photoGridLayout`.
 * - **Nothing renders until the width is known.** Tiles are sized from it, so
 *   a first frame at width zero would draw every tile on top of the next.
 */
export const MediaPicker = ({ media, onAdd, onRemove, onSetCover }: MediaPickerProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const [width, setWidth] = useState(ValueConstants.zero);
  const [skipped, setSkipped] = useState(ValueConstants.zero);
  const onSkip = useCallback((count: number) => setSkipped(count), []);
  const addPhotos = useMediaPick(onAdd, onSkip);

  const onLayout = (event: LayoutChangeEvent): void => setWidth(event.nativeEvent.layout.width);
  const layout = photoGridLayout(width, media.length);
  const addCell = layout.cells[layout.cells.length - ValueConstants.one];

  return (
    <View style={styles.root}>
      {media.length === ValueConstants.zero ? (
        <PhotoDropZone onPress={() => void addPhotos()} />
      ) : (
        <View onLayout={onLayout} style={{ height: width > ValueConstants.zero ? layout.height : ValueConstants.zero }}>
          {width > ValueConstants.zero ? (
            <>
              {media.map((item, i) => {
                const cell = i === ValueConstants.zero ? { x: ValueConstants.zero, y: ValueConstants.zero } : layout.cells[i - ValueConstants.one];
                return (
                  <PhotoGridTile
                    key={`${item.url}:${String(i)}`}
                    url={item.url}
                    focus={item.focus}
                    isCover={i === ValueConstants.zero}
                    size={i === ValueConstants.zero ? layout.cover : layout.tile}
                    x={cell?.x ?? ValueConstants.zero}
                    y={cell?.y ?? ValueConstants.zero}
                    onRemove={() => onRemove(i)}
                    onSetCover={() => onSetCover(i)}
                  />
                );
              })}
              {addCell !== undefined ? (
                <PhotoGridAddTile size={layout.tile} x={addCell.x} y={addCell.y} onPress={() => void addPhotos()} />
              ) : null}
            </>
          ) : null}
        </View>
      )}
      {skipped > ValueConstants.zero ? (
        <ThemedText variant="caption" style={[styles.error, { color: colors.danger }]}>
          {t().mediaPicker.rejected}
        </ThemedText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  error: {
    fontSize: fontSizes.caption,
    lineHeight: lineHeightFor(fontSizes.caption, lineHeights.normal),
  },
});
