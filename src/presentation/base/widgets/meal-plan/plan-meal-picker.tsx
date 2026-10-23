import { useTranslations } from '@presentation/i18n';
import { MealSlot, type MealSlotType } from '@domain/diary/meal-slot';
import { SegmentedTabs } from '@presentation/base/widgets/diary/segmented-tabs';
import { planMealLabel } from '@presentation/base/utils/meal-plan/plan-meal-label';

export interface PlanMealPickerProps {
  value: MealSlotType;
  onChange: (meal: MealSlotType) => void;
}

/** The planner's four meals as one segmented control, in display order. */
export const PlanMealPicker = ({ value, onChange }: PlanMealPickerProps): React.JSX.Element => {
  const t = useTranslations();
  return (
  <SegmentedTabs options={Object.values(MealSlot).map((meal) => ({ key: meal, label: planMealLabel(t, meal) }))} value={value} onChange={onChange} />
);
};
