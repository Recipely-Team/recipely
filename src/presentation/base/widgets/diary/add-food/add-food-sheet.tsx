import { BottomSheet } from '@presentation/base/widgets/sheets/bottom-sheet';
import { useAddFoodFlow } from '@presentation/base/hooks/diary/use-add-food-flow';
import { AddFoodPickStep } from '@presentation/base/widgets/diary/add-food/pick/add-food-pick-step';
import { AddFoodDetailStep } from '@presentation/base/widgets/diary/add-food/detail/add-food-detail-step';
import { AddFoodProductStep } from '@presentation/base/widgets/diary/add-food/product/add-food-product-step';
import { AddFoodFooter } from '@presentation/base/widgets/diary/add-food/add-food-footer';
import type { AddFoodRequestType } from '@presentation/base/widgets/diary/add-food/request/add-food-request';
import { AddFoodRequestKind } from '@presentation/base/widgets/diary/add-food/request/add-food-request-kind';
import { CharConstants } from '@core/constants';
import { diarySizes } from '@presentation/base/theme';
import { t } from '@presentation/i18n';

export interface AddFoodSheetProps {
  /** What to open on; null closes the sheet. */
  request: AddFoodRequestType | null;
  onClose: () => void;
  /** Given only outside the diary: the success toast then offers a "Diary" action that calls it. */
  onOpenDiary?: () => void;
}

/**
 * The Add food sheet (Add food v2 spec): search the server's recipes and
 * products or browse its tabs, then choose a recipe's servings or a
 * product's variant and amount, and the meal. A bottom sheet on a phone, a
 * centred dialog once the viewport is expanded — the shared `BottomSheet`
 * decides (rule 23).
 *
 * @remarks
 * - **Each step scrolls itself** (`scrollsItself`): the pick step's lists are
 *   paged `FlatList`s, which never reach their end inside a scroll view.
 * - **The last request stays on screen while closing**: the flow keeps its
 *   state when `request` turns null, so the exit animation is not blank.
 */
export const AddFoodSheet = ({ request, onClose, onOpenDiary }: AddFoodSheetProps): React.JSX.Element => {
  const flow = useAddFoodFlow(request, onClose, onOpenDiary);

  const body = (): React.JSX.Element => {
    if (flow.product !== null) {
      return (
        <AddFoodProductStep
          model={flow.product}
          date={flow.date}
          meal={flow.meal}
          canGoBack={flow.canGoBack}
          onBack={flow.back}
          onRetry={flow.retryProduct}
          onVariantChange={flow.setVariant}
          onUnitChange={flow.setUnit}
          onIncrement={flow.incrementAmount}
          onDecrement={flow.decrementAmount}
          onMealChange={flow.setMeal}
        />
      );
    }
    if (flow.food !== null) {
      return (
        <AddFoodDetailStep
          food={flow.food}
          date={flow.date}
          servings={flow.servings}
          meal={flow.meal}
          canGoBack={flow.canGoBack}
          onBack={flow.back}
          onIncrement={flow.increment}
          onDecrement={flow.decrement}
          onMealChange={flow.setMeal}
        />
      );
    }
    return (
      <AddFoodPickStep
        initialQuery={request?.kind === AddFoodRequestKind.Pick ? (request.query ?? CharConstants.empty) : CharConstants.empty}
        meal={flow.meal}
        isSubmitting={flow.isSubmitting}
        onChoose={flow.choose}
        onChooseProduct={flow.chooseProduct}
        onChooseRecent={flow.chooseRecent}
        onQuickAdd={(quick, meal) => void flow.submitQuickAdd(quick, meal)}
      />
    );
  };

  return (
    <BottomSheet
      visible={request !== null}
      title={flow.isEdit ? t().diary.editFood : t().diary.addFood}
      onClose={onClose}
      dialogMaxWidth={diarySizes.addFoodDialogMaxWidth}
      scrollsItself
      footer={
        flow.footerCalories === null ? undefined : (
          <AddFoodFooter
            isEdit={flow.isEdit}
            calories={flow.footerCalories}
            isSubmitting={flow.isSubmitting}
            onSubmit={() => void flow.submit()}
            onRemove={() => void flow.remove()}
          />
        )
      }
    >
      {body()}
    </BottomSheet>
  );
};
