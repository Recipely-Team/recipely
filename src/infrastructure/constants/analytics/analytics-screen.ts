/**
 * The name every routed screen reports to Firebase Analytics.
 *
 * @remarks
 * - **Why a table and not the path.** Nothing was logging a screen view, so the
 *   only screen names in the console were the ones the platforms invent on
 *   their own: one `MainActivity` for the whole Android app, and a single
 *   shared `<title>` for every page of the web export. A report built on those
 *   cannot tell the recipe feed from the settings page.
 * - **The names are the code's own.** Each value is the exported component of
 *   the route it belongs to (`app/recipes/index.tsx` exports
 *   `RecipeListScreen`), so a row in the console is searchable in the tree.
 *   Firebase's `screen_class` means exactly that, and `screen_name` is set to
 *   the same string rather than to prose that would drift away from it.
 * - **A screen name is a JOIN KEY**, like an event name: a funnel is built
 *   against the exact string, and renaming one starts a second, empty series
 *   next to the one being read. Rename only on purpose.
 * - **Redirect routes are absent on purpose** — `/` and `/ai-generate` render a
 *   `Redirect` and nothing else, so a view logged for them would count a screen
 *   nobody saw.
 */
export const AnalyticsScreen = {
  recipeList: 'RecipeListScreen',
  recipeDetail: 'RecipeDetailScreen',
  myRecipes: 'MyRecipesScreen',
  createRecipe: 'CreateRecipeScreen',
  importRecipe: 'ImportRecipeScreen',
  notifications: 'NotificationsScreen',
  profile: 'ProfileScreen',
  editProfile: 'EditProfileScreen',
  settings: 'SettingsScreen',
  onboarding: 'OnboardingScreen',
  login: 'LoginScreen',
  register: 'RegisterScreen',
  verifyCode: 'VerifyCodeScreen',
  forgotPassword: 'ForgotPasswordScreen',
  resetPassword: 'ResetPasswordScreen',
} as const;
