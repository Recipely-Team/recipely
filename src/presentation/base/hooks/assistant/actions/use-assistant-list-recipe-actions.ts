import { useCallback, useRef } from 'react';
import { router, type Href } from 'expo-router';
import { AssistantAction, type AssistantActionType } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import type { AssistantRecipeRow } from '@presentation/base/hooks/assistant/args/assistant-recipe-row';
import { rowAt } from '@presentation/base/hooks/assistant/args/row-at';
import { RoutePaths } from '@presentation/base/constants';
import { StoreStatus } from '@application/store/store-status';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { useSaveRecipe } from '@presentation/base/hooks/recipes/use-save-recipe';
import { useStores } from '@presentation/bootstrap/use-stores';

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
 * - **Saving happens here; everything else happens on the recipe.** Every card
 *   in these lists carries a bookmark, so a save is a change the user WATCHES.
 *   There is no like control on a card — liking from the list would be a
 *   success the screen could not show, which is the failure mode this codebase
 *   has already been bitten by: a handler answering `ok` is not the same as the
 *   work having visibly happened. So a like opens the recipe and likes it
 *   there, in front of the user, exactly as their thumb would have.
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
  const { assistantActionRegistry: registry, authStore } = useStores();
  const favourites = useSaveRecipe();
  const authState = authStore((s) => s.state);
  // Held in a ref, and read when a handler runs. A list re-renders on every
  // fetch, filter and save; depended on directly, each of those would
  // unregister and re-register five actions — and a call arriving mid-swap
  // would find the key empty and be told the screen cannot do this.
  const latest = useRef({ rows, favourites, isSignedIn: authState.status === StoreStatus.Authenticated });
  latest.current = { rows, favourites, isSignedIn: authState.status === StoreStatus.Authenticated };
  // One hop at a time. `runOnRecipe` asks the registry to run the same action
  // again once the recipe screen is up; that screen's handler is innermost and
  // answers first, but a navigation that failed to produce one would otherwise
  // come back round to this handler.
  const travelling = useRef(false);

  const find = useCallback((arg?: string): AssistantRecipeRow | null => {
    const { rows: current } = latest.current;
    const at = rowAt(current.map((row) => row.name), arg);
    return at === null ? null : (current[at] ?? null);
  }, []);

  const save = useCallback(
    async (arg?: string): Promise<AssistantActionResultType> => {
      const { favourites: saved, isSignedIn } = latest.current;
      if (!isSignedIn) return { ok: false, error: 'signed_out' };
      const row = find(arg);
      if (row === null) return { ok: false, notMine: true };
      // Already saved is a success, not a toggle: the user asked for an
      // outcome, and toggling here would remove the very thing they asked to
      // keep.
      if (!saved.isSaved(row.id)) await saved.toggleSave(row.id);
      return { ok: true, title: row.name };
    },
    [find],
  );

  /** Opens the recipe and lets its own screen answer, so the change is seen. */
  const runOnRecipe = useCallback(
    async (arg: string | undefined, action: AssistantActionType): Promise<AssistantActionResultType> => {
      if (travelling.current) return { ok: false, error: 'not_found' };
      const row = find(arg);
      if (row === null) return { ok: false, notMine: true };

      travelling.current = true;
      try {
        router.push(RoutePaths.recipeDetail(row.id) as Href);
        const arrived = await registry.waitForScreenHandler(action, SCREEN_ARRIVAL_TIMEOUT_MS);
        if (!arrived) return { ok: false, error: 'screen_did_not_open' };
        return await registry.run(action, arg);
      } finally {
        travelling.current = false;
      }
    },
    [find, registry],
  );

  useAssistantAction(AssistantAction.Save, save);
  useAssistantAction(
    AssistantAction.Like,
    useCallback((arg?: string) => runOnRecipe(arg, AssistantAction.Like), [runOnRecipe]),
  );
  useAssistantAction(
    AssistantAction.Unlike,
    useCallback((arg?: string) => runOnRecipe(arg, AssistantAction.Unlike), [runOnRecipe]),
  );

  // Both of these are in `CONFIRMED_ACTIONS`, and the sheet that asks lives on
  // the recipe screen — so they travel there and report that the app is
  // waiting on the user rather than that anything has happened. Un-saving is
  // on that list for a reason worth restating: it drops a recipe out of a
  // collection the user curated and may not find again, and a card's bookmark
  // being one tap does not make a spoken "remove it" as easy to take back.
  useAssistantAction(
    AssistantAction.Unsave,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const answered = await runOnRecipe(arg, AssistantAction.Unsave);
        return answered.ok ? { ...answered, awaiting: true } : answered;
      },
      [runOnRecipe],
    ),
  );
  useAssistantAction(
    AssistantAction.DeleteRecipe,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const answered = await runOnRecipe(arg, AssistantAction.DeleteRecipe);
        return answered.ok ? { ...answered, awaiting: true } : answered;
      },
      [runOnRecipe],
    ),
  );
};
