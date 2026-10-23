import { useTranslations } from '@presentation/i18n';
import { MealSlot, type MealSlotType } from '@domain/diary/meal-slot';
import { SegmentedTabs } from '@presentation/base/widgets/diary/segmented-tabs';
import { mealLabel } from '@presentation/base/utils/diary/meal-label';

export interface MealPickerProps {
  value: MealSlotType;
  onChange: (meal: MealSlotType) => void;
}

/** The four meals as one segmented control, in display order. */
export const MealPicker = ({ value, onChange }: MealPickerProps): React.JSX.Element => {
  const t = useTranslations();
  return (
  <SegmentedTabs
    options={Object.values(MealSlot).map((meal) => ({ key: meal, label: mealLabel(t, meal) }))}
    value={value}
    onChange={onChange}
  />
);
};
