import { useEffect, useRef } from 'react';
import { FlatList, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { scrollThrottleMs } from '@presentation/base/constants';
import { SmartPhoto } from '@presentation/app/recipes/[recipeId]/items/media/smart-photo';
import { fillPhotoPosition } from '@presentation/app/recipes/[recipeId]/model/photos/fill-photo-position';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';
import type { MediaItem } from '@domain/recipes/media/media-item';

/** Photos drawn before the pager is scrolled; the rest load as they come near. */
const EAGER_PHOTOS = 2;

export interface PhotoPagerProps {
  media: readonly MediaItem[];
  width: number;
  height: number;
  current: number;
  onSwipe: (index: number) => void;
}

/**
 * The swipeable row of photos: one per page, snapping.
 *
 * @remarks
 * - **A swipe reports, it is not steered.** When the index changed because
 *   the user dragged, the pager does not scroll itself to it — an animated
 *   scroll fired mid-drag fought the finger. Arrows, thumbs and keys move it.
 * - **A resize re-pins without animating**, so a web window drag never leaves
 *   the row resting between two photos.
 */
export const PhotoPager = ({ media, width, height, current, onSwipe }: PhotoPagerProps): React.JSX.Element => {
  const listRef = useRef<FlatList<MediaItem>>(null);
  const swiped = useRef(false);
  const total = media.length;

  useEffect(() => {
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    listRef.current?.scrollToOffset({ offset: current * width, animated: true });
  }, [current, width]);

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: current * width, animated: false });
    // Only a width change re-pins; `current` is followed by the effect above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
    if (width <= ValueConstants.zero) return;
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    if (index !== current && index >= ValueConstants.zero && index < total) {
      swiped.current = true;
      onSwipe(index);
    }
  };

  return (
    <FlatList
      ref={listRef}
      data={media as MediaItem[]}
      extraData={width}
      keyExtractor={(item, index) => `${item.url}:${String(index)}`}
      renderItem={({ item, index }) => (
        <View
          style={{ width, height }}
          accessible
          accessibilityLabel={fillPhotoPosition(t().photoViewer.position, index, total)}
        >
          <SmartPhoto url={item.url} focus={item.focus} accessibilityLabel={fillPhotoPosition(t().photoViewer.position, index, total)} />
        </View>
      )}
      getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      horizontal
      pagingEnabled
      scrollEnabled={total > ValueConstants.one}
      initialNumToRender={EAGER_PHOTOS}
      maxToRenderPerBatch={EAGER_PHOTOS}
      windowSize={EAGER_PHOTOS + ValueConstants.one}
      showsHorizontalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={scrollThrottleMs.perFrame}
    />
  );
};
