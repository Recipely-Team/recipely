import { StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { iconSizes, spacing } from '@presentation/base/theme';
import { formatRating } from '@presentation/base/utils/format-rating';

const STAR_COUNT = 5;
const HALF_STAR = 0.5;

export interface RecipeCardRatingProps {
  rating: number;
}

/** Five stars, a half one where the rating earns it, and the number beside them. */
export const RecipeCardRating = ({ rating }: RecipeCardRatingProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= HALF_STAR;

  return (
    <View style={styles.row}>
      {Array.from({ length: STAR_COUNT }, (_, i) => {
        const half = i === fullStars && hasHalf;
        const iconName = i < fullStars ? 'star' : half ? 'star-half-full' : 'star-outline';
        return (
          <MaterialCommunityIcons
            key={i}
            name={iconName}
            size={iconSizes.sm}
            color={i < fullStars || half ? colors.starFilled : colors.starEmpty}
          />
        );
      })}
      <ThemedText variant="caption" muted style={styles.text}>
        {formatRating(rating)}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    marginLeft: spacing.xs,
  },
});
