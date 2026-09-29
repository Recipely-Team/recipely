import { DIFFICULTY_VALUES } from '@domain/recipes/difficulty';

/**
 * A recipe's tags with any tag that merely restates a difficulty removed.
 *
 * @remarks
 * - **Legacy rows.** The editor used to save the difficulty as an English tag
 *   ("Easy", "Medium"), and the detail screen printed it untranslated beside a
 *   correctly localised difficulty. Those rows are still on the server, so they
 *   are dropped where the wire becomes the domain.
 * - **Case-insensitive**, like `difficultyLabel`: "easy" is the same word.
 */
export const withoutDifficultyTags = (tags: readonly string[]): string[] =>
  tags.filter((tag) => !DIFFICULTY_VALUES.some((difficulty) => difficulty === tag.trim().toUpperCase()));
