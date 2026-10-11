import { ValueConstants } from '@core/constants';
import type { FridgeFlowState } from '@presentation/app/fridge/model/flow/fridge-flow-state';
import { FridgeStep } from '@presentation/app/fridge/model/flow/fridge-step';
import { IngredientSource } from '@presentation/app/fridge/model/flow/ingredient-source';
import { DEFAULT_FRIDGE_FILTERS } from '@presentation/app/fridge/model/filters/default-fridge-filters';

/** A fresh flow: no photos, no chips, default filters, on the capture step. */
export const initialFridgeFlow = (): FridgeFlowState => ({
  photos: [],
  chips: [],
  source: IngredientSource.Scan,
  filters: DEFAULT_FRIDGE_FILTERS,
  nextKey: ValueConstants.zero,
  view: { step: FridgeStep.Capture, failure: null },
});
