import type { Failure } from '@core/failure';
import type { FridgeIdea } from '@domain/fridge/ideas/fridge-idea';
import type { FridgeStep } from '@presentation/app/fridge/model/flow/fridge-step';
import type { IdeasLoadType } from '@presentation/app/fridge/model/ideas/ideas-load';
import type { FridgeIdeasQuery } from '@presentation/app/fridge/model/ideas/fridge-ideas-query';

/**
 * What the fridge screen shows — one variant per step, each carrying only
 * what that step needs (a failure banner, the ideas and their loading).
 */
export type FridgeViewType =
  | { readonly step: typeof FridgeStep.Capture; readonly failure: Failure | null }
  | { readonly step: typeof FridgeStep.Analysing }
  | { readonly step: typeof FridgeStep.Ingredients; readonly failure: Failure | null; readonly startAdding: boolean }
  | {
      readonly step: typeof FridgeStep.Ideas;
      readonly query: FridgeIdeasQuery;
      readonly ideas: readonly FridgeIdea[];
      readonly load: IdeasLoadType;
      /** Titles whose missing items are already on the shopping list. */
      readonly added: readonly string[];
    }
  | { readonly step: typeof FridgeStep.NothingFound }
  | { readonly step: typeof FridgeStep.Limit };
