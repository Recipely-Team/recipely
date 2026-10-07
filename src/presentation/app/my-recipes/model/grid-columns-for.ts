import { RECIPE_CARD_MIN_WIDTH, GRID_GAP } from '@presentation/app/my-recipes/model/grid-metrics';
import { WEB_CONTENT_MAX_WIDTH } from '@presentation/base/responsive/breakpoints';
import { spacing } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

/** How many recipe cards fit across: one on a phone, as many minimum-width cards as the capped width holds otherwise. */
export const gridColumnsFor = (isExpanded: boolean, width: number): number => {
  if (!isExpanded) return ValueConstants.one;
  const available = Math.min(width, WEB_CONTENT_MAX_WIDTH.myRecipes) - spacing.xl * ValueConstants.two;
  return Math.max(ValueConstants.one, Math.floor((available + GRID_GAP) / (RECIPE_CARD_MIN_WIDTH + GRID_GAP)));
};
