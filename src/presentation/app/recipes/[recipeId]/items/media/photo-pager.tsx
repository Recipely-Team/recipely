import { useEffect, useRef } from 'react';
import { FlatList, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { scrollThrottleMs } from '@presentation/base/constants';
import { SmartPhoto } from '@presentation/app/recipes/[recipeId]/items/media/smart-photo';
import { fillPhotoPosition } from '@presentation/app/recipes/[recipeId]/model/photos/fill-photo-position';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';
import type { MediaItem } from '@domain/recipes/media/media-item';
import { photoKey } from '@presentation/app/recipes/[recipeId]/model/photos/photo-key';

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
 * - **Its own scroll reports nothing.** An animated jump from 0 to 4 fires
 *   `onScroll` through 1, 2 and 3, and reporting those flickered the counter.
 *   While a programmatic scroll is in flight (`target`) scroll events are
 *   ignored until the row lands on it; a drag cancels it, so a finger always
 *   wins. `onMomentumScrollEnd` alone would not do: react-native-web never
 *   fires it, and the web pager would stop reporting swipes.
 * - **Keys are the photo's id, else its url** — never the index, which would
 *   remount every later photo when an earlier one is removed.
 */
export const PhotoPager = ({ media, width, height, current, onSwipe }: PhotoPagerProps): React.JSX.Element => {
  const listRef = useRef<FlatList<MediaItem>>(null);
  const swiped = useRef(false);
  const shown = useRef<number>(ValueConstants.zero);
  const target = useRef<number | null>(null);
  const total = media.length;

  useEffect(() => {
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    if (current !== shown.current) target.current = current;
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
    shown.current = index;
    if (target.current !== null) {
      if (index === target.current) target.current = null;
      return;
    }
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
      keyExtractor={photoKey}
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
      onScrollBeginDrag={() => {
        target.current = null;
      }}
      scrollEventThrottle={scrollThrottleMs.perFrame}
    />
  );
};
