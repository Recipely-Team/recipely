import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecipePlaceholder } from '@presentation/base/widgets/media/recipe-placeholder';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { controlSizes, fontSizes, fontWeights, iconSizes, radii, spacing } from '@presentation/base/theme';
import { PhotoViewerVariant, type PhotoViewerVariantType } from '@presentation/app/recipes/[recipeId]/model/photos/photo-viewer-variant';
import { photoViewerSizes } from '@presentation/app/recipes/[recipeId]/model/photos/photo-viewer-sizes';
import { t } from '@presentation/i18n';

export interface PhotoEmptyHeroProps {
  variant: PhotoViewerVariantType;
  /** Present for the owner: the hero offers the first photo instead of saying there is none. */
  onAddFirst?: () => void;
  disabled: boolean;
  /** What the screen draws over the frame's bottom edge, which the button stays above. */
  overlap: number;
}

/**
 * The hero of a recipe with no photo: the brand plate, and for the owner the
 * one thing worth doing about it.
 *
 * A visitor gets a caption and no button — there is nothing they can do, and
 * the owner gets no caption because the button says the same thing better.
 */
export const PhotoEmptyHero = ({ variant, onAddFirst, disabled, overlap }: PhotoEmptyHeroProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const framed = variant === PhotoViewerVariant.Framed;
  const label = framed ? t().photoViewer.noPhotoShort : t().recipes.noPhoto;
  const offset = framed ? photoViewerSizes.addFirstOffsetFramed : photoViewerSizes.addFirstOffset;

  return (
    <View style={StyleSheet.absoluteFill}>
      <RecipePlaceholder
        {...(onAddFirst === undefined ? { label } : {})}
        logoSize={framed ? photoViewerSizes.emptyLogoFramed : photoViewerSizes.emptyLogo}
      />
      {onAddFirst !== undefined ? (
        <View style={[styles.anchor, { bottom: offset + overlap }]} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t().photoViewer.addFirst}
            disabled={disabled}
            onPress={onAddFirst}
            style={[styles.button, shadows.md, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="camera" size={iconSizes.lg} color={colors.primaryText} />
            <ThemedText style={[styles.label, { color: colors.primaryText }]}>{t().photoViewer.addFirst}</ThemedText>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
  },
  button: {
    minHeight: controlSizes.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.round,
  },
  label: {
    fontSize: fontSizes.medium,
    fontWeight: fontWeights.bold,
  },
});
