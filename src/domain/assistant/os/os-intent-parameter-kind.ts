/**
 * What the OS is asked to resolve before it hands an intent over.
 *
 * @remarks
 * - **`Text` is not free for the asking.** Siri refuses a freeform string
 *   *inside* an App Shortcut phrase — only enums and entities are recognised
 *   there. A text parameter therefore arrives either through Apple's
 *   `searchInApp` schema, which passes its raw query, or by Siri asking for it
 *   in a second turn. Which of the two is the entry's own business; this only
 *   says a sentence is expected.
 * - **`RecipeEntity` is resolved against the catalogue on disk**, not the API.
 *   An intent runs with no session and often no network, so a recipe the user
 *   can name out loud has to have been synced already.
 */
export const OsIntentParameterKind = {
  Text: 'text',
  RecipeEntity: 'recipeEntity',
} as const;

export type OsIntentParameterKindType =
  (typeof OsIntentParameterKind)[keyof typeof OsIntentParameterKind];
