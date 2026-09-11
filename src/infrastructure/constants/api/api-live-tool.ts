/**
 * The one function the backend declares on every Live session token.
 *
 * @remarks
 * - **It must match `recipely-backend`'s `live-setup.ts` character for
 *   character.** The tools are baked into the token server-side and cannot be
 *   seen from here, and a response sent under a name the token did not declare
 *   is answered with silence — the conversation stops mid-turn.
 * - **One tool with an `action` word and an `arg`, not a tool per action.** The
 *   Live API fixes its tool list at setup, and this assistant walks between
 *   screens while talking; the backend explains the choice where it declares it.
 */
export const ApiLiveTool = {
  name: 'runAction',
  /** Informational only on this side: the declaration the model reads is the backend's. */
  description: 'Perform one action in the app.',
  actionField: 'action',
  argField: 'arg',
} as const;
