import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { FoodThumb } from '@presentation/base/widgets/diary/food-thumb';
import { FoodThumbIcon } from '@presentation/base/widgets/diary/food-thumb-icon';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { controlSizes, fontSizes, fontWeights, mealPlanSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface PlanRecipeRowProps {
  name: string;
  imageUrl: string | null;
  /** The line under the name: "350 kcal per serving", or "Lunch · Thu, Oct 1 · 450 kcal". */
  meta: string;
  thumbSize?: number;
  /** A trailing text action ("Change"); absent when the recipe is locked. */
  action?: { label: string; onPress: () => void };
}

/** A planned or chosen recipe at the top of a sheet: thumb, name (two lines) and a meta line. */
export const PlanRecipeRow = ({ name, imageUrl, meta, thumbSize = mealPlanSizes.pickThumb, action }: PlanRecipeRowProps): React.JSX.Element => {
  const colors = useTheme().colors;
  return (
    <View style={styles.row}>
      <FoodThumb imageUrl={imageUrl} icon={imageUrl === null ? FoodThumbIcon.Food : null} size={thumbSize} />
      <View style={styles.text}>
        <SizedText size={mealPlanSizes.plannedTitle} weight={fontWeights.semibold} numberOfLines={ValueConstants.two}>
          {name}
        </SizedText>
        <SizedText size={fontSizes.caption} color={colors.textMuted} numberOfLines={ValueConstants.one}>
          {meta}
        </SizedText>
      </View>
      {action === undefined ? null : (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          style={({ pressed }) => [styles.action, { opacity: pressed ? opacities.pressedSubtle : opacities.full }]}
        >
          <SizedText size={fontSizes.medium} weight={fontWeights.bold} color={colors.primary}>
            {action.label}
          </SizedText>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  text: { flex: ValueConstants.one, gap: spacing.xxs },
  action: { minHeight: controlSizes.touchTarget, justifyContent: 'center', paddingHorizontal: spacing.sm, borderRadius: radii.md },
});
