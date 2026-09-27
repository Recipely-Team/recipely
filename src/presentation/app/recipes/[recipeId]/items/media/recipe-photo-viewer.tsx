import { useCallback, useState } from 'react';
import { Dimensions, StyleSheet, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { PhotoPager } from '@presentation/app/recipes/[recipeId]/items/media/photo-pager';
import { PhotoArrows } from '@presentation/app/recipes/[recipeId]/items/media/photo-arrows';
import { PhotoCounterChip } from '@presentation/app/recipes/[recipeId]/items/media/photo-counter-chip';
import { PhotoRemoveButton } from '@presentation/app/recipes/[recipeId]/items/media/photo-remove-button';
import { PhotoEmptyHero } from '@presentation/app/recipes/[recipeId]/items/media/photo-empty-hero';
import { HeroTopScrim } from '@presentation/app/recipes/[recipeId]/items/media/hero-top-scrim';
import { PhotoThumbStrip } from '@presentation/app/recipes/[recipeId]/items/photo-strip/photo-thumb-strip';
import { usePhotoViewer } from '@presentation/app/recipes/[recipeId]/hooks/photos/use-photo-viewer';
import { usePhotoArrowKeys } from '@presentation/app/recipes/[recipeId]/hooks/photos/use-photo-arrow-keys';
import { heroFrameHeight } from '@presentation/app/recipes/[recipeId]/model/photos/hero-frame-height';
import { showsPhotoStrip } from '@presentation/app/recipes/[recipeId]/model/photos/shows-photo-strip';
import { photoViewerSizes } from '@presentation/app/recipes/[recipeId]/model/photos/photo-viewer-sizes';
import { PhotoViewerVariant, type PhotoViewerVariantType } from '@presentation/app/recipes/[recipeId]/model/photos/photo-viewer-variant';
import type { GalleryOwnerControls } from '@presentation/app/recipes/[recipeId]/model/gallery-owner-controls';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, radii, spacing } from '@presentation/base/theme';
import { isWeb } from '@infrastructure/constants/platform';
import { ValueConstants } from '@core/constants';
import type { MediaItem } from '@domain/recipes/media/media-item';

export interface RecipePhotoViewerProps {
  media: readonly MediaItem[];
  variant: PhotoViewerVariantType;
  /** Present only for the owner — absent rather than disabled, so nobody else is offered what cannot happen. */
  owner?: GalleryOwnerControls;
  /**
   * How much of the frame's bottom edge the screen draws something else over.
   * The phone pulls its content card up across a hero with no strip under it,
   * and that card is a later sibling: it paints AND hit-tests above the frame.
   */
  contentOverlap?: number;
}

/**
 * The recipe's photos: a 4:3 hero you swipe, step or key through, a counter,
 * the strip of thumbnails under it, and the owner's Add and Remove.
 *
 * @remarks
 * - **One viewer, two shapes.** The phone layout bleeds it edge to edge under
 *   a top scrim; the wide layout frames it in its column. The owner's controls
 *   are the same on both — the web detail once drew its own hero and simply
 *   never offered them.
 * - **Arrows are for pointers and big frames.** Framed always has them, fading
 *   in on hover or focus under a mouse; the phone shows them only on a frame
 *   wide enough to be a tablet, where a thumb does not reach across.
 * - **The frame takes focus only with something to step through**, and ← / →
 *   then move one photo.
 */
export const RecipePhotoViewer = ({
  media,
  variant,
  owner,
  contentOverlap = ValueConstants.zero,
}: RecipePhotoViewerProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const viewport = useWindowDimensions();
  const [width, setWidth] = useState(() => Dimensions.get('window').width);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const total = media.length;
  const { current, goTo } = usePhotoViewer(total);
  const step = useCallback((delta: number): void => goTo(current + delta), [goTo, current]);
  usePhotoArrowKeys(focused && total > ValueConstants.one, step);

  const framed = variant === PhotoViewerVariant.Framed;
  const wide = width >= photoViewerSizes.wideFrame;
  const height = heroFrameHeight(width, variant, viewport.height);
  // The framed border is inside the measured box; a page that ignored it would overhang by a hairline.
  const inset = framed ? borderWidths.hairline * ValueConstants.two : ValueConstants.zero;
  const bottom = spacing.md + contentOverlap;
  const activeItem = media[current];
  const hoverProps = isWeb()
    ? { onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) }
    : {};

  const onLayout = (event: LayoutChangeEvent): void => {
    const next = Math.round(event.nativeEvent.layout.width);
    if (next > ValueConstants.zero && next !== width) setWidth(next);
  };

  return (
    <View>
      <View
        {...hoverProps}
        onLayout={onLayout}
        focusable={total > ValueConstants.one}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.frame,
          { height, backgroundColor: colors.skeleton },
          framed ? [styles.framed, { borderColor: colors.cardBorder }] : null,
          focused ? [styles.focusRing, { outlineColor: colors.primary }] : null,
        ]}
      >
        {total === ValueConstants.zero ? (
          <PhotoEmptyHero
            variant={variant}
            {...(owner !== undefined ? { onAddFirst: owner.onAdd } : {})}
            disabled={owner?.isBusy ?? false}
            overlap={contentOverlap}
          />
        ) : (
          <PhotoPager media={media} width={width - inset} height={height - inset} current={current} onSwipe={goTo} />
        )}
        {framed ? null : <HeroTopScrim />}
        {total > ValueConstants.one && (framed || wide) ? (
          <PhotoArrows current={current} total={total} revealed={!isWeb() || hovered || focused} onStep={step} />
        ) : null}
        {total > ValueConstants.one ? <PhotoCounterChip current={current} total={total} bottom={bottom} /> : null}
        {owner !== undefined && activeItem !== undefined ? (
          <PhotoRemoveButton disabled={owner.isBusy} bottom={bottom} onPress={() => owner.onRemove(activeItem)} />
        ) : null}
      </View>

      {showsPhotoStrip(total, owner !== undefined) ? (
        <PhotoThumbStrip
          media={media}
          current={current}
          thumbWidth={wide ? photoViewerSizes.thumbWidthWide : photoViewerSizes.thumbWidth}
          variant={variant}
          onSelect={goTo}
          {...(owner !== undefined ? { owner } : {})}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
  },
  framed: {
    borderRadius: radii.xxl,
    borderWidth: borderWidths.hairline,
  },
  focusRing: {
    outlineStyle: 'solid',
    outlineWidth: borderWidths.thick,
    outlineOffset: borderWidths.medium,
  },
});
