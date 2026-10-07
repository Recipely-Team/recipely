import { ListState } from '@presentation/base/hooks/assistant/args/describing/list-state';
import { rowAt } from '@presentation/base/hooks/assistant/args/resolving/row-at';
import { useCallback } from 'react';
import { CharConstants, ValueConstants } from '@core/constants';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionError } from '@domain/assistant/actions/assistant-action-error';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { useAssistantReadActions } from '@presentation/base/hooks/assistant/actions/use-assistant-read-actions';
import { useAssistantScreenContent } from '@presentation/base/hooks/assistant/use-assistant-screen-content';
import { useAssistantScreenReading } from '@presentation/base/hooks/assistant/use-assistant-screen-reading';
import { recipeReading } from '@presentation/base/hooks/assistant/args/describing/recipe-reading';
import { listReading } from '@presentation/base/hooks/assistant/args/describing/list-reading';
import { Answer, SCREEN_PART_SEPARATOR } from '@presentation/base/hooks/assistant/args/describing/screen-line';
import { StoreStatus } from '@application/store/store-status';
import { useStores } from '@presentation/bootstrap/use-stores';

/** What the recipe screen lends the assistant, named where it is consumed. */
interface AssistantRecipeActionsDeps {
  recipeId: string;
  recipeName: string;
  ingredients: readonly string[];
  instructions: readonly string[];
  cookTimeMinutes: number;
  /**
   * The facts printed beside the recipe: times, servings, difficulty and the
   * macros when the backend has them.
   *
   * On the screen line rather than behind an action, because "how long does
   * this take" and "how many calories" are asked while both hands are busy and
   * a round trip to find out is a round trip the cook waits through. They are
   * short; the recipe TEXT is what has to stay out of the context.
   */
  facts: readonly string[];
  /**
   * The comments as they are printed, "who: what".
   *
   * Counted on the screen line and quoted only in the reading: a comment
   * thread is the rest of the page, and "bu sayfada ne var" that stops above
   * it is not an answer for someone who cannot see the page.
   */
  comments: readonly string[];
  isOwner: boolean;
  onPostComment: (text: string) => void;
  onOpenDelete: () => void;
  onRequestUnsave: () => void;
  onOpenShare: () => void;
  /** Opens the create screen seeded from this recipe; carries the guest gate. */
  onCopyToDraft: () => void;
  onStartCookTimer: () => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
  onStopTimer: () => void;
  checkedIngredients: readonly boolean[];
  completedSteps: readonly boolean[];
  onToggleIngredient: (index: number) => void;
  onToggleStep: (index: number) => void;
}

/**
 * What the assistant can do to the recipe currently on screen.
 *
 * @remarks
 * - **No argument, because "this one" is what a person says.** The user is
 *   looking at a recipe when they say "save it"; making the model repeat an id
 *   it would have to have been told first is how the whole exchange becomes a
 *   form. The screen supplies the subject, which is also why these register on
 *   mount and answer `unavailable_here` anywhere else.
 * - **`unsave` asks first.** It drops a recipe out of a collection the user
 *   curated and may not find again. The sheet belongs to the screen; this hook
 *   raises it and answers `awaiting`.
 * - **Save and like are separate**, matching the app: saving is private and
 *   liking is public, and a model told they were one thing would do the wrong
 *   one half the time.
 * - **The screen line names the recipe and its state.** Without it "delete it"
 *   was a request the model could only relay and hope: it did not know whose
 *   recipe this was, so it could not say "that one is not yours" before trying,
 *   and it re-saved things that were already saved because it had no way to
 *   know. `mine` is what lets it warn before asking to delete rather than after.
 */
/** What the reading calls the thread under the recipe. */
const COMMENTS_LABEL = 'comments';

