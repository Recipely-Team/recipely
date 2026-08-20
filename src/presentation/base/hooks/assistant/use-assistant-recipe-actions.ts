import { useCallback } from 'react';
import { CharConstants, ValueConstants } from '@core/constants';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { useAssistantAction } from '@presentation/base/hooks/assistant/use-assistant-action';
import { StoreStatus } from '@application/store/store-status';
import { useStores } from '@presentation/bootstrap/use-stores';

/**
 * What the assistant can do to the recipe currently on screen.
 *
 * @remarks
 * - **No argument, because "this one" is what a person says.** The user is
 *   looking at a recipe when they say "save it"; making the model repeat an id
 *   it would have to have been told first is how the whole exchange becomes a
 *   form. The screen supplies the subject, which is also why these register on
 *   mount and answer `unavailable_here` anywhere else.
 * - **`unsave` is destructive enough to confirm**, and the plan says so, but
 *   the confirmation belongs to the screen that owns the sheet — this hook is
 *   handed the already-confirmed action.
 * - **Save and like are separate**, matching the app: saving is private and
 *   liking is public, and a model told they were one thing would do the wrong
 *   one half the time.
 */
/** What the recipe screen lends the assistant, named where it is consumed. */
interface AssistantRecipeActionsDeps {
  recipeId: string;
  recipeName: string;
  instructions: readonly string[];
  cookTimeMinutes: number;
  isOwner: boolean;
  commentInput: string;
  onChangeCommentInput: (text: string) => void;
  onAddComment: () => void;
  onOpenDelete: () => void;
  onStartCookTimer: () => void;
}

export const useAssistantRecipeActions = (deps: AssistantRecipeActionsDeps): void => {
  const {
    recipeId,
    recipeName,
    instructions,
    cookTimeMinutes,
    isOwner,
    onChangeCommentInput,
    onAddComment,
    onOpenDelete,
    onStartCookTimer,
  } = deps;
  const { authStore, favoritesStore, savedRecipesStore, likesStore } = useStores();
  const authState = authStore((s) => s.state);
  const userId =
    authState.status === StoreStatus.Authenticated ? authState.session.user.id : null;
  const addFavorite = favoritesStore((s) => s.addFavorite);
  const removeFavorite = favoritesStore((s) => s.removeFavorite);
  const toggleLike = likesStore((s) => s.toggle);
  const savedIds = savedRecipesStore((s) => s.savedIds);
  const likeState = likesStore((s) => s.byRecipe[recipeId]);

  const setSaved = useCallback(
    async (wanted: boolean): Promise<AssistantActionResultType> => {
      if (userId === null) return { ok: false, error: 'signed_out' };
      // Already in the wanted state is a success, not a no-op to report: the
      // user asked for an outcome, and the outcome holds.
      if (savedIds.has(recipeId) === wanted) return { ok: true, title: recipeName };

      if (wanted) await addFavorite(userId, recipeId);
      else await removeFavorite(userId, recipeId);
      return { ok: true, title: recipeName };
    },
    [userId, savedIds, recipeId, recipeName, addFavorite, removeFavorite],
  );

  const setLiked = useCallback(
    async (wanted: boolean): Promise<AssistantActionResultType> => {
      if (userId === null) return { ok: false, error: 'signed_out' };
      if ((likeState?.likedByMe ?? false) === wanted) return { ok: true, title: recipeName };

      const result = await toggleLike(recipeId);
      return result.ok ? { ok: true, title: recipeName } : { ok: false, error: 'failed' };
    },
    [userId, likeState, recipeId, recipeName, toggleLike],
  );

  useAssistantAction(AssistantAction.Save, useCallback(() => setSaved(true), [setSaved]));
  useAssistantAction(AssistantAction.Unsave, useCallback(() => setSaved(false), [setSaved]));
  useAssistantAction(AssistantAction.Like, useCallback(() => setLiked(true), [setLiked]));
  useAssistantAction(AssistantAction.Unlike, useCallback(() => setLiked(false), [setLiked]));

  useAssistantAction(
    AssistantAction.ReadStep,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const index = Number.parseInt(arg ?? CharConstants.empty, 10) - ValueConstants.one;
        const step = instructions[index];
        // The step text is the ONE place a tool result carries content rather
        // than a count, and it has to: the model is about to read it aloud, and
        // it has no other way to know what it says.
        if (step === undefined) return { ok: false, error: 'no_such_step' };
        return { ok: true, title: step, n: { step: instructions.length } };
      },
      [instructions],
    ),
  );

  useAssistantAction(
    AssistantAction.StartTimer,
    useCallback(async (): Promise<AssistantActionResultType> => {
      // The recipe's own cook timer, which is the one the screen shows and the
      // one a notification already exists for — not an arbitrary countdown the
      // user would have no way to see or stop.
      if (cookTimeMinutes <= ValueConstants.zero) return { ok: false, error: 'no_cook_time' };
      onStartCookTimer();
      return { ok: true, title: recipeName, n: { min: cookTimeMinutes } };
    }, [cookTimeMinutes, onStartCookTimer, recipeName]),
  );

  useAssistantAction(
    AssistantAction.AddComment,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        if (arg === undefined || arg === CharConstants.empty) return { ok: false, error: 'empty' };
        // Written into the field first so the user SEES what is about to be
        // posted under their name — the same beat a person gets before tapping
        // send, rather than a comment appearing from nowhere.
        onChangeCommentInput(arg);
        onAddComment();
        return { ok: true, title: recipeName };
      },
      [onChangeCommentInput, onAddComment, recipeName],
    ),
  );

  useAssistantAction(
    AssistantAction.DeleteRecipe,
    useCallback(async (): Promise<AssistantActionResultType> => {
      if (!isOwner) return { ok: false, error: 'not_yours' };
      // Opens the confirm sheet and says so. Deleting on a model's say-so is
      // the one thing this assistant must never do, and answering `awaiting`
      // keeps the session moving while the user decides.
      onOpenDelete();
      return { ok: true, awaiting: true, title: recipeName };
    }, [isOwner, onOpenDelete, recipeName]),
  );
};
