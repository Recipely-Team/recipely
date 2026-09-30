import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { FoodThumb } from '@presentation/base/widgets/diary/food-thumb';
import { controlSizes, diarySizes, fontSizes, fontWeights, iconSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface FoodPickRowProps {
  name: string;
  /** "350 kcal · per serving"; omitted when the figure is not known yet. */
  meta: string | null;
  imageUrl: string | null;
  isQuickAdd: boolean;
  isLoading: boolean;
  onPress: () => void;
}

/** One pickable food in the Add food sheet: thumb, name, kcal line and a "+" affordance. */
export const FoodPickRow = ({ name, meta, imageUrl, isQuickAdd, isLoading, onPress }: FoodPickRowProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      accessibilityRole="button"
      accessibilityLabel={meta === null ? name : `${name}, ${meta}`}
      style={({ pressed }) => [styles.row, { opacity: pressed ? opacities.pressedSubtle : opacities.full }]}
    >
      <FoodThumb imageUrl={imageUrl} isQuickAdd={isQuickAdd} size={diarySizes.foodThumb} />
      <View style={styles.text}>
        <SizedText size={fontSizes.medium} weight={fontWeights.semibold} numberOfLines={ValueConstants.one}>
          {name}
        </SizedText>
        {meta === null ? null : (
          <SizedText size={fontSizes.small} muted numberOfLines={ValueConstants.one}>
            {meta}
          </SizedText>
        )}
      </View>
      <View style={[styles.plus, { backgroundColor: colors.chipBackground }]}>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.chipText} />
        ) : (
          <Ionicons name="add" size={iconSizes.lg} color={colors.chipText} />
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: diarySizes.pickRowMinHeight,
    paddingVertical: spacing.xs2,
  },
  text: {
    flex: ValueConstants.one,
    gap: spacing.xxs,
  },
  plus: {
    width: controlSizes.iconBtnSm,
    height: controlSizes.iconBtnSm,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
