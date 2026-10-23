import { useRef } from 'react';
import { useStore } from 'zustand';
import { router, type Href } from 'expo-router';
import { AssistantAction, type AssistantActionType } from '@domain/assistant/actions/assistant-action-type';
import { AssistantActionError } from '@domain/assistant/actions/assistant-action-error';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import type { AssistantRecipeRow } from '@presentation/base/hooks/assistant/args/resolving/assistant-recipe-row';
import { rowAt } from '@presentation/base/hooks/assistant/args/resolving/row-at';
import { RoutePaths } from '@presentation/base/constants';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { useSaveRecipe } from '@presentation/base/hooks/recipes/use-save-recipe';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useIsSignedIn } from '@presentation/base/hooks/auth/use-is-signed-in';

/** How long the recipe screen has to mount and register what it answers. */
const SCREEN_ARRIVAL_TIMEOUT_MS = 4_000;

/**
 * What the assistant can do to a recipe the user is LOOKING at in a list.
 *
 * @remarks
 * - **The subject is a row, so it takes an argument.** On the recipe screen
 *   "save it" needs no name because there is only one recipe; in a list the
 *   user says "save the baklava" or "save the second one", and `rowAt` answers
 *   both. The screen line now carries those rows numbered, so what the model
 *   passes back is what this resolves.
 * - **Saving and liking both happen here.** Every card in these lists carries a
 *   bookmark AND a heart — `RecipeCard` renders one and animates it — so both
 *   are changes the user WATCHES. Liking used to open the recipe first, on the
 *   grounds that a card had no like control to show the result on. That stopped
 *   being true, and the detour became the bug: "beğen bunu" on the feed walked
 *   the user off the screen they were reading.
 * - **Un-saving and deleting travel for a second reason**: both are in
 *   `CONFIRMED_ACTIONS`, and the sheet that asks lives on the recipe screen. A
 *   recipe the user is about to destroy is also one they should be looking at
 *   while they answer.
 * - **Declining, not failing, when the row is not here.** A name that matches
 *   nothing in this list may still match the screen underneath, or be handled
 *   by the recipe screen the user has open; `notMine` passes the call on
 *   instead of ending it.
 */
export const useAssistantListRecipeActions = (rows: readonly AssistantRecipeRow[]): void => {
  const { assistantActionRegistry: registry, likesStore, savedRecipesStore } = useStores();
  const setLikedInStore = useStore(likesStore, (s) => s.setLiked);
  const favourites = useSaveRecipe();
  const isSignedIn = useIsSignedIn();
  // One hop at a time, so a failed navigation cannot loop back here.
  const travelling = useRef(false);

  const find = (arg?: string): AssistantRecipeRow | null => {
    const at = rowAt(rows.map((row) => row.name), arg);
    return at === null ? null : (rows[at] ?? null);
  };

  const save = async (arg?: string): Promise<AssistantActionResultType> => {
    if (!isSignedIn) return { ok: false, error: AssistantActionError.SignedOut };
    const row = find(arg);
    if (row === null) return { ok: false, notMine: true };
    // Already saved is success, not a toggle.
    if (!savedRecipesStore.getState().savedIds.has(row.id)) await favourites.toggleSave(row.id);
    return { ok: true, title: row.name };
  };

  /** Opens the recipe and lets its own screen answer, so the change is seen. */
  const runOnRecipe = async (arg: string | undefined, action: AssistantActionType): Promise<AssistantActionResultType> => {
    if (travelling.current) return { ok: false, error: AssistantActionError.NotFound };
    const row = find(arg);
    if (row === null) return { ok: false, notMine: true };

    travelling.current = true;
    const travel = async (): Promise<AssistantActionResultType> => {
      router.push(RoutePaths.recipeDetail(row.id) as Href);
      const hasArrived = await registry.waitForScreenHandler(action, SCREEN_ARRIVAL_TIMEOUT_MS);
      if (!hasArrived) return { ok: false, error: AssistantActionError.ScreenDidNotOpen };
      return registry.run(action, arg);
    };
    return travel().finally(() => {
      travelling.current = false;
    });
  };

  const setLiked = async (arg: string | undefined, isWanted: boolean): Promise<AssistantActionResultType> => {
    if (!isSignedIn) return { ok: false, error: AssistantActionError.SignedOut };
    const row = find(arg);
    if (row === null) return { ok: false, notMine: true };

    // The store reports when the row's like state is unknown.
    const result = await setLikedInStore(row.id, isWanted);
    return result.ok ? { ok: true, title: row.name } : { ok: false, error: AssistantActionError.NotReady };
  };

  useAssistantAction(AssistantAction.Save, save);
  useAssistantAction(AssistantAction.Like, (arg?: string) => setLiked(arg, true));
  useAssistantAction(AssistantAction.Unlike, (arg?: string) => setLiked(arg, false));

  // Confirmed actions travel to the recipe screen, where the confirm sheet lives.
  useAssistantAction(AssistantAction.Unsave, async (arg?: string): Promise<AssistantActionResultType> => {
    const answered = await runOnRecipe(arg, AssistantAction.Unsave);
    return answered.ok ? { ...answered, awaiting: true } : answered;
  });
  useAssistantAction(AssistantAction.DeleteRecipe, async (arg?: string): Promise<AssistantActionResultType> => {
    const answered = await runOnRecipe(arg, AssistantAction.DeleteRecipe);
    return answered.ok ? { ...answered, awaiting: true } : answered;
  });
};
