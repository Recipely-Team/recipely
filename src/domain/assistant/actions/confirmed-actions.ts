import { AssistantAction, type AssistantActionType } from '@domain/assistant/actions/assistant-action-type';

/**
 * The actions that must not happen because a model decided they should.
 *
 * @remarks
 * - **Each either destroys something the user cannot get back, publishes under
 *   their name, or ends their session.** Their handlers open a sheet and answer
 *   `awaiting` instead of a result, and the sheet takes a spoken yes — the
 *   assistant is hands-free, so a gate only a thumb could clear would strand
 *   the user rather than protect them.
 * - **This list is READ, not just declared.** It previously sat beside the
 *   vocabulary as a statement of intent that no code consulted, and `unsave`
 *   was on it while running unconfirmed — a declared invariant nothing enforces
 *   is worse than none, because it reads as though the question was settled.
 *   `check:structure` rule V now requires every member to answer `awaiting`.
 * - **`unsave` is here and `unlike` is not.** Un-saving drops a recipe out of a
 *   collection the user curated and may not be able to find again; un-liking
 *   removes a number they can restore with one tap.
 */
export const CONFIRMED_ACTIONS: readonly AssistantActionType[] = [
  AssistantAction.DeleteRecipe,
  AssistantAction.DeleteDraft,
  AssistantAction.PublishDraft,
  AssistantAction.Unsave,
  AssistantAction.SignOut,
];
