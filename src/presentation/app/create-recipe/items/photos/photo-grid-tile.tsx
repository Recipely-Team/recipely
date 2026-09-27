import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecipeImage } from '@presentation/base/widgets/media/recipe-image';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, controlSizes, fontSizes, fontWeights, iconSizes, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface PhotoGridTileProps {
  url: string;
  isCover: boolean;
  size: number;
  x: number;
  y: number;
  onRemove: () => void;
  onSetCover: () => void;
}

/**
 * One photo in the editor's grid.
 *
 * Remove takes it off at once — nothing is published yet, so there is nothing
 * to confirm. Every photo but the cover offers to become the cover, which
 * moves it to the front and makes it the 2×2 tile.
 */
export const PhotoGridTile = ({ url, isCover, size, x, y, onRemove, onSetCover }: PhotoGridTileProps): React.JSX.Element => {
  const colors = useTheme().colors;

  return (
    <View style={[styles.cell, { width: size, height: size, left: x, top: y }]}>
      {isCover ? <View pointerEvents="none" style={[styles.coverRing, { borderColor: colors.primary }]} /> : null}
      <View style={[styles.tile, { backgroundColor: colors.skeleton, borderColor: colors.cardBorder }, isCover ? styles.tileCover : null]}>
        <RecipeImage uri={url} style={styles.image} placeholderCompact />
        {isCover ? (
          <View style={[styles.coverLabel, { backgroundColor: colors.primary }]}>
            <ThemedText style={[styles.coverText, { color: colors.primaryText }]}>{t().mediaPicker.cover}</ThemedText>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t().mediaPicker.setCover}
            onPress={onSetCover}
            style={[styles.setCover, { backgroundColor: colors.overlay }]}
          >
            <ThemedText numberOfLines={ValueConstants.one} style={[styles.setCoverText, { color: colors.onOverlay }]}>
              {t().mediaPicker.setCover}
            </ThemedText>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t().mediaPicker.remove}
          onPress={onRemove}
          style={[styles.remove, { backgroundColor: colors.overlay }]}
        >
          <Ionicons name="close" size={iconSizes.md} color={colors.onOverlay} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cell: {
    position: 'absolute',
  },
  coverRing: {
    position: 'absolute',
    top: -borderWidths.medium,
    left: -borderWidths.medium,
    right: -borderWidths.medium,
    bottom: -borderWidths.medium,
    borderWidth: borderWidths.medium,
    borderRadius: radii.md + borderWidths.medium,
  },
  tile: {
    flex: ValueConstants.one,
    borderRadius: radii.md,
    borderWidth: borderWidths.hairline,
    overflow: 'hidden',
  },
  tileCover: {
    borderWidth: ValueConstants.zero,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  coverLabel: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    paddingHorizontal: spacing.sm2,
    paddingVertical: spacing.xs,
    borderRadius: radii.round,
  },
  coverText: {
    fontSize: fontSizes.small,
    fontWeight: fontWeights.bold,
  },
  setCover: {
    position: 'absolute',
    left: spacing.xs2,
    right: spacing.xs2,
    bottom: spacing.xs2,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.round,
  },
  setCoverText: {
    fontSize: fontSizes.micro,
    fontWeight: fontWeights.bold,
  },
  // Pinned: a circle, not a text box.
  remove: {
    position: 'absolute',
    top: spacing.xs2,
    right: spacing.xs2,
    width: controlSizes.iconBtnSm,
    height: controlSizes.iconBtnSm,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
