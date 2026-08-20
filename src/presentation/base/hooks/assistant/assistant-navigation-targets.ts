import { RoutePaths } from '@presentation/base/constants/route-paths';
import { TabType } from '@presentation/app/my-recipes/model/tab-type';

/**
 * The screens the assistant may send the user to, by the word it says.
 *
 * @remarks
 * - **Keyed on what a model would say, not on a route.** The model picks a
 *   destination from meaning, so `navigate` arrives carrying a word like
 *   "profile" or "createRecipe" — never a path. Translating here keeps route
 *   strings out of the assistant's vocabulary entirely.
 * - **A deliberate subset.** Auth and verification screens are absent: the
 *   assistant must not be able to talk a signed-in user into a login flow, and
 *   nothing it does needs one.
 */
export const ASSISTANT_NAVIGATION_TARGETS: Readonly<Record<string, string>> = {
  recipes: RoutePaths.recipes,
  feed: RoutePaths.recipes,
  home: RoutePaths.recipes,
  createRecipe: RoutePaths.createRecipe,
  create: RoutePaths.createRecipe,
  importRecipe: RoutePaths.importRecipe,
  myRecipes: RoutePaths.myRecipes,
  // The four My Recipes tabs are destinations in their own right — "open my
  // saved ones" names one of them, and landing on the tab the screen happened
  // to remember is not what was asked for.
  saved: RoutePaths.myRecipesTab(TabType.Saved),
  liked: RoutePaths.myRecipesTab(TabType.Liked),
  created: RoutePaths.myRecipesTab(TabType.Created),
  drafts: RoutePaths.myRecipesTab(TabType.Drafts),
  notifications: RoutePaths.notifications,
  profile: RoutePaths.profile,
  editProfile: RoutePaths.editProfile,
  settings: RoutePaths.settings,
};
