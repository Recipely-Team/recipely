import { useState } from 'react';
import { isString } from '@core/guards/type-guards';
import { Image } from 'expo-image';
import type { ImageStyle, StyleProp } from 'react-native';
import { RecipePlaceholder } from '@presentation/base/widgets/media/recipe-placeholder';
import { ValueConstants } from '@core/constants';
import { durations } from '@presentation/base/theme';
import { toContentPosition } from '@presentation/base/widgets/media/to-content-position';
import type { FocalPoint } from '@domain/recipes/media/focal-point';

export interface RecipeImageProps {
  /** Remote recipe / media URI. Empty, missing, or failed shows the placeholder. */
  uri: string | undefined | null;
  style?: StyleProp<ImageStyle>;
  /**
   * What a screen reader says for this photo — the dish's name — or `null` for
   * a photo that only decorates something already labelled (a card whose button
   * names the recipe). Required, so no photo ships without that decision.
   */
  accessibilityLabel: string | null;
  /** Caption under the placeholder motif when there is no photo. */
  placeholderLabel?: string;
  /** Compact placeholder motif (no caption) for dense thumbnails. */
  placeholderCompact?: boolean;
  /** Where the dish sits in the photo; the crop centres on it. Absent crops centred. */
  focus?: FocalPoint | undefined;
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
 * - **The crop sits on the photo's focal point** when the backend has found
 *   one, so a card shows the dish rather than the hands or pot around it.
 * - **Every photo is described or deliberately silent.** A blind user heard
 *   "image" on card after card, or nothing at all. A label makes the photo an
 *   `image` the screen reader names; `null` hides it, so a card is read once.
 * - **`transition` is deliberately short.** It hides the decode step; long
 *   enough to read as a fade, short enough not to feel like a delay.
 */
export const RecipeImage = ({
  uri,
  style,
  accessibilityLabel,
  placeholderLabel,
  placeholderCompact,
  focus,
}: RecipeImageProps): React.JSX.Element => {
  // Rows are recycled, so a failure belongs to the uri that failed, not to the row.
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const failed = failedUri !== null && failedUri === uri;

  const hasImage = isString(uri) && uri.trim().length > ValueConstants.zero;

  if (!hasImage || failed) {
    return <RecipePlaceholder label={placeholderLabel} compact={placeholderCompact} />;
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      {...(accessibilityLabel === null
        ? { accessible: false, accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const }
        : { accessible: true, accessibilityRole: 'image' as const, accessibilityLabel })}
      contentFit="cover"
      contentPosition={toContentPosition(focus)}
      cachePolicy="memory-disk"
      transition={durations.imageFade}
      recyclingKey={uri}
      onError={() => setFailedUri(uri)}
    />
  );
};
