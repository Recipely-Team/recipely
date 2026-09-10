/**
 * Every capability the app offers the operating system's own assistant.
 *
 * @remarks
 * - **One list, three artifacts.** These ids name the Swift `AppIntent` structs,
 *   the Android shortcut ids and the entries of `OS_INTENT_CATALOGUE`. Spelled
 *   out separately in those places, a Swift intent could quietly stop matching
 *   the action it claims to run and nothing would fail until a user said it out
 *   loud — the same argument rule 5 makes for `AssistantAction`, carried across
 *   the native boundary.
 * - **This is a subset of the vocabulary, not a copy of it.** The in-app
 *   assistant answers fifty words because it can see the screen. Siri and the
 *   launcher cannot, so only the handful that make sense as a cold sentence are
 *   here; `setDraftField` or `scroll` mean nothing without a screen in front of
 *   the user.
 */
export const OsIntentId = {
  /** Free text, one turn. The only phrase shape Siri fills from a sentence. */
  SearchRecipes: 'searchRecipes',
  /** Free text, two turns: a parameterless phrase, then Siri asks. */
  AskRecipely: 'askRecipely',
  OpenRecipe: 'openRecipe',
  SaveRecipe: 'saveRecipe',
  LikeRecipe: 'likeRecipe',
  StartTimer: 'startTimer',
  ReadIngredients: 'readIngredients',
  ReadNextStep: 'readNextStep',
  GenerateRecipe: 'generateRecipe',
  ImportRecipe: 'importRecipe',
  OpenMyRecipes: 'openMyRecipes',
} as const;

export type OsIntentIdType = (typeof OsIntentId)[keyof typeof OsIntentId];
