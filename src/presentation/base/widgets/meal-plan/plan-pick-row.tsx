import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { RecipeFoodHit } from '@domain/diary/foods/search/recipe-food-hit';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { FoodThumb } from '@presentation/base/widgets/diary/food-thumb';
import { FoodThumbIcon } from '@presentation/base/widgets/diary/food-thumb-icon';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { formatPerServing } from '@presentation/base/utils/meal-plan/format-per-serving';
import { fontSizes, fontWeights, iconSizes, mealPlanSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface PlanPickRowProps {
  hit: RecipeFoodHit;
  onPress: (hit: RecipeFoodHit) => void;
}

/** One recipe in the add sheet's list: thumb 48, name, "350 kcal per serving" and a plus disc. */
export const PlanPickRow = ({ hit, onPress }: PlanPickRowProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  return (
    <Pressable
      onPress={() => onPress(hit)}
      accessibilityRole="button"
      accessibilityLabel={t().mealPlan.pickA11y.replace('{name}', hit.name)}
      style={({ pressed }) => [styles.row, { opacity: pressed ? opacities.pressedSubtle : opacities.full }]}
    >
      <FoodThumb imageUrl={hit.imageUrl} icon={hit.imageUrl === null ? FoodThumbIcon.Food : null} size={mealPlanSizes.pickThumb} />
      <View style={styles.text}>
        <SizedText size={mealPlanSizes.plannedTitle} weight={fontWeights.semibold} numberOfLines={ValueConstants.two}>
          {hit.name}
        </SizedText>
        <SizedText size={fontSizes.caption} color={colors.textMuted} numberOfLines={ValueConstants.one}>
          {formatPerServing(hit.perServing.calories, locale)}
        </SizedText>
      </View>
      <View style={[styles.plus, { backgroundColor: colors.chipBackground }]}>
        <Ionicons name="add" size={iconSizes.lg} color={colors.chipText} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: mealPlanSizes.pickRowMin, paddingVertical: spacing.xs2 },
  text: { flex: ValueConstants.one, gap: spacing.xxs },
  plus: {
    width: mealPlanSizes.pickPlus,
    height: mealPlanSizes.pickPlus,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
