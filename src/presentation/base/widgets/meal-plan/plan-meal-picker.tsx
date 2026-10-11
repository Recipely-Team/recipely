import { MealSlot, type MealSlotType } from '@domain/diary/meal-slot';
import { SegmentedTabs } from '@presentation/base/widgets/diary/segmented-tabs';
import { planMealLabel } from '@presentation/base/utils/meal-plan/plan-meal-label';

export interface PlanMealPickerProps {
  value: MealSlotType;
  onChange: (meal: MealSlotType) => void;
}

/** The planner's four meals as one segmented control, in display order. */
export const PlanMealPicker = ({ value, onChange }: PlanMealPickerProps): React.JSX.Element => (
  <SegmentedTabs options={Object.values(MealSlot).map((meal) => ({ key: meal, label: planMealLabel(meal) }))} value={value} onChange={onChange} />
);
