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
  notifications: '/notifications',
  profile: '/profile',
  editProfile: '/edit-profile',
  settings: '/settings',
  recipeDetail: (recipeId: string): string => `/recipes/${recipeId}`,
  createRecipeWithDraft: (recipeId: string): string => `/create-recipe?recipeId=${recipeId}`,
  loginWithRedirect: (pathname: string): string => `/login?redirect=${encodeURIComponent(pathname)}`,
} as const;
