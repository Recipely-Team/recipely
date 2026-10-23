import { useRootNavigationState } from 'expo-router';
import { useTranslations } from '@presentation/i18n';
import { RoutePaths } from '@presentation/base/constants';
import { ValueConstants } from '@core/constants';

/**
 * Label for the recipe detail's back link, named after where back actually goes.
 *
 * The link said "Back to recipes" whatever route had pushed the detail, so
 * arriving from a notification and tapping it landed the user back in
 * notifications — a promise the screen never kept. Only a return to the feed
 * gets the specific wording; every other origin (notifications, My Recipes, a
 * shared link) gets the plain one.
 */
export const useBackLabel = (): string => {
  const t = useTranslations();
  // Typed as always present, but undefined until the navigator is ready.
  const state = useRootNavigationState() as ReturnType<typeof useRootNavigationState> | undefined;
  const previous = state?.routes[state.index - ValueConstants.one]?.name;
  return previous === RoutePaths.recipesRouteName ? t.recipes.backToRecipes : t.common.back;
};
