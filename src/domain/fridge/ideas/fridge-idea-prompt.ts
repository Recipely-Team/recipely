import { CharConstants, ValueConstants } from '@core/constants';
import { FridgeLimits } from '@domain/fridge/fridge-limits';
import type { FridgeIdea } from '@domain/fridge/ideas/fridge-idea';
import type { FridgeMaxMinutesType } from '@domain/fridge/ideas/fridge-max-minutes';
import type { FridgePromptWording } from '@domain/fridge/ideas/fridge-prompt-wording';

/** What a picked idea is turned into a prompt from. */
interface FridgeIdeaPromptInput {
  readonly idea: FridgeIdea;
  /** The user's ingredient list as it stood when the ideas were asked for. */
  readonly ingredients: readonly string[];
  readonly maxMinutes: FridgeMaxMinutesType | null;
  /** The chosen diet in the user's words; null when no diet was chosen. */
  readonly dietLabel: string | null;
  readonly servings: number;
}

const compose = (input: FridgeIdeaPromptInput, have: readonly string[], wording: FridgePromptWording): string => {
  const { idea } = input;
  const lines = [wording.dish(idea.title, idea.summary), wording.have(have.join(CharConstants.commaSpace))];
  if (idea.missing.length > ValueConstants.zero) lines.push(wording.missing(idea.missing.join(CharConstants.commaSpace)));
  if (input.maxMinutes !== null) lines.push(wording.maxTime(input.maxMinutes));
  if (input.dietLabel !== null) lines.push(wording.diet(input.dietLabel));
  lines.push(wording.servings(input.servings));
  return lines.join(CharConstants.newline);
};

/**
 * **A picked fridge idea → the prompt the ordinary AI generator gets.**
 *
 * @remarks
 * - **The same generate path as a typed prompt.** No idea id reaches the
 *   server: the backend has no idea store, so the idea travels as words —
 *   title, summary, the user's ingredients, what is missing, and the filters.
 * - **Never past `FridgeLimits.promptMax`.** The ingredient list is the only
 *   part that can grow, so it is shortened from the end until the prompt fits;
 *   the title and the filters always survive.
 */
export const fridgeIdeaPrompt = (input: FridgeIdeaPromptInput, wording: FridgePromptWording): string => {
  let have = input.ingredients;
  let prompt = compose(input, have, wording);
  while (prompt.length > FridgeLimits.promptMax && have.length > ValueConstants.one) {
    have = have.slice(ValueConstants.zero, have.length - ValueConstants.one);
    prompt = compose(input, have, wording);
  }
  return prompt.slice(ValueConstants.zero, FridgeLimits.promptMax);
};
