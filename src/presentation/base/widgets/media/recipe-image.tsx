import { useEffect, useState } from 'react';
import { isString } from '@core/guards/type-guards';
import { Image } from 'expo-image';
import type { ImageStyle, StyleProp } from 'react-native';
import { RecipePlaceholder } from '@presentation/base/widgets/media/recipe-placeholder';
import { ValueConstants } from '@core/constants';
import { durations } from '@presentation/base/theme';

export interface RecipeImageProps {
  /** Remote recipe / media URI. Empty, missing, or failed shows the placeholder. */
  uri: string | undefined | null;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
  /** Caption under the placeholder motif when there is no photo. */
  placeholderLabel?: string;
  /** Compact placeholder motif (no caption) for dense thumbnails. */
  placeholderCompact?: boolean;
}

/**
 * Recipe image that degrades to the brand `RecipePlaceholder` both when the URI
 * is missing and when the remote file fails to load (e.g. a deleted upload that
 * now 404s). Without the `onError` fallback those rows render a broken-image box.
 * Fills its parent, so the placeholder lines up with the image it replaces.
 *
 * @remarks
 * - **`expo-image`, not React Native's `Image`.** RN's has no disk cache, so
 *   every scroll back up and every navigation re-fetched and re-decoded photos
 *   that had not changed — the single most expensive thing the feed did, on a
 *   screen that is mostly photos. `memory-disk` keeps them across screens and
 *   across app launches.
 * - **`recyclingKey` is what makes reuse safe.** A FlatList row is recycled for
 *   a different recipe, and without it the previous photo stays on screen until
 *   the new one decodes — the wrong recipe under the right title.
 * - **`transition` is deliberately short.** It hides the decode step; long
 *   enough to read as a fade, short enough not to feel like a delay.
 */
export const RecipeImage = ({
  uri,
  style,
  accessibilityLabel,
  placeholderLabel,
  placeholderCompact,
}: RecipeImageProps): React.JSX.Element => {
  const [failed, setFailed] = useState(false);

  // A row can be recycled for a different recipe, so clear the failed flag
  // whenever the URI changes — otherwise a once-broken image stays a placeholder.
  useEffect(() => {
    setFailed(false);
  }, [uri]);

  const hasImage = isString(uri) && uri.trim().length > ValueConstants.zero;

  if (!hasImage || failed) {
    return <RecipePlaceholder label={placeholderLabel} compact={placeholderCompact} />;
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      accessibilityLabel={accessibilityLabel}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={durations.imageFade}
      recyclingKey={uri}
      onError={() => setFailed(true)}
    />
  );
};
