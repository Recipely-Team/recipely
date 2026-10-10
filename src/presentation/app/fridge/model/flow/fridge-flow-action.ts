import type { Failure } from '@core/failure';
import type { FridgeIdea } from '@domain/fridge/ideas/fridge-idea';
import type { FridgeIngredient } from '@domain/fridge/scan/fridge-ingredient';
import type { FridgePhoto } from '@domain/fridge/scan/fridge-photo';
import type { FridgeChip } from '@presentation/app/fridge/model/flow/fridge-chip';
import type { FridgeFilters } from '@presentation/app/fridge/model/filters/fridge-filters';
import type { FridgeIdeasQuery } from '@presentation/app/fridge/model/ideas/fridge-ideas-query';

/** Everything that moves the fridge flow — the reducer's vocabulary. */
export type FridgeFlowActionType =
  | { readonly type: 'photosAdded'; readonly photos: readonly FridgePhoto[] }
  | { readonly type: 'photoRemoved'; readonly index: number }
  | { readonly type: 'scanStarted' }
  | { readonly type: 'scanSucceeded'; readonly ingredients: readonly FridgeIngredient[] }
  | { readonly type: 'scanFailed'; readonly failure: Failure }
  | { readonly type: 'scanCancelled' }
  | { readonly type: 'retake' }
  | { readonly type: 'typeInstead' }
  | { readonly type: 'chipRemoved'; readonly key: string }
  | { readonly type: 'chipRestored'; readonly chip: FridgeChip; readonly index: number }
  | { readonly type: 'chipAdded'; readonly name: string }
  | { readonly type: 'filtersChanged'; readonly filters: Partial<FridgeFilters> }
  | { readonly type: 'filtersCleared' }
  | { readonly type: 'ideasStarted'; readonly query: FridgeIdeasQuery }
  | { readonly type: 'moreStarted' }
  | { readonly type: 'ideasLoaded'; readonly ideas: readonly FridgeIdea[] }
  | { readonly type: 'ideasFailed'; readonly failure: Failure }
  | { readonly type: 'addedToList'; readonly title: string }
  | { readonly type: 'back' };
