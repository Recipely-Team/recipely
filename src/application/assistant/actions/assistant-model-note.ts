/**
 * Sentences an assistant action hands back to the MODEL only (a result's
 * `summary`) — never shown to the user; the model says them in their language.
 *
 * @remarks
 * - **A search that found nothing must say so.** The search action returned
 *   only `{ ok: true }`, so the model could not tell an empty answer from a full
 *   one, and the instruction "offer to create it when the search finds nothing"
 *   could never fire. The library is small, so this is a common answer.
 */
export const AssistantModelNote = {
  searchFoundNothing: (query: string): string =>
    `No recipe matched "${query}". Tell the user, and offer to create it for them with generateRecipe — do not start it until they say yes.`,
} as const;
