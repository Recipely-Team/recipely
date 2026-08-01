import { CharConstants, RegexConstants } from '@core/constants';

/**
 * The heading text of a group line, without its `#` marker and surrounding
 * space. Empty for a marker the user has not named yet — the editor creates
 * one the moment "add a group" is tapped, and an unnamed group is dropped on
 * save rather than published as a blank heading.
 */
export const ingredientGroupLabel = (line: string): string =>
  line.trimStart().replace(RegexConstants.leadingIngredientGroupMarkers, CharConstants.empty).trim();
