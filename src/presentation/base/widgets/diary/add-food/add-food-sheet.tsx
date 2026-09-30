import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { useAddFoodFlow } from '@presentation/base/hooks/diary/use-add-food-flow';
import { AddFoodPickStep } from '@presentation/base/widgets/diary/add-food/pick/add-food-pick-step';
import { AddFoodDetailStep } from '@presentation/base/widgets/diary/add-food/detail/add-food-detail-step';
import { AddFoodFooter } from '@presentation/base/widgets/diary/add-food/add-food-footer';
import type { AddFoodRequest } from '@presentation/base/widgets/diary/add-food/request/add-food-request';
import { AddFoodStep } from '@presentation/base/widgets/diary/add-food/state/add-food-step';
import { diarySizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface AddFoodSheetProps {
  /** What to open on; null closes the sheet. */
  request: AddFoodRequest | null;
  onClose: () => void;
  /** Given only outside the diary: the success toast then offers a "Diary" action that calls it. */
  onOpenDiary?: () => void;
}

/**
 * The Add food sheet (design spec → Food Diary §6): pick a recipe, a recent
 * food or a quick add, then choose the amount and meal. A bottom sheet on a
 * phone, a centred dialog once the viewport is expanded — the shared
 * `BottomSheet` decides (rule 23).
 *
 * @remarks
 * - **The last request stays on screen while closing**: the flow keeps its
 *   state when `request` turns null, so the exit animation is not blank.
 */
export const AddFoodSheet = ({ request, onClose, onOpenDiary }: AddFoodSheetProps): React.JSX.Element => {
  const flow = useAddFoodFlow(request, onClose, onOpenDiary);
  const food = flow.step === AddFoodStep.Detail ? flow.food : null;

  return (
    <BottomSheet
      visible={request !== null}
      title={flow.isEdit ? t().diary.editFood : t().diary.addFood}
      onClose={onClose}
      dialogMaxWidth={diarySizes.addFoodDialogMaxWidth}
      footer={
        food === null ? undefined : (
          <AddFoodFooter
            isEdit={flow.isEdit}
            calories={food.nutrientsFor(flow.servings).calories}
            isSubmitting={flow.isSubmitting}
            onSubmit={() => void flow.submit()}
            onRemove={() => void flow.remove()}
          />
        )
      }
    >
      {food === null ? (
        <AddFoodPickStep
          meal={flow.meal}
          isSubmitting={flow.isSubmitting}
          onChoose={flow.choose}
          onQuickAdd={(quick, meal) => void flow.submitQuickAdd(quick, meal)}
        />
      ) : (
        <AddFoodDetailStep
          food={food}
          date={flow.date}
          servings={flow.servings}
          meal={flow.meal}
          canGoBack={flow.canGoBack}
          onBack={flow.back}
          onIncrement={flow.increment}
          onDecrement={flow.decrement}
          onMealChange={flow.setMeal}
        />
      )}
    </BottomSheet>
  );
};
