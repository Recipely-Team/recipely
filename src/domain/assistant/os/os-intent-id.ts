/**
 * Every capability the app offers the operating system's own assistant.
 *
 * @remarks
 * - **One list, three artifacts.** These ids name the Swift `AppIntent` structs,
 *   the Android shortcut ids and the entries of `OS_INTENT_CATALOGUE`. Spelled
 *   Swift and Kotlin cannot import a TypeScript const, so they necessarily
 *   re-spell these words as literals — and a renamed action would have kept
 *   compiling on both sides while silently ceasing to work out loud.
 *   `check:structure` rule W is what closes that: it reads the native sources
 *   and refuses any `id`, `action` or deep-link word that is not in the
 *   vocabulary it claims to come from. jest cannot read Swift, which is why
 *   this one is the gate's job rather than a test's.
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
