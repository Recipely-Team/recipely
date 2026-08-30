import { numberedLines } from '@presentation/base/hooks/assistant/args/describing/numbered-lines';

/**
 * A list screen as the assistant reads it out loud.
 *
 * The counterpart of {@link recipeRoster}: same rows, same numbering, no bound
 * on how many. Every list screen in the app answers `readScreen` through this,
 * so "bu sayfada ne var" is answered the same way on the feed, on My Recipes
 * and on notifications rather than three ways.
 */
export const listReading = (label: string, rows: readonly string[]): string =>
  `${label}: ${numberedLines(rows)}`;
