import { useEffect, useState } from 'react';
import { isString } from '@core/guards/type-guards';
import { Image, type ImageStyle, type StyleProp } from 'react-native';
import { RecipePlaceholder } from '@presentation/base/widgets/media/recipe-placeholder';
import { ValueConstants } from '@core/constants';

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
      onError={() => setFailed(true)}
    />
  );
};
