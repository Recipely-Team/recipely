import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { RecipeImage } from '@presentation/base/widgets/media/recipe-image';
import type { FoodThumbIconType } from '@presentation/base/widgets/diary/food-thumb-icon';
import { diarySizes, iconSizes } from '@presentation/base/theme';

export interface FoodThumbProps {
  /** The recipe or product photo; ignored when `icon` is given. */
  imageUrl: string | null;
  /** Draws a chip-coloured tile with this icon instead of a photo — a quick add, a product. */
  icon: FoodThumbIconType | null;
  /** `diarySizes.foodThumb` in lists, `foodThumbLarge` in the sheet's detail header. */
  size: number;
}

/** The square thumbnail beside a food: its photo, or a chip-coloured tile with an icon. */
export const FoodThumb = ({ imageUrl, icon, size }: FoodThumbProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const box = { width: size, height: size };
  if (icon !== null) {
    return (
      <View style={[styles.tile, box, { backgroundColor: colors.chipBackground }]}>
        <Ionicons name={icon} size={iconSizes.lg} color={colors.chipText} />
      </View>
    );
  }
  return (
    <View style={[styles.tile, box]}>
      <RecipeImage uri={imageUrl} placeholderCompact style={StyleSheet.absoluteFill} />
    </View>
  );
};

const styles = StyleSheet.create({
  tile: {
    borderRadius: diarySizes.foodThumbRadius,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
