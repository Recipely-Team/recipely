import type { FridgePhoto } from '@domain/fridge/scan/fridge-photo';
import type { FridgeChip } from '@presentation/app/fridge/model/flow/fridge-chip';
import type { FridgeFilters } from '@presentation/app/fridge/model/filters/fridge-filters';
import type { FridgeViewType } from '@presentation/app/fridge/model/flow/fridge-view';
import type { IngredientSourceType } from '@presentation/app/fridge/model/flow/ingredient-source';

/**
 * The whole fridge flow: what survives every step (photos, chips, filters)
 * beside the step on screen. Photos stay on the device until "Find
 * ingredients" and are kept through a cancel or a failed scan.
 */
export interface FridgeFlowState {
  readonly photos: readonly FridgePhoto[];
  readonly chips: readonly FridgeChip[];
  readonly source: IngredientSourceType;
  readonly filters: FridgeFilters;
  /** The next chip key; keys never repeat, so an undone chip keeps its own. */
  readonly nextKey: number;
  readonly view: FridgeViewType;
}
