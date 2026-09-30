import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { RecipeImage } from '@presentation/base/widgets/media/recipe-image';
import { diarySizes, iconSizes } from '@presentation/base/theme';

export interface FoodThumbProps {
  /** The recipe photo; null for a quick add, which draws a bolt tile instead. */
  imageUrl: string | null;
  isQuickAdd: boolean;
  /** `diarySizes.foodThumb` in lists, `foodThumbLarge` in the sheet's detail header. */
  size: number;
}

/** The square thumbnail beside a food: its recipe photo, or a chip-coloured tile with a bolt for a quick add. */
export const FoodThumb = ({ imageUrl, isQuickAdd, size }: FoodThumbProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const box = { width: size, height: size };
  if (isQuickAdd) {
    return (
      <View style={[styles.tile, box, { backgroundColor: colors.chipBackground }]}>
        <Ionicons name="flash" size={iconSizes.lg} color={colors.chipText} />
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
