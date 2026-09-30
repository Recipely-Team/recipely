import type { RecipeSummaryEntity } from '@domain/recipes/recipe-summary-entity';
import { ValueConstants } from '@core/constants';
import { t } from '@presentation/i18n';
import { matchesFoodQuery } from '@presentation/base/widgets/diary/add-food/search/matches-food-query';
import type { RecipeFoodGroup } from '@presentation/base/widgets/diary/add-food/search/recipe-food-group';
import type { RecipeFoodSources } from '@presentation/base/widgets/diary/add-food/search/recipe-food-sources';

/**
 * The Recipes tab's groups — My recipes · Saved · From Recipely — filtered by
 * the search and with empty groups dropped.
 *
 * @remarks
 * - **A recipe appears once**, in the first group that holds it: your own
 *   recipe you also saved is listed under "My recipes" only.
 * - The feed is whatever the Recipes tab has loaded; nothing is fetched here.
 */
export const buildRecipeFoodGroups = (sources: RecipeFoodSources, query: string, locale: string): RecipeFoodGroup[] => {
  const strings = t().diary;
  const seen = new Set<string>();
  const take = (recipes: readonly RecipeSummaryEntity[]): RecipeSummaryEntity[] =>
    recipes.filter((recipe) => {
      if (seen.has(recipe.id) || !matchesFoodQuery(recipe.name, query, locale)) return false;
      seen.add(recipe.id);
      return true;
    });
  return [
    { key: 'mine', title: strings.groupMine, recipes: take(sources.mine) },
    { key: 'saved', title: strings.groupSaved, recipes: take(sources.saved) },
    { key: 'feed', title: strings.groupFeed, recipes: take(sources.feed) },
  ].filter((group) => group.recipes.length > ValueConstants.zero);
};
