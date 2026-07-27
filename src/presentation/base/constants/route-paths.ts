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
  recipes: '/recipes',
  createRecipe: '/create-recipe',
  myRecipes: '/my-recipes',
  /** The My Recipes tab a publish lands on — the one holding the new recipe. */
  myRecipesCreatedTab: 'created',
  notifications: '/notifications',
  profile: '/profile',
  editProfile: '/edit-profile',
  settings: '/settings',
  recipeDetail: (recipeId: string): string => `/recipes/${recipeId}`,
  loginWithRedirect: (pathname: string): string => `/login?redirect=${encodeURIComponent(pathname)}`,
} as const;
