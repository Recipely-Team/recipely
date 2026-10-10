import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { RecipeImage } from '@presentation/base/widgets/media/recipe-image';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { aspectRatios, controlSizes, fridgeSizes, iconSizes, radii, spacing } from '@presentation/base/theme';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface PhotoTileProps {
  uri: string;
  /** 1-based, for "Remove photo n". */
  position: number;
  onRemove: () => void;
}

/**
 * One picked photo in the capture grid: 3:4, rounded, with a 28 remove disc
 * in a 36 hit area at the top-right corner.
 */
export const PhotoTile = ({ uri, position, onRemove }: PhotoTileProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View
      accessible
      accessibilityLabel={t().fridge.photoA11y.replace('{n}', String(position))}
      style={[styles.tile, { backgroundColor: colors.skeleton, borderColor: colors.cardBorder }]}
    >
      <RecipeImage uri={uri} style={styles.image} placeholderCompact />
      <Pressable
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={t().fridge.removePhoto.replace('{n}', String(position))}
        style={styles.hit}
      >
        <View style={[styles.disc, { backgroundColor: colors.overlay }]}>
          <Ionicons name="close" size={iconSizes.md} color={colors.onOverlay} />
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  tile: {
    flex: ValueConstants.one,
    aspectRatio: aspectRatios.pagePortrait,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  hit: {
    position: 'absolute',
    top: ValueConstants.zero,
    right: ValueConstants.zero,
    width: controlSizes.iconBtn,
    height: controlSizes.iconBtn,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxs,
    marginRight: spacing.xxs,
  },
  disc: {
    width: fridgeSizes.removeDisc,
    height: fridgeSizes.removeDisc,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