export const useAssistantRecipeActions = (deps: AssistantRecipeActionsDeps): void => {
  const {
    recipeId,
    recipeName,
    ingredients,
    instructions,
    cookTimeMinutes,
    facts,
    comments,
    isOwner,
    onPostComment,
    onOpenDelete,
    onRequestUnsave,
    onOpenShare,
    onCopyToDraft,
    onStartCookTimer,
    onPauseTimer,
    onResumeTimer,
    onStopTimer,
    checkedIngredients,
    completedSteps,
    onToggleIngredient,
    onToggleStep,
  } = deps;
  const { authStore, favoritesStore, savedRecipesStore, likesStore } = useStores();
  const authState = authStore((s) => s.state);
  const userId =
    authState.status === StoreStatus.Authenticated ? authState.session.user.id : null;
  const addFavorite = favoritesStore((s) => s.addFavorite);
  const removeFavorite = favoritesStore((s) => s.removeFavorite);
  const setLikedInStore = likesStore((s) => s.setLiked);
  const savedIds = savedRecipesStore((s) => s.savedIds);
  const savedListState = savedRecipesStore((s) => s.listState);
  const likeState = likesStore((s) => s.byRecipe[recipeId]);

  const setSaved = useCallback(
    async (wanted: boolean): Promise<AssistantActionResultType> => {
      if (userId === null) return { ok: false, error: AssistantActionError.SignedOut };
      if (savedIds.has(recipeId) === wanted) {
        // An unloaded saved set reads every recipe as not saved; only unsave needs it loaded.
        if (!wanted && savedListState.status !== StoreStatus.Loaded) {
          return { ok: false, error: AssistantActionError.NotReady };
        }
        return { ok: true, title: recipeName };
      }

      if (wanted) await addFavorite(userId, recipeId);
      else await removeFavorite(userId, recipeId);
      return { ok: true, title: recipeName };
    },
    [userId, savedIds, savedListState, recipeId, recipeName, addFavorite, removeFavorite],
  );

  const setLiked = useCallback(
    async (wanted: boolean): Promise<AssistantActionResultType> => {
      if (userId === null) return { ok: false, error: AssistantActionError.SignedOut };
      // The store, not the render state, knows whether the recipe is liked.
      if (likeState === undefined) return { ok: false, error: AssistantActionError.NotReady };

      const result = await setLikedInStore(recipeId, wanted);
      return result.ok ? { ok: true, title: recipeName } : { ok: false, error: AssistantActionError.Failed };
    },
    [userId, likeState, recipeId, recipeName, setLikedInStore],
  );

  useAssistantScreenContent(() =>
    [
      `recipe=${recipeName}`,
      `saved=${savedIds.has(recipeId) ? Answer.yes : Answer.no}`,
      `liked=${likeState?.likedByMe === true ? Answer.yes : Answer.no}`,
      `mine=${isOwner ? Answer.yes : Answer.no}`,
      `steps=${instructions.length}`,
      `comments=${comments.length}`,
      ...facts,
    ].join(SCREEN_PART_SEPARATOR),
  );

  // The whole recipe, built only when asked; the screen line stays counts.
  useAssistantScreenReading(() =>
    recipeReading(recipeName, ingredients, instructions, [
      ...facts,
      listReading(COMMENTS_LABEL, comments, ListState.Ready),
    ]),
  );

  useAssistantAction(AssistantAction.Save, useCallback(() => setSaved(true), [setSaved]));
  useAssistantAction(
    AssistantAction.Unsave,
    useCallback(async (): Promise<AssistantActionResultType> => {
      // Unsave asks first (a curated collection), and needs the saved set loaded.
      if (savedListState.status !== StoreStatus.Loaded) {
        return { ok: false, error: AssistantActionError.NotReady };
      }
      if (!savedIds.has(recipeId)) return { ok: true, title: recipeName };
      onRequestUnsave();
      return { ok: true, awaiting: true, title: recipeName };
    }, [savedIds, savedListState, recipeId, recipeName, onRequestUnsave]),
  );
  useAssistantAction(AssistantAction.Like, useCallback(() => setLiked(true), [setLiked]));
  useAssistantAction(AssistantAction.Unlike, useCallback(() => setLiked(false), [setLiked]));

  // Shared with the draft editor, which has steps and ingredients too.
  useAssistantReadActions(ingredients, instructions);

  useAssistantAction(
    AssistantAction.StartTimer,
    useCallback(async (): Promise<AssistantActionResultType> => {
      // The recipe's own cook timer: the one the screen shows and can stop.
      if (cookTimeMinutes <= ValueConstants.zero) return { ok: false, error: AssistantActionError.NoCookTime };
      onStartCookTimer();
      return { ok: true, title: recipeName, n: { min: cookTimeMinutes } };
    }, [cookTimeMinutes, onStartCookTimer, recipeName]),
  );

  useAssistantAction(
    AssistantAction.AddComment,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        if (arg === undefined || arg === CharConstants.empty) return { ok: false, error: AssistantActionError.Empty };
        // The text goes with the call; the field would still hold the previous render's value.
        onPostComment(arg);
        return { ok: true, title: recipeName };
      },
      [onPostComment, recipeName],
    ),
  );

  // Name or 1-based position ("the yoghurt" / "the second one").
  useAssistantAction(
    AssistantAction.ToggleIngredient,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const index = rowAt(ingredients, arg);
        if (index === null) return { ok: false, error: AssistantActionError.NotFound };
        onToggleIngredient(index);
        return {
          ok: true,
          n: {
            ing: ingredients.length,
            checked: checkedIngredients.filter(Boolean).length + (checkedIngredients[index] === true ? ValueConstants.minusOne : ValueConstants.one),
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
        const index = rowAt(instructions, arg);
        if (index === null) return { ok: false, error: AssistantActionError.NotFound };
        onToggleStep(index);
        return {
          ok: true,
          n: {
            step: instructions.length,
            done: completedSteps.filter(Boolean).length + (completedSteps[index] === true ? ValueConstants.minusOne : ValueConstants.one),
          },
        };
      },
      [instructions, onToggleStep, completedSteps],
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
    AssistantAction.DuplicateRecipe,
    useCallback(async (): Promise<AssistantActionResultType> => {
      // The screen's own action, so the guest gate is shared with the tap path.
      onCopyToDraft();
      // awaiting: the copy is made once the create screen has loaded it.
      return { ok: true, awaiting: true, title: recipeName };
    }, [onCopyToDraft, recipeName]),
  );

  useAssistantAction(
    AssistantAction.ShareRecipe,
    useCallback(async (): Promise<AssistantActionResultType> => {
      // Opens the share sheet; the user picks the destination.
      onOpenShare();
      return { ok: true, awaiting: true, title: recipeName };
    }, [onOpenShare, recipeName]),
  );

  useAssistantAction(
    AssistantAction.DeleteRecipe,
    useCallback(async (): Promise<AssistantActionResultType> => {
      if (!isOwner) return { ok: false, error: AssistantActionError.NotYours };
      // Opens the confirm sheet; never deletes on the model's say-so.
      onOpenDelete();
      return { ok: true, awaiting: true, title: recipeName };
    }, [isOwner, onOpenDelete, recipeName]),
  );
};
