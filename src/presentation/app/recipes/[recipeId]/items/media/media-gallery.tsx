import { useEffect, useRef, useState } from 'react';
import { isWeb } from '@infrastructure/constants/platform';
import {
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { MediaSlide } from '@presentation/app/recipes/[recipeId]/items/media/media-slide';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes, mediaSizes, aspectRatios, decorSizes, colorAlphas } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import type { MediaItem } from '@domain/recipes/media/media-item';
import { ValueConstants } from '@core/constants';

export interface MediaGalleryProps {
  media: readonly MediaItem[];
  /** Pins the gallery height; by default it follows the measured width's ratio. */
  height?: number;
}

/**
 * Horizontally paginated photo gallery with dot indicators and a centered counter.
 *
 * The slide width is measured from the gallery's own container (via onLayout) rather
 * than the window, so on web the photo fills the responsive column exactly instead of
 * being cropped by a window-wide slide. On web, where the FlatList cannot be swiped
 * with a mouse, prev/next arrows scroll to the adjacent slide.
 */
export const MediaGallery = ({ media, height }: MediaGalleryProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const [active, setActive] = useState(ValueConstants.zero);
  const [width, setWidth] = useState(() => Dimensions.get('window').width);
  const listRef = useRef<FlatList<MediaItem>>(null);

  // The hero follows the column it was given rather than a pinned height, so a
  // narrow phone, a landscape phone and a wide web column each get a photo in
  // proportion instead of the same 280pt strip. The cap stops a very wide
  // container from pushing the recipe itself below the fold.
  const aspect = isWeb() ? aspectRatios.heroWide : aspectRatios.hero;
  const cap = isWeb() ? mediaSizes.heroImageHeightWeb : mediaSizes.heroImageHeightMax;
  const resolvedHeight = height ?? Math.min(Math.round(width / aspect), cap);

  const onLayout = (e: LayoutChangeEvent): void => {
    const next = Math.round(e.nativeEvent.layout.width);
    if (next > ValueConstants.zero && next !== width) setWidth(next);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>): void => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / width);
    if (idx !== active && idx >= ValueConstants.zero && idx < media.length) {
      setActive(idx);
    }
  };

  const goTo = (idx: number): void => {
    if (idx < ValueConstants.zero || idx >= media.length) return;
    listRef.current?.scrollToIndex({ index: idx, animated: true });
    setActive(idx);
  };

  // Keep the active slide pinned when the measured width changes (e.g. web resize),
  // otherwise the FlatList would drift to a fractional offset between two photos.
  useEffect(() => {
    listRef.current?.scrollToIndex({ index: active, animated: false });
  }, [width, active]);

  const showArrows = isWeb() && media.length > 1;

  return (
    <View style={{ height: resolvedHeight }} onLayout={onLayout}>
      <FlatList
        ref={listRef}
        data={media as MediaItem[]}
        extraData={width}
        keyExtractor={(item) => item.url}
        renderItem={({ item }) => (
          <MediaSlide item={item} width={width} height={resolvedHeight} />
        )}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      />

      {showArrows && active > ValueConstants.zero ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t().recipes.previousPhoto}
          onPress={() => goTo(active - ValueConstants.one)}
          style={[styles.arrow, styles.arrowLeft, { backgroundColor: colors.overlay }]}
        >
          <Ionicons name="chevron-back" size={iconSizes.xl} color={colors.onOverlay} />
        </Pressable>
      ) : null}

      {showArrows && active < media.length - ValueConstants.one ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t().recipes.nextPhoto}
          onPress={() => goTo(active + ValueConstants.one)}
          style={[styles.arrow, styles.arrowRight, { backgroundColor: colors.overlay }]}
        >
          <Ionicons name="chevron-forward" size={iconSizes.xl} color={colors.onOverlay} />
        </Pressable>
      ) : null}

      {media.length > 1 ? (
        <>
          <View style={styles.dotsRow} pointerEvents="none">
            {media.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      i === active ? colors.onOverlay : colors.onOverlay + colorAlphas.medium,
                    width: i === active ? decorSizes.dotActiveWidth : controlSizes.progressBar,
                  },
                ]}
              />
            ))}
          </View>
          <View style={styles.counterWrap} pointerEvents="none">
            <View style={[styles.counter, { backgroundColor: colors.overlay }]}>
              <ThemedText
                variant="caption"
                style={[styles.counterText, { color: colors.onOverlay }]}
              >
                {active + ValueConstants.one} / {media.length}
              </ThemedText>
            </View>
          </View>
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  arrow: {
    position: 'absolute',
    top: '50%',
    width: controlSizes.floatingBtn,
    height: controlSizes.floatingBtn,
    marginTop: -controlSizes.floatingBtn / ValueConstants.two,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowLeft: {
    left: spacing.md,
  },
  arrowRight: {
    right: spacing.md,
  },
  dotsRow: {
    position: 'absolute',
    bottom: spacing.md,
    left: ValueConstants.zero,
    right: ValueConstants.zero,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dot: {
    height: controlSizes.progressBar,
    borderRadius: radii.round,
  },
  counterWrap: {
    position: 'absolute',
    top: spacing.md,
    left: ValueConstants.zero,
    right: ValueConstants.zero,
    alignItems: 'center',
  },
  counter: {
    paddingHorizontal: spacing.sm2,
    paddingVertical: spacing.xxs,
    borderRadius: radii.round,
  },
  counterText: {
    fontWeight: fontWeights.semibold,
    fontSize: fontSizes.small,
  },
});
