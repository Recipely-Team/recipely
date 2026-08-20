import { useCallback, useRef } from 'react';
import { StepCursor } from '@presentation/base/hooks/assistant/step-cursor';
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
  ingredients: readonly string[];
  instructions: readonly string[];
  cookTimeMinutes: number;
  isOwner: boolean;
  commentInput: string;
  onChangeCommentInput: (text: string) => void;
  onAddComment: () => void;
  onOpenDelete: () => void;
  onOpenShare: () => void;
  onStartCookTimer: () => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onStopTimer: () => void;
  checkedIngredients: readonly boolean[];
  completedSteps: readonly boolean[];
  onToggleIngredient: (index: number) => void;
  onToggleStep: (index: number) => void;
}

export const useAssistantRecipeActions = (deps: AssistantRecipeActionsDeps): void => {
  const {
    recipeId,
    recipeName,
    ingredients,
    instructions,
    cookTimeMinutes,
    isOwner,
    onChangeCommentInput,
    onAddComment,
    onOpenDelete,
    onOpenShare,
    onStartCookTimer,
    onPauseTimer,
    onResumeTimer,
    onStopTimer,
    checkedIngredients,
    onToggleIngredient,
    onToggleStep,
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

  // Walking the recipe hands-free: "next" is what a cook says, far more often
  // than a number. The cursor lives here rather than in the model, because the
  // model's memory of where it was is exactly what a reconnect loses.
  const stepCursor = useRef(ValueConstants.minusOne);
  useAssistantAction(
    AssistantAction.ReadStep,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const asked = (arg ?? StepCursor.Next).trim().toLocaleLowerCase();
        const index =
          asked === StepCursor.Next
            ? stepCursor.current + ValueConstants.one
            : asked === StepCursor.Previous
              ? stepCursor.current - ValueConstants.one
              : asked === StepCursor.Current
                ? Math.max(stepCursor.current, ValueConstants.zero)
                : Number.parseInt(asked, 10) - ValueConstants.one;

        const step = instructions[index];
        if (step === undefined) return { ok: false, error: 'no_such_step' };

        stepCursor.current = index;
        // The step text is the ONE place a tool result carries content rather
        // than a count, and it has to: the model is about to read it aloud and
        // has no other way to know what it says.
        return { ok: true, title: step, n: { step: index + ValueConstants.one, of: instructions.length } };
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

  // Checking things off is what a cook actually does with their hands, and it
  // is the one thing they cannot do with them covered in flour. Both take a
  // name or a 1-based position, because "the yoghurt" and "the second one" are
  // the same request phrased two ways.
  useAssistantAction(
    AssistantAction.ToggleIngredient,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const index = indexOfRow(ingredients, arg);
        if (index === null) return { ok: false, error: 'not_found' };
        onToggleIngredient(index);
        return {
          ok: true,
          n: {
            ing: ingredients.length,
            checked: checkedIngredients.filter(Boolean).length + (checkedIngredients[index] === true ? -1 : 1),
          },
        };
      },
      [ingredients, onToggleIngredient, checkedIngredients],
    ),
  );

  useAssistantAction(
    AssistantAction.ToggleStep,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const index = indexOfRow(instructions, arg);
        if (index === null) return { ok: false, error: 'not_found' };
        onToggleStep(index);
        return { ok: true, n: { step: instructions.length } };
      },
      [instructions, onToggleStep],
    ),
  );

  useAssistantAction(
    AssistantAction.PauseTimer,
    useCallback(async (): Promise<AssistantActionResultType> => {
      onPauseTimer();
      return { ok: true };
    }, [onPauseTimer]),
  );

  useAssistantAction(
    AssistantAction.ResumeTimer,
    useCallback(async (): Promise<AssistantActionResultType> => {
      onResumeTimer();
      return { ok: true };
    }, [onResumeTimer]),
  );

  useAssistantAction(
    AssistantAction.StopTimer,
    useCallback(async (): Promise<AssistantActionResultType> => {
      onStopTimer();
      return { ok: true };
    }, [onStopTimer]),
  );

  useAssistantAction(
    AssistantAction.ShareRecipe,
    useCallback(async (): Promise<AssistantActionResultType> => {
      // Opens the app's own share sheet. The assistant does not choose WHERE a
      // recipe goes — that names a person, and picking one on a model's say-so
      // is the mistake nobody can take back.
      onOpenShare();
      return { ok: true, awaiting: true, title: recipeName };
    }, [onOpenShare, recipeName]),
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

/**
 * Finds a row by what the cook called it, or by a 1-based position.
 *
 * Both, because both are natural: "check off the yoghurt" and "check off the
 * second one" are the same request phrased differently, and the model passes
 * through whichever the user said.
 */
function indexOfRow(rows: readonly string[], arg: string | undefined): number | null {
  if (arg === undefined || arg === CharConstants.empty) return null;

  const position = Number.parseInt(arg, 10);
  if (Number.isFinite(position) && String(position) === arg.trim()) {
    const index = position - ValueConstants.one;
    return index >= ValueConstants.zero && index < rows.length ? index : null;
  }

  const needle = arg.toLocaleLowerCase();
  const found = rows.findIndex((row) => row.toLocaleLowerCase().includes(needle));
  return found === ValueConstants.minusOne ? null : found;
}
