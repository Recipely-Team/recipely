import { useMemo } from 'react';
import { useStores } from '@presentation/bootstrap/use-stores';
import type { AddFoodState } from '@presentation/base/widgets/diary/add-food/state/add-food-state';
import { AddFoodStep } from '@presentation/base/widgets/diary/add-food/state/add-food-step';
import type { ProductStepModelType } from '@presentation/base/widgets/diary/add-food/state/product/product-step-model';
import { resolveProductStep } from '@presentation/base/widgets/diary/add-food/state/product/resolve-product-step';

/** The product step's model from the flow state and the catalogue store's opened product; null on the other steps. */
export const useProductStep = (state: AddFoodState | null): ProductStepModelType | null => {
  const { foodCatalogStore } = useStores();
  const detail = foodCatalogStore((s) => s.detail);
  return useMemo(
    () => (state?.step === AddFoodStep.Product ? resolveProductStep(state.choice, detail, state.variantIndex, state.quantity) : null),
    [state, detail],
  );
};
