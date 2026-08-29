import { numberedLines } from '@presentation/base/hooks/assistant/args/describing/numbered-lines';

/** One item per line, so the model reads a list as a list rather than a sentence. */
const LINE_BREAK = '\n';
const INGREDIENTS = 'ingredients';
const STEPS = 'steps';

/**
 * A recipe as the assistant reads it out loud.
 *
 * @remarks
 * - **Not the screen line.** The line rides inside every tool result and counts
 *   rather than quotes; this is the whole recipe and is built only when the
 *   user asks for it — `readScreen`, once. Nothing here is charged on a turn
 *   that did not ask for it.
 * - **Numbered, and complete.** The roster on the screen line stops at eight
 *   because nobody can see more than that at once; a reading is for someone who
 *   cannot see any of it, so it stops at nothing.
 * - **Shared by the published recipe and the draft**, because "bu sayfada ne
 *   var" is the same question on both and the answer differed only in what the
 *   screen had to hand.
 */
export const recipeReading = (
  title: string,
  ingredients: readonly string[],
  instructions: readonly string[],
  facts: readonly string[] = [],
): string =>
  [
    title,
    `${INGREDIENTS}: ${numberedLines(ingredients)}`,
    `${STEPS}: ${numberedLines(instructions)}`,
    ...facts,
  ].join(LINE_BREAK);
