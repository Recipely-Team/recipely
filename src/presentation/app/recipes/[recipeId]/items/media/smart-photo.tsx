import { useEffect, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Image, type ImageLoadEventData } from 'expo-image';
import { RecipePlaceholder } from '@presentation/base/widgets/media/recipe-placeholder';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { durations, opacities } from '@presentation/base/theme';
import { isPortraitPhoto } from '@presentation/app/recipes/[recipeId]/model/photos/is-portrait-photo';
import { photoViewerSizes } from '@presentation/app/recipes/[recipeId]/model/photos/photo-viewer-sizes';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface SmartPhotoProps {
  url: string;
  accessibilityLabel: string;
}

/**
 * One photo in the hero: cropped when it fits the frame, shown whole over a
 * blurred copy of itself when it is portrait.
 *
 * @remarks
 * - **Why not always crop.** A phone shot of a dish is portrait; cropped to a
 *   4:3 frame it became a sliver of hands and pots. The portrait rule is
 *   {@link isPortraitPhoto}, fed the photo's decoded size and the frame's
 *   measured one — re-measured on rotation and window resize.
 * - **The blurred copy is decoration.** It overhangs the frame so its soft
 *   edge never shows, and is hidden from assistive tech; only the sharp photo
 *   carries the label.
 * - **Centred.** The prototype positions a crop at a focal point the data does
 *   not have, so every crop is centred — the spec's own fallback.
 */
export const SmartPhoto = ({ url, accessibilityLabel }: SmartPhotoProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const [frameRatio, setFrameRatio] = useState<number | null>(null);
  const [photoRatio, setPhotoRatio] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  const portrait = isPortraitPhoto(photoRatio, frameRatio);

  useEffect(() => {
    setFailed(false);
    setPhotoRatio(null);
  }, [url]);

  const onLayout = (event: LayoutChangeEvent): void => {
    const { width, height } = event.nativeEvent.layout;
    if (height > ValueConstants.zero) setFrameRatio(width / height);
  };

  const onLoad = (event: ImageLoadEventData): void => {
    const { width, height } = event.source;
    if (height > ValueConstants.zero) setPhotoRatio(width / height);
  };

  return (
    <View style={[styles.frame, { backgroundColor: colors.skeleton }]} onLayout={onLayout}>
      {failed ? (
        <RecipePlaceholder label={t().recipes.noPhoto} />
      ) : (
        <>
          {portrait ? (
            <Image
              source={{ uri: url }}
              contentFit="cover"
              blurRadius={photoViewerSizes.blurRadius}
              cachePolicy="memory-disk"
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={styles.blurred}
            />
          ) : null}
          <Image
            source={{ uri: url }}
            contentFit={portrait ? 'contain' : 'cover'}
            contentPosition="center"
            cachePolicy="memory-disk"
            recyclingKey={url}
            transition={durations.imageFade}
            accessibilityLabel={accessibilityLabel}
            onLoad={onLoad}
            onError={() => setFailed(true)}
            style={StyleSheet.absoluteFill}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    position: 'absolute',
    top: ValueConstants.zero,
    left: ValueConstants.zero,
    right: ValueConstants.zero,
    bottom: ValueConstants.zero,
    overflow: 'hidden',
  },
  blurred: {
    position: 'absolute',
    top: -photoViewerSizes.blurBleed,
    left: -photoViewerSizes.blurBleed,
    right: -photoViewerSizes.blurBleed,
    bottom: -photoViewerSizes.blurBleed,
    // Stands in for the prototype's brightness(0.92); RN has no filter for it.
    opacity: opacities.onMediaFaint,
  },
});
