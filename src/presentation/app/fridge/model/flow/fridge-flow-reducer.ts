import type { Failure } from '@core/failure';
import { ErrorMessageKey } from '@core/failure';
import { ValueConstants } from '@core/constants';
import { FridgeConfidence } from '@domain/fridge/scan/fridge-confidence';
import { FridgeLimits } from '@domain/fridge/fridge-limits';
import { normalizeFridgeIngredients } from '@domain/fridge/normalize-fridge-ingredients';
import type { FridgeIdea } from '@domain/fridge/ideas/fridge-idea';
import type { FridgeChip } from '@presentation/app/fridge/model/flow/fridge-chip';
import type { FridgeFlowState } from '@presentation/app/fridge/model/flow/fridge-flow-state';
import type { FridgeFlowActionType } from '@presentation/app/fridge/model/flow/fridge-flow-action';
import { FridgeStep } from '@presentation/app/fridge/model/flow/fridge-step';
import { IngredientSource } from '@presentation/app/fridge/model/flow/ingredient-source';
import { DEFAULT_FRIDGE_FILTERS } from '@presentation/app/fridge/model/filters/default-fridge-filters';
import { IdeasLoad } from '@presentation/app/fridge/model/ideas/ideas-load';

const isQuota = (failure: Failure): boolean => failure.messageKey === ErrorMessageKey.fridgeQuotaExceeded;
const isNothingRecognised = (failure: Failure): boolean => failure.messageKey === ErrorMessageKey.fridgeNothingRecognised;

const chipsFrom = (names: readonly { name: string; sure: boolean }[], firstKey: number): FridgeChip[] =>
  names.map((entry, index) => ({ key: String(firstKey + index), name: entry.name, sure: entry.sure }));

/** New ideas only: a title already on screen (the server may repeat one past `exclude`) is dropped. */
const appendNew = (shown: readonly FridgeIdea[], incoming: readonly FridgeIdea[]): FridgeIdea[] => {
  const titles = new Set(shown.map((idea) => idea.title.toLowerCase()));
  return [...shown, ...incoming.filter((idea) => !titles.has(idea.title.toLowerCase()))];
};

const ingredients = (state: FridgeFlowState, failure: Failure | null): FridgeFlowState => ({
  ...state,
  view: { step: FridgeStep.Ingredients, failure, startAdding: false },
});

/**
 * **The fridge flow's transitions**, pure so every path is tested without a screen.
 *
 * @remarks
 * - **Two failures end the flow's step, not just the request.** The daily
 *   limit opens the limit state from anywhere; "nothing recognised" (or an
 *   empty scan) opens its own state. Every other failure returns to the step
 *   the user was on, with a banner, keeping their photos and chips.
 * - **A late answer is ignored by the step it lands on**: ideas arriving after
 *   the user went back, or a scan answer after Cancel, change nothing.
 * - **Chips go through the domain's normaliser**, so a typed "Eggs" after a
 *   scanned "eggs" is not added twice.
 */
export const fridgeFlowReducer = (state: FridgeFlowState, action: FridgeFlowActionType): FridgeFlowState => {
  const { view } = state;
  switch (action.type) {
    case 'photosAdded':
      return { ...state, photos: [...state.photos, ...action.photos].slice(ValueConstants.zero, FridgeLimits.photosMax) };
    case 'photoRemoved':
      return { ...state, photos: state.photos.filter((_, index) => index !== action.index) };
    case 'scanStarted':
      return state.photos.length === ValueConstants.zero ? state : { ...state, view: { step: FridgeStep.Analysing } };
    case 'scanSucceeded': {
      if (view.step !== FridgeStep.Analysing) return state;
      if (action.ingredients.length === ValueConstants.zero) return { ...state, view: { step: FridgeStep.NothingFound } };
      const names = action.ingredients.map((i) => ({ name: i.name, sure: i.confidence === FridgeConfidence.High }));
      return { ...ingredients(state, null), chips: chipsFrom(names, state.nextKey), nextKey: state.nextKey + names.length, source: IngredientSource.Scan };
    }
    case 'scanFailed':
      if (view.step !== FridgeStep.Analysing) return state;
      if (isQuota(action.failure)) return { ...state, view: { step: FridgeStep.Limit } };
      if (isNothingRecognised(action.failure)) return { ...state, view: { step: FridgeStep.NothingFound } };
      return { ...state, view: { step: FridgeStep.Capture, failure: action.failure } };
    case 'scanCancelled':
      return { ...state, view: { step: FridgeStep.Capture, failure: null } };
    case 'retake':
      return { ...state, photos: [], view: { step: FridgeStep.Capture, failure: null } };
    case 'typeInstead':
      return { ...state, chips: [], source: IngredientSource.Typed, view: { step: FridgeStep.Ingredients, failure: null, startAdding: true } };
    case 'chipRemoved':
      return { ...state, chips: state.chips.filter((chip) => chip.key !== action.key) };
    case 'chipRestored': {
      if (state.chips.some((chip) => chip.key === action.chip.key)) return state;
      const chips = [...state.chips];
      chips.splice(Math.min(action.index, chips.length), ValueConstants.zero, action.chip);
      return { ...state, chips };
    }
    case 'chipAdded': {
      const before = state.chips.map((chip) => chip.name);
      const after = normalizeFridgeIngredients([...before, action.name]);
      if (after.length === before.length) return state;
      const name = after[after.length - ValueConstants.one] ?? action.name;
      return { ...state, chips: [...state.chips, { key: String(state.nextKey), name, sure: true }], nextKey: state.nextKey + ValueConstants.one };
    }
    case 'filtersChanged':
      return { ...state, filters: { ...state.filters, ...action.filters } };
    case 'filtersCleared':
      return { ...state, filters: { ...DEFAULT_FRIDGE_FILTERS, servings: state.filters.servings } };
    case 'ideasStarted':
      return { ...state, view: { step: FridgeStep.Ideas, query: action.query, ideas: [], load: IdeasLoad.First, added: [] } };
    case 'moreStarted':
      return view.step === FridgeStep.Ideas && view.load === IdeasLoad.Idle ? { ...state, view: { ...view, load: IdeasLoad.More } } : state;
    case 'ideasLoaded': {
      if (view.step !== FridgeStep.Ideas || (view.load !== IdeasLoad.First && view.load !== IdeasLoad.More)) return state;
      const ideas = appendNew(view.ideas, action.ideas);
      return { ...state, view: { ...view, ideas, load: ideas.length === view.ideas.length ? IdeasLoad.Exhausted : IdeasLoad.Idle } };
    }
    case 'ideasFailed':
      if (view.step !== FridgeStep.Ideas) return state;
      if (isQuota(action.failure)) return { ...state, view: { step: FridgeStep.Limit } };
      return view.load === IdeasLoad.First ? ingredients(state, action.failure) : { ...state, view: { ...view, load: IdeasLoad.Idle } };
    case 'addedToList':
      return view.step === FridgeStep.Ideas ? { ...state, view: { ...view, added: [...view.added, action.title] } } : state;
    case 'back':
      if (view.step === FridgeStep.Ideas) return ingredients(state, null);
      if (view.step === FridgeStep.Ingredients || view.step === FridgeStep.NothingFound) return { ...state, view: { step: FridgeStep.Capture, failure: null } };
      return state;
  }
};
