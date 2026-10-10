import { Pressable, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { MealPlanEntryEntity } from '@domain/meal-plan/meal-plan-entry-entity';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { useDiaryTones } from '@presentation/base/theme/colors/tones/use-diary-tones';
import { FoodThumb } from '@presentation/base/widgets/diary/food-thumb';
import { FoodThumbIcon } from '@presentation/base/widgets/diary/food-thumb-icon';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { formatPlanServings } from '@presentation/base/utils/meal-plan/format-plan-servings';
import { PlanServingsStepper } from '@presentation/app/diary/items/plan/plan-servings-stepper';
import { EatenBadge } from '@presentation/app/diary/items/plan/eaten-badge';
import { borderWidths, fontSizes, fontWeights, iconSizes, mealPlanSizes, opacities, radii, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';
import { CharConstants, ValueConstants } from '@core/constants';

export interface PlannedMealRowProps {
  entry: MealPlanEntryEntity;
  onOpen: () => void;
  onStep: (direction: number) => void;
  onOptions: () => void;
  /** Hides the divider above the first row of a slot. */
  first: boolean;
}

/**
 * One planned meal in a phone slot card (design spec → Meal planner, Planned
 * card): thumb 56, two-line title, servings stepper, ⋯ and the kcal for those
 * servings. Eaten: dimmed thumb with a check badge, an "Eaten" tag, and the
 * servings as plain text — an eaten meal's servings are locked.
 */
export const PlannedMealRow = ({ entry, onOpen, onStep, onOptions, first }: PlannedMealRowProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const tones = useDiaryTones();
  const locale = useLocale();
  const strings = t().mealPlan;
  const { recipe } = entry;
  const kcal = entry.calories;

  return (
    <View style={[styles.row, first ? null : { borderTopColor: colors.cardBorder, borderTopWidth: borderWidths.hairline }]}>
      <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={recipe.name} style={styles.open}>
        <View style={{ opacity: entry.eaten ? opacities.done : opacities.full }}>
          <FoodThumb imageUrl={recipe.imageUrl} icon={recipe.imageUrl === null ? FoodThumbIcon.Food : null} size={mealPlanSizes.plannedThumb} />
        </View>
        {entry.eaten ? <EatenBadge /> : null}
      </Pressable>
      <View style={styles.body}>
        <SizedText size={mealPlanSizes.plannedTitle} weight={fontWeights.semibold} numberOfLines={ValueConstants.two} onPress={onOpen}>
          {recipe.name}
        </SizedText>
        {entry.eaten ? (
          <View style={styles.eatenLine}>
            <View style={[styles.tag, { backgroundColor: tones.on.bg }]}>
              <Ionicons name="checkmark" size={iconSizes.xs} color={tones.on.fg} />
              <SizedText size={fontSizes.micro} weight={fontWeights.bold} color={tones.on.fg}>
                {strings.eaten}
              </SizedText>
            </View>
            <SizedText size={fontSizes.caption} color={colors.textMuted}>
              {formatPlanServings(entry.servings.value, locale)}
            </SizedText>
          </View>
        ) : (
          <PlanServingsStepper servings={entry.servings.value} onStep={onStep} />
        )}
      </View>
      <View style={styles.trailing}>
        <Pressable
          onPress={onOptions}
          accessibilityRole="button"
          accessibilityLabel={strings.mealOptionsFor.replace('{name}', recipe.name)}
          style={({ pressed }) => [styles.menu, { opacity: pressed ? opacities.pressedSubtle : opacities.full }]}
        >
          <Ionicons name="ellipsis-horizontal" size={iconSizes.lg} color={colors.textMuted} />
        </Pressable>
        <SizedText size={fontSizes.medium} weight={fontWeights.bold}>
          {kcal === null ? CharConstants.emDash : formatWholeNumber(kcal, locale)}
          <SizedText size={mealPlanSizes.kcalUnit} color={colors.textMuted}>{` ${strings.kcal}`}</SizedText>
        </SizedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, paddingLeft: spacing.lg, paddingRight: spacing.xs },
  open: { borderRadius: mealPlanSizes.plannedThumbRadius },
  body: { flex: ValueConstants.one, gap: spacing.xs },
  eatenLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    minHeight: mealPlanSizes.eatenTag,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.round,
  },
  trailing: { alignItems: 'flex-end', gap: spacing.xxs },
  menu: { width: mealPlanSizes.menuButtonWidth, minHeight: mealPlanSizes.menuButtonHeight, alignItems: 'center', justifyContent: 'center' },
});
