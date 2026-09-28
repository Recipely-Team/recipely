import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandColors } from '@presentation/base/theme/colors/palette/brand-colors';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { borderWidths, controlSizes, iconSizes, radii } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface CardPhotoButtonProps {
  onPress: () => void;
}

/**
 * The camera on a Created card's cover: the way to the recipe's photos.
 *
 * White with a hairline so it holds on any picture, and a full touch target —
 * it sits in the corner the likes chip takes on the feed.
 */
export const CardPhotoButton = ({ onPress }: CardPhotoButtonProps): React.JSX.Element => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={t().photoViewer.editPhotos}
    onPress={onPress}
    style={[styles.button, shadows.md]}
  >
    <Ionicons name="camera" size={iconSizes.lg} color={BrandColors.photoControlInk} />
  </Pressable>
);

const styles = StyleSheet.create({
  // Pinned: a circle, not a text box.
  button: {
    width: controlSizes.touchTarget,
    height: controlSizes.touchTarget,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.white,
    borderWidth: borderWidths.hairline,
    borderColor: BrandColors.photoControlBorder,
  },
});
