import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecipeImage } from '@presentation/base/widgets/media/recipe-image';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing, radii, iconSizes, mediaSizes, borderWidths, controlSizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';
import type { MediaItem } from '@domain/recipes/media/media-item';
import type { RecipeEntity } from '@domain/recipes/recipe-entity';
import type { GalleryOwnerControls } from '@presentation/app/recipes/[recipeId]/model/gallery-owner-controls';

export interface WebRecipeDetailHeroProps {
  recipe: RecipeEntity;
  media: readonly MediaItem[];
  activeImage: number;
  onSelectImage: (index: number) => void;
  /** The owner's controls, when the viewer is the owner. */
  photos?: GalleryOwnerControls;
}

/**
 * The recipe's picture on the web layout: the hero, the thumbnail strip, and
 * the owner's two controls.
 *
 * @remarks
 * - **Its own file because the page outgrew its guideline** when the owner's
 *   controls arrived, and the image area is the part that gained them.
 * - **The controls are the mobile gallery's, on a second surface.** Same icons,
 *   same overlay pill, same corners — `MediaGallery` has offered them since the
 *   feature shipped and this layout draws its own hero instead of using it, so
 *   the web owner had no way to add a photo at all.
 * - **Absent rather than disabled**, the same call the gallery makes: a control
 *   nobody may press is a question the screen answers by looking broken.
 */
export const WebRecipeDetailHero = ({
  recipe,
  media,
  activeImage,
  onSelectImage,
  photos,
}: WebRecipeDetailHeroProps): React.JSX.Element => {
  const colors = useTheme().colors;
  // Clamped for the same reason as the mobile gallery: removing the last
  // thumbnail while it is selected must not leave the selection past the end.
  const current = Math.min(activeImage, Math.max(media.length - ValueConstants.one, ValueConstants.zero));
  const activeItem = media[current];
  const activeUrl = activeItem?.url ?? recipe.image;

  return (
    <>
    <View style={[styles.hero, { borderColor: colors.cardBorder }]}>
      <RecipeImage
        uri={activeUrl}
        style={styles.heroImage}
        accessibilityLabel={recipe.name}
        placeholderLabel={t().recipes.noPhoto}
      />

      {/* The owner's two controls, which this layout never had: adding a
          photo and removing the one on screen live in `MediaGallery`,
          and the web detail draws its own hero instead of using it. The
          feature was finished on one surface and the other was never
          asked about. Same icons, same overlay pill, same corners as the
          mobile gallery — this is that control on a second screen, not a
          second design. */}
      {photos !== undefined ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t().recipes.addPhoto}
          disabled={photos.isBusy}
          onPress={photos.onAdd}
          style={[styles.ownerButton, styles.addButton, { backgroundColor: colors.overlay }]}
        >
          <Ionicons name="camera" size={iconSizes.lg} color={colors.onOverlay} />
        </Pressable>
      ) : null}

      {/* Any photo, the cover included — it has its own request. */}
      {photos !== undefined && activeItem !== undefined ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t().recipes.removePhoto}
          disabled={photos.isBusy}
          onPress={() => photos.onRemove(activeItem)}
          style={[styles.ownerButton, styles.removeButton, { backgroundColor: colors.overlay }]}
        >
          <Ionicons name="trash" size={iconSizes.md} color={colors.onOverlay} />
        </Pressable>
      ) : null}
    </View>

    {media.length > ValueConstants.one ? (
      <View style={styles.thumbStrip}>
        {media.map((item, i) => (
          <Pressable
            key={`${item.url}:${String(i)}`}
            onPress={() => onSelectImage(i)}
            accessibilityRole="button"
            accessibilityLabel={`${recipe.name} ${String(i + ValueConstants.one)}`}
            style={[
              styles.thumb,
              { borderColor: i === current ? colors.primary : colors.cardBorder },
              i === current ? styles.thumbActive : null,
            ]}
          >
            <RecipeImage uri={item.url} style={styles.thumbImage} placeholderCompact />
          </Pressable>
        ))}
      </View>
    ) : null}
    </>
  );
};

const HERO_ASPECT = 16 / 10;

const styles = StyleSheet.create({
  hero: {
    aspectRatio: HERO_ASPECT,
    borderRadius: radii.xl,
    borderWidth: borderWidths.hairline,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  thumb: {
    width: mediaSizes.webDetailThumbWidth,
    height: mediaSizes.webDetailThumbHeight,
    borderRadius: radii.md,
    borderWidth: borderWidths.hairline,
    overflow: 'hidden',
  },
  thumbActive: {
    borderWidth: borderWidths.medium,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  ownerButton: {
    position: 'absolute',
    width: controlSizes.iconBtnSm,
    height: controlSizes.iconBtnSm,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: { right: spacing.md, bottom: spacing.md },
  removeButton: { right: spacing.md, top: spacing.md },
});
