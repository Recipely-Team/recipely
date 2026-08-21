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
  myRecipes: '/my-recipes',
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
  settings: '/settings',
  recipeDetail: (recipeId: string): string => `/recipes/${recipeId}`,
  /**
   * The feed, arriving with the search box already filled.
   *
   * The assistant navigates like a person rather than reaching into the feed's
   * store: it opens the screen with the query, the field shows it, and the
   * user watches the search they asked for happen.
   */
  recipesWithSearch: (query: string): string => `/recipes?q=${encodeURIComponent(query)}`,
  /** The create screen, arriving with the prompt filled and generation started. */
  createRecipeWithPrompt: (prompt: string): string =>
    `/create-recipe?prompt=${encodeURIComponent(prompt)}`,
  /** My Recipes opened on one of its tabs — saved, liked, created, drafts. */
  myRecipesTab: (tab: string): string => `/my-recipes?tab=${encodeURIComponent(tab)}`,
  loginWithRedirect: (pathname: string): string => `/login?redirect=${encodeURIComponent(pathname)}`,
} as const;
