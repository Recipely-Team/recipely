import { numberedLines } from '@presentation/base/hooks/assistant/args/describing/numbered-lines';
import { ListState } from '@presentation/base/hooks/assistant/args/describing/list-state';
import type { ListStateType } from '@presentation/base/hooks/assistant/args/describing/list-state';
import { ValueConstants } from '@core/constants';

/**
 * A list screen as the assistant reads it out loud.
 *
 * The counterpart of {@link recipeRoster}: same rows, same numbering, no bound
 * on how many. Every list screen in the app answers `readScreen` through this,
 * so "bu sayfada ne var" is answered the same way on the feed, on My Recipes
 * and on notifications rather than three ways.
 */
export const listReading = (label: string, rows: readonly string[], state: ListStateType): string =>
  rows.length === ValueConstants.zero && state !== ListState.Ready
    ? `${label}: ${state}`
    : `${label}: ${numberedLines(rows)}`;
