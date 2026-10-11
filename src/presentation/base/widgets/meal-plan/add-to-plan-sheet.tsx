import type { RecipeFoodHit } from '@domain/diary/foods/search/recipe-food-hit';
import { useAddToPlanSheet } from '@presentation/base/hooks/meal-plan/use-add-to-plan-sheet';
import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { PrimaryButton } from '@presentation/base/widgets/buttons/primary-button';
import { PlanPickStep } from '@presentation/base/widgets/meal-plan/plan-pick-step';
import { PlanDetailsStep } from '@presentation/base/widgets/meal-plan/plan-details-step';
import type { AddToPlanRequest } from '@presentation/base/widgets/meal-plan/model/add-to-plan-request';
import { formatWholeNumber } from '@presentation/base/utils/diary/format-whole-number';
import { mealPlanSizes } from '@presentation/base/theme';
import { t, useLocale } from '@presentation/i18n';

export interface AddToPlanSheetProps {
  /** What to open on; null closes the sheet. */
  request: AddToPlanRequest | null;
  onClose: () => void;
  /** Given outside the Plan view: the success toast then offers "View", which calls it. */
  onView?: () => void;
}

/**
 * The add-to-plan sheet (design spec → Meal planner, Add — pick / details):
 * pick a recipe (unless one came with the request), then its day, meal and
 * servings. A bottom sheet on a phone, a centred dialog (max 520) once the
 * viewport is expanded — the shared `BottomSheet` decides (rule 23).
 */
export const AddToPlanSheet = ({ request, onClose, onView }: AddToPlanSheetProps): React.JSX.Element => {
  const locale = useLocale();
  const flow = useAddToPlanSheet(request, onClose, onView);
  const strings = t().mealPlan;
  const { recipe } = flow;
  const pick = (hit: RecipeFoodHit): void =>
    flow.choose({ id: hit.id, name: hit.name, imageUrl: hit.imageUrl, caloriesPerServing: hit.perServing.calories, meal: null });
  const cta = flow.totalCalories === null ? strings.addToPlan : strings.addToPlanKcal.replace('{k}', formatWholeNumber(flow.totalCalories, locale));

  return (
    <BottomSheet
      visible={request !== null}
      title={strings.addToPlan}
      onClose={onClose}
      dialogMaxWidth={mealPlanSizes.addDialogMaxWidth}
      scrollsItself={recipe === null}
      footer={recipe === null ? undefined : <PrimaryButton label={cta} onPress={() => void flow.submit()} loading={flow.isSubmitting} />}
    >
      {recipe === null ? (
        <PlanPickStep onChoose={pick} />
      ) : (
        <PlanDetailsStep
          recipe={recipe}
          onChange={flow.isLocked ? null : flow.change}
          week={flow.pickerWeek}
          date={flow.date}
          today={flow.today}
          onSelectDate={flow.setDate}
          onPageWeek={flow.pageWeek}
          meal={flow.meal}
          onMealChange={flow.setMeal}
          servings={{ value: flow.servings, total: flow.totalCalories, onIncrement: flow.increment, onDecrement: flow.decrement }}
        />
      )}
    </BottomSheet>
  );
};
