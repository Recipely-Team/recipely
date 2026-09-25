import { useEffect, useRef, useState } from 'react';
import { scrollThrottleMs } from '@presentation/base/constants';
import { isWeb } from '@infrastructure/constants/platform';
import { Dimensions, FlatList, Pressable, StyleSheet, View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { MediaSlide } from '@presentation/app/recipes/[recipeId]/items/media/media-slide';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, fontSizes, fontWeights, iconSizes, controlSizes, mediaSizes, aspectRatios, decorSizes, colorAlphas } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import type { MediaItem } from '@domain/recipes/media/media-item';
import { ValueConstants } from '@core/constants';
import type { GalleryOwnerControls } from '@presentation/app/recipes/[recipeId]/model/gallery-owner-controls';

export interface MediaGalleryProps {
  media: readonly MediaItem[];
  /** Pins the gallery height; by default it follows the measured width's ratio. */
  height?: number;
  /**
   * How much of the gallery's bottom edge the screen draws something else over.
   *
   * The mobile layout pulls its content card up across the hero, and that card
   * is a later sibling — it paints and hit-tests above this. The owner controls
   * sit above whatever it covers; everything else may stay under it, because
   * nothing else down there is pressable.
   */
  contentOverlap?: number;
  /**
   * Present only for the owner.
   *
   * Absent rather than disabled: a control nobody may press is a question the
   * screen answers by looking broken. The server refuses either way — this is
   * about not offering something that cannot happen.
   */
  owner?: GalleryOwnerControls;
}

/**
 * Horizontally paginated photo gallery with dot indicators and a centered counter.
 *
 * The slide width is measured from the gallery's own container (via onLayout) rather
 * than the window, so on web the photo fills the responsive column exactly instead of
 * being cropped by a window-wide slide. On web, where the FlatList cannot be swiped
 * with a mouse, prev/next arrows scroll to the adjacent slide.
 */
export const MediaGallery = ({
  media,
  height,
  owner,
  contentOverlap = ValueConstants.zero,
}: MediaGalleryProps): React.JSX.Element => {
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

  // Clamped: removing the last slide while it is in view leaves `active` one
  // past the end until the next scroll event, which never comes.
  const current = Math.min(active, Math.max(media.length - ValueConstants.one, ValueConstants.zero));
  const activeItem = media[current];

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
    if (media.length === ValueConstants.zero) return;
    listRef.current?.scrollToIndex({ index: current, animated: false });
  }, [width, current, media.length]);

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
        scrollEventThrottle={scrollThrottleMs.perFrame}
      />

      {/* Both owner controls in one cluster, lifted clear of the content card.
          Apart, each landed somewhere the user could not reach it: `add` under
          that card, and `remove` in the top-right corner, which on a phone is
          both behind the status bar and already occupied by the share / like /
          save cluster. Together they are also what they are — a pair, offered
          to one person. */}
      {owner !== undefined ? (
        <View style={[styles.ownerControls, { bottom: contentOverlap + spacing.md }]}>
          {/* Any slide, the cover included: the cover has its own request. */}
          {activeItem !== undefined ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t().recipes.removePhoto}
              disabled={owner.isBusy}
              onPress={() => owner.onRemove(activeItem)}
              style={[styles.ownerButton, { backgroundColor: colors.overlay }]}
            >
              <Ionicons name="trash-outline" size={iconSizes.lg} color={colors.onOverlay} />
            </Pressable>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t().recipes.addPhoto}
            disabled={owner.isBusy}
            onPress={owner.onAdd}
            style={[styles.ownerButton, { backgroundColor: colors.overlay }]}
          >
            <Ionicons name="camera" size={iconSizes.lg} color={colors.onOverlay} />
          </Pressable>
        </View>
      ) : null}

      {showArrows && current > ValueConstants.zero ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t().recipes.previousPhoto}
          onPress={() => goTo(current - ValueConstants.one)}
          style={[styles.arrow, styles.arrowLeft, { backgroundColor: colors.overlay }]}
        >
          <Ionicons name="chevron-back" size={iconSizes.xl} color={colors.onOverlay} />
        </Pressable>
      ) : null}

      {showArrows && current < media.length - ValueConstants.one ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t().recipes.nextPhoto}
          onPress={() => goTo(current + ValueConstants.one)}
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
                      i === current ? colors.onOverlay : colors.onOverlay + colorAlphas.medium,
                    width: i === current ? decorSizes.dotActiveWidth : controlSizes.progressBar,
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
                {current + ValueConstants.one} / {media.length}
              </ThemedText>
            </View>
          </View>
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  // `bottom` is set inline: it follows whatever the screen draws over the hero.
  ownerControls: {
    position: 'absolute',
    right: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  // Pinned: circles, not text boxes.
  ownerButton: {
    width: controlSizes.iconBtnSm,
    height: controlSizes.iconBtnSm,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
