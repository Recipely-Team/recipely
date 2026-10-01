/**
 * Where a recipe's text came from.
 *
 * @remarks
 * - **Mirrors the backend's `RecipeOrigin`.** The server decides this at the one
 *   moment it is knowable — when the draft is made — and the app only reads it.
 * - **`User` is the ordinary case and wears no badge.** A marker on every
 *   hand-written recipe is noise; the two that are not ordinary are the ones
 *   worth saying out loud.
 * - **`Curated` is Recipely Kitchen's own catalogue**, written and checked by
 *   the team; it wears the Recipely logo instead of a platform or AI mark.
 * - **An unknown value reads as `User`.** A server that grows a fifth kind
 *   must not make the app draw a badge it has no words for.
 */
export const RecipeOrigin = {
  /** A person wrote it out. */
  User: 'USER',
  /** A model wrote it, from a prompt. */
  Ai: 'AI',
  /** Lifted from a post somewhere else. */
  Import: 'IMPORT',
  /** Recipely Kitchen: written by the team, photo and nutrition sourced. */
  Curated: 'CURATED',
} as const;

export type RecipeOriginType = (typeof RecipeOrigin)[keyof typeof RecipeOrigin];
