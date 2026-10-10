import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { MealPlanEntryEntity } from '@domain/meal-plan/meal-plan-entry-entity';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { SizedText } from '@presentation/base/widgets/text/sized-text';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { PlanServingsStepper } from '@presentation/app/diary/items/plan/plan-servings-stepper';
import { EatenBadge } from '@presentation/app/diary/items/plan/eaten-badge';
import { fontWeights, iconSizes, mealPlanSizes, opacities, spacing } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';
import { CharConstants, ValueConstants } from '@core/constants';

export interface PlannedMealCardProps {
  entry: MealPlanEntryEntity;
  onOpen: () => void;
  onStep: (direction: number) => void;
  onOptions: () => void;
}

/**
 * A planned meal in a web grid cell (design spec → Meal planner, Web card):
 * full-width photo with a ⋯ disc on it, two-line title, kcal, and the compact
 * stepper (plain servings once eaten).
 */
export const PlannedMealCard = ({ entry, onOpen, onStep, onOptions }: PlannedMealCardProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const locale = useLocale();
  const strings = t().mealPlan;
  const { recipe } = entry;
  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
      <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={recipe.name}>
        <View style={[styles.thumb, { backgroundColor: colors.skeleton, opacity: entry.eaten ? opacities.done : opacities.full }]}>
          {recipe.imageUrl === null ? null : <Image source={{ uri: recipe.imageUrl }} style={styles.image} contentFit="cover" />}
        </View>
        {entry.eaten ? <EatenBadge /> : null}
      </Pressable>
      <Pressable
        onPress={onOptions}
        accessibilityRole="button"
        accessibilityLabel={strings.mealOptionsFor.replace('{name}', recipe.name)}
        style={[styles.menu, { backgroundColor: colors.overlay }]}
      >
        <Ionicons name="ellipsis-horizontal" size={iconSizes.sm} color={colors.onOverlay} />
      </Pressable>
      <SizedText size={mealPlanSizes.gridTitle} weight={fontWeights.semibold} numberOfLines={ValueConstants.two}>
        {recipe.name}
      </SizedText>
      <SizedText size={mealPlanSizes.kcalUnit} weight={fontWeights.bold} color={colors.textMuted}>
        {`${entry.calories === null ? CharConstants.emDash : formatWholeNumber(entry.calories, locale)} ${strings.kcal}`}
      </SizedText>
      {entry.eaten ? null : <PlanServingsStepper servings={entry.servings.value} onStep={onStep} compact />}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: mealPlanSizes.gridCardRadius, padding: spacing.xs2, gap: spacing.xxs },
  thumb: { width: '100%', height: mealPlanSizes.gridThumb, borderRadius: mealPlanSizes.gridThumbRadius, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  menu: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: mealPlanSizes.gridMenuButton,
    height: mealPlanSizes.gridMenuButton,
    borderRadius: mealPlanSizes.gridMenuButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
