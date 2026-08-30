import { CharConstants, ValueConstants } from '@core/constants';

/**
 * How many rows the screen line names before it starts counting instead.
 *
 * The line rides inside every tool result, so it is paid for on every turn.
 * Eight names is roughly what fits on a phone screen — the rows the user can
 * actually see while they say "the third one" — and about forty tokens.
 */
const MAX_NAMED = 8;

/** What the line says when the screen has a list and the list is empty. */
const NOTHING = 'none';

/**
 * One screen's rows, as the model reads them.
 *
 * @remarks
 * - **This is what makes "the second one" answerable.** The route alone told
 *   the model the user was on `/recipes`; every reference to something on that
 *   screen was a phrase passed blindly to a handler to resolve, and "is there
 *   anything here?" had no answer at all.
 * - **Numbered, because position is half of how people refer to a list.** The
 *   numbers are 1-based and match `rowAt`, so what the model says back is what
 *   the handler resolves.
 * - **It counts the rest rather than listing it.** A feed is twenty recipes
 *   long and the user is looking at three; naming all twenty would cost tokens
 *   on every turn to describe rows nobody can see.
 * - **An empty list says so.** "There are no recipes here" is an answer the
 *   assistant could not give while the line was a path.
 */
export const recipeRoster = (label: string, names: readonly string[]): string => {
  if (names.length === ValueConstants.zero) return `${label}=${NOTHING}`;

  const listed = names
    .slice(ValueConstants.zero, MAX_NAMED)
    .map((name, index) => `${index + ValueConstants.one}) ${name}`)
    .join(CharConstants.space);
  const rest = names.length - MAX_NAMED;
  return rest > ValueConstants.zero ? `${label}=${listed} (+${rest} more)` : `${label}=${listed}`;
};
