import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { RoutePaths } from '@presentation/base/constants';
import { machineLower } from '@presentation/base/hooks/assistant/args/machine-case';
import { rowAt } from '@presentation/base/hooks/assistant/args/row-at';
import { useCallback, useRef } from 'react';
import { StepCursor } from '@presentation/base/hooks/assistant/args/step-cursor';
import { CharConstants, ValueConstants } from '@core/constants';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionError } from '@domain/assistant/actions/assistant-action-error';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { useAssistantScreenContent } from '@presentation/base/hooks/assistant/use-assistant-screen-content';
import { Answer, SCREEN_PART_SEPARATOR } from '@presentation/base/hooks/assistant/args/screen-line';
import { StoreStatus } from '@application/store/store-status';
import { useStores } from '@presentation/bootstrap/use-stores';

/** What the recipe screen lends the assistant, named where it is consumed. */
interface AssistantRecipeActionsDeps {
  recipeId: string;
  recipeName: string;
  ingredients: readonly string[];
  instructions: readonly string[];
  cookTimeMinutes: number;
  isOwner: boolean;
  onPostComment: (text: string) => void;
  onOpenDelete: () => void;
  onRequestUnsave: () => void;
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
export const useAssistantRecipeActions = (deps: AssistantRecipeActionsDeps): void => {
  const {
    recipeId,
    recipeName,
    ingredients,
    instructions,
    cookTimeMinutes,
    isOwner,
    onPostComment,
    onOpenDelete,
    onRequestUnsave,
    onOpenShare,
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
      if (userId === null) return { ok: false, error: 'signed_out' };
      if (savedIds.has(recipeId) === wanted) {
        // An unloaded set answers "not saved" about every recipe in the app, so
        // this branch reported an unsave that never happened. It only misleads
        // in that direction: reading "not saved" when asked to SAVE just means
        // the save runs, which is what the user wanted anyway.
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
      if (userId === null) return { ok: false, error: 'signed_out' };
      // No early return on the render's `likeState`: an absent entry read as
      // "not liked", so the FIRST spoken "beğen" flipped nothing and said it
      // had. The store owns that question now and answers it truthfully.
      if (likeState === undefined) return { ok: false, error: AssistantActionError.NotReady };

      const result = await setLikedInStore(recipeId, wanted);
      return result.ok ? { ok: true, title: recipeName } : { ok: false, error: 'failed' };
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
    ].join(SCREEN_PART_SEPARATOR),
  );

  useAssistantAction(AssistantAction.Save, useCallback(() => setSaved(true), [setSaved]));
  useAssistantAction(
    AssistantAction.Unsave,
    useCallback(async (): Promise<AssistantActionResultType> => {
      // Un-saving drops a recipe out of a collection the user curated and may
      // not be able to find again, so it asks — unlike un-liking, which is a
      // number they can restore with one tap.
      if (!savedIds.has(recipeId)) return { ok: true, title: recipeName };
      onRequestUnsave();
      return { ok: true, awaiting: true, title: recipeName };
    }, [savedIds, recipeId, recipeName, onRequestUnsave]),
  );
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
        const asked = machineLower(arg ?? StepCursor.Next);
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
        // The text goes with the call. Writing the field and posting in the
        // same tick meant the post read the previous render's value — empty —
        // and reported success anyway, so the model announced a comment that
        // was never made.
        onPostComment(arg);
        return { ok: true, title: recipeName };
      },
      [onPostComment, recipeName],
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
        const index = rowAt(ingredients, arg);
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
        const index = rowAt(instructions, arg);
        if (index === null) return { ok: false, error: 'not_found' };
        onToggleStep(index);
        return {
          ok: true,
          n: {
            step: instructions.length,
            done: completedSteps.filter(Boolean).length + (completedSteps[index] === true ? -1 : 1),
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
      // The create screen is opened seeded FROM this recipe, rather than the
      // words being handed to the generator — which invented something
      // adjacent and called it the same recipe. What the user gets is a copy
      // they can then change, in the editor, where they can see it.
      router.push(RoutePaths.createRecipeFromRecipe(recipeId) as Href);
      // `awaiting`, because the copy is not made yet: the screen still has to
      // fetch the recipe and lay it in, and a chip saying it was copied before
      // that happened would be claiming something the user could look at and
      // find untrue.
      return { ok: true, awaiting: true, title: recipeName };
    }, [recipeId, recipeName]),
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
