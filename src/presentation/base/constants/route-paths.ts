import { ImportSource } from '@presentation/base/constants/import-source';
import { EditProfileSection } from '@presentation/base/constants/edit-profile-section';

/**
 * Every in-app expo-router navigation target in one place, so route strings
 * are never hard-coded at call sites. Parameterised routes are builder
 * functions. Only navigation TARGETS belong here — never route segment names
 * used in `<Stack.Screen name=...>` or file/folder names.
 */
export const RoutePaths = {
  onboarding: '/onboarding',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  verifyCode: '/verify-code',
  resetPassword: '/reset-password',
  recipes: '/recipes',
  createRecipe: '/create-recipe',
  importRecipe: '/import-recipe',
  /** The import screen asking for photos or a PDF instead of a link. */
  importRecipeFromFile: `/import-recipe?source=${ImportSource.File}`,
  myRecipes: '/my-recipes',
  diary: '/diary',
  /** The Diary tab's month page — a phone layout only; an expanded viewport shows the month in the Day view's rail. */
  diaryCalendar: '/diary/calendar',
  /**
   * The feed's name in the root navigator's state (not a path) — expo-router
   * registers folder pages as `<segment>/index`. Used to tell where a back
   * navigation will land.
   */
  recipesRouteName: 'recipes/index',
  /** The My Recipes tab a publish lands on — the one holding the new recipe. */
  myRecipesCreatedTab: 'created',
  /** Where a pointer to a draft that no longer exists lands. */
  myRecipesDraftsTab: 'drafts',
  notifications: '/notifications',
  profile: '/profile',
  editProfile: '/edit-profile',
  /** Edit Profile scrolled to its creator account section — where a claim decision is acted on. */
  editProfileCreatorAccount: `/edit-profile?section=${EditProfileSection.CreatorAccount}`,
  settings: '/settings',
  /** Instagram automations: the creator's comment-to-DM rules. */
  automations: '/automations',
  /** The rule editor; `ruleId` (absent for a new rule) and `step` ride the query. */
  automationEdit: '/automations/edit',
  /** One automation's Activity; `ruleId` rides the query (an account page, not crawlable content). */
  automationActivityPath: '/automations/activity',
  automationActivity: (ruleId: string): string => `/automations/activity?ruleId=${encodeURIComponent(ruleId)}`,
  /** Where the Instagram login returns to (web same-tab, and Android's deep link). */
  instagramConnected: '/instagram-connected',
  /** The Chefs tab: every approved creator, as cards. */
  creators: '/creators',
  recipeDetail: (recipeId: string): string => `/recipes/${recipeId}`,
  /** One creator's public page; open to guests. */
  creatorProfile: (userId: string): string => `/creators/${encodeURIComponent(userId)}`,
  /**
   * The feed, arriving with the search box already filled.
   *
   * The assistant navigates like a person rather than reaching into the feed's
   * store: it opens the screen with the query, the field shows it, and the
   * user watches the search they asked for happen.
   */
  recipesWithSearch: (query: string): string => `/recipes?q=${encodeURIComponent(query)}`,
  /** The create screen, arriving with the prompt filled and generation started. */
  /**
   * The create screen, seeded from a recipe that already exists.
   *
   * Asked to "make the same recipe", the assistant used to hand the words to
   * the generator, which invented something adjacent. A copy is a copy: the
   * fields are read from the recipe, and the user edits from there.
   */
  createRecipeFromRecipe: (recipeId: string): string =>
    `/create-recipe?fromRecipeId=${encodeURIComponent(recipeId)}`,
  /** The editor, opened on a private recipe the user owns; saving goes through PATCH. */
  editRecipe: (recipeId: string): string =>
    `/create-recipe?editRecipeId=${encodeURIComponent(recipeId)}`,
  createRecipeWithPrompt: (prompt: string): string =>
    `/create-recipe?prompt=${encodeURIComponent(prompt)}`,
  /** My Recipes opened on one of its tabs — saved, liked, created, drafts. */
  myRecipesTab: (tab: string): string => `/my-recipes?tab=${encodeURIComponent(tab)}`,
  loginWithRedirect: (pathname: string): string => `/login?redirect=${encodeURIComponent(pathname)}`,
} as const;
