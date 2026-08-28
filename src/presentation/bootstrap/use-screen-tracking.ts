import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { CharConstants } from '@core/constants';
import { AnalyticsScreen } from '@infrastructure/constants/analytics/analytics-screen';
import { analyticsService } from '@infrastructure/firebase/analytics-service';
import { RoutePaths } from '@presentation/base/constants';

/**
 * Every routed screen, by the path the router reports for it.
 *
 * Keyed off `RoutePaths` rather than re-typed strings so a route that moves
 * cannot leave a stale key behind — the pair would stop matching and the screen
 * would silently go unreported.
 */
const SCREEN_BY_PATH: ReadonlyMap<string, string> = new Map([
  [RoutePaths.recipes, AnalyticsScreen.recipeList],
  [RoutePaths.myRecipes, AnalyticsScreen.myRecipes],
  [RoutePaths.createRecipe, AnalyticsScreen.createRecipe],
  [RoutePaths.importRecipe, AnalyticsScreen.importRecipe],
  [RoutePaths.notifications, AnalyticsScreen.notifications],
  [RoutePaths.profile, AnalyticsScreen.profile],
  [RoutePaths.editProfile, AnalyticsScreen.editProfile],
  [RoutePaths.settings, AnalyticsScreen.settings],
  [RoutePaths.onboarding, AnalyticsScreen.onboarding],
  [RoutePaths.login, AnalyticsScreen.login],
  [RoutePaths.register, AnalyticsScreen.register],
  [RoutePaths.verifyCode, AnalyticsScreen.verifyCode],
  [RoutePaths.forgotPassword, AnalyticsScreen.forgotPassword],
  [RoutePaths.resetPassword, AnalyticsScreen.resetPassword],
]);

/** Prefix of the one parameterised route: `/recipes/<id>`. */
const RECIPE_DETAIL_PREFIX = `${RoutePaths.recipes}${CharConstants.slash}`;

/**
 * The screen a path belongs to, or `null` when the path is not one users see.
 *
 * The recipe id never becomes part of the name: a screen name is a dimension
 * with one row per value, and one row per recipe is a report nobody can read.
 */
const resolveScreen = (pathname: string): string | null => {
  const exact = SCREEN_BY_PATH.get(pathname);
  if (exact !== undefined) return exact;
  if (pathname.startsWith(RECIPE_DETAIL_PREFIX)) return AnalyticsScreen.recipeDetail;
  return null;
};

/**
 * Reports a Firebase screen view whenever the route changes.
 *
 * @remarks
 * - **Why manual.** Both platforms report screens by themselves and both report
 *   the wrong thing: Android sees one Activity for the entire app, and the web
 *   export serves the same `<title>` from `+html.tsx` on every route. This app
 *   is one native screen and one HTML document, so the router is the only thing
 *   that knows which screen is on.
 * - **Query strings are not screens.** `usePathname` excludes them on purpose —
 *   `?tab=drafts` and `?q=…` are states of My Recipes and the feed, not
 *   destinations of their own, and folding them in would split each screen's
 *   row into dozens.
 * - **Unknown paths report nothing.** The two redirect routes and the dev
 *   sitemap are not screens; logging a view for a route that immediately
 *   navigates away would count an impression nobody had.
 * - **It lives in `bootstrap/`** because it reaches into infrastructure, which
 *   only the composition root may do (rule 17).
 */
export const useScreenTracking = (): void => {
  const pathname = usePathname();

  useEffect(() => {
    const screen = resolveScreen(pathname);
    if (screen === null) return;
    void analyticsService.logScreen(screen);
  }, [pathname]);
};
