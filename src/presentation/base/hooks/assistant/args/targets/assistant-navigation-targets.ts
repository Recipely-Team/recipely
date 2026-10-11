import { RoutePaths } from '@presentation/base/constants/route-paths';
import { TabType } from '@presentation/app/my-recipes/model/tab-type';
import { resolveTargetName } from '@presentation/base/hooks/assistant/args/resolving/resolve-target-name';

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
// `app/ai-generate/` is registered in the root layout but nothing in the app
// navigates to it — the AI banner opens the create screen — so it is not a
// destination the assistant can be asked for either.
export const ASSISTANT_NAVIGATION_TARGETS = {
  recipes: RoutePaths.recipes,
  feed: RoutePaths.recipes,
  home: RoutePaths.recipes,
  createRecipe: RoutePaths.createRecipe,
  create: RoutePaths.createRecipe,
  importRecipe: RoutePaths.importRecipe,
  myRecipes: RoutePaths.myRecipes,
  // Each My Recipes tab is its own destination.
  saved: RoutePaths.myRecipesTab(TabType.Saved),
  liked: RoutePaths.myRecipesTab(TabType.Liked),
  created: RoutePaths.myRecipesTab(TabType.Created),
  drafts: RoutePaths.myRecipesTab(TabType.Drafts),
  // The Food Diary; the calendar page redirects to the Day view on an expanded viewport, whose rail shows the month.
  diary: RoutePaths.diary,
  diaryCalendar: RoutePaths.diaryCalendar,
  notifications: RoutePaths.notifications,
  profile: RoutePaths.profile,
  editProfile: RoutePaths.editProfile,
  settings: RoutePaths.profile,
} as const satisfies Readonly<Record<string, string>>;

/** A screen the assistant can be asked for, by the name the model is given. */
export type AssistantScreenNameType = keyof typeof ASSISTANT_NAVIGATION_TARGETS;

const SCREEN_NAMES = Object.keys(ASSISTANT_NAVIGATION_TARGETS) as AssistantScreenNameType[];

/**
 * The screen a word names, tolerating the case and spacing a model adds; `null`
 * when it names none. The model is given the list, but it is not held to it.
 */
export const resolveAssistantScreenName = (name: string): AssistantScreenNameType | null =>
  resolveTargetName(name, SCREEN_NAMES);
