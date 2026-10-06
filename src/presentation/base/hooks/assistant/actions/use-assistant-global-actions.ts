import { useCallback } from 'react';
import { router, type Href } from 'expo-router';
import { isAssistantExternalName } from '@presentation/base/hooks/assistant/args/targets/assistant-external-targets';
import { ASSISTANT_NAVIGATION_TARGETS, resolveAssistantScreenName } from '@presentation/base/hooks/assistant/args/targets/assistant-navigation-targets';
import { rowAt, rowNumberOf } from '@presentation/base/hooks/assistant/args/resolving/row-at';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { waitForRecipeListQuery } from '@application/recipes/list/wait-for-recipe-list-query';
import { RoutePaths } from '@presentation/base/constants/route-paths';
import { StoreStatus } from '@application/store/store-status';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { useStores } from '@presentation/bootstrap/use-stores';
import { CharConstants } from '@core/constants';
import { AssistantActionError } from '@domain/assistant/actions/assistant-action-error';

/**
 * The actions that work from anywhere, registered once beside the pill.
 *
 * @remarks
 * - **These are what make it an assistant rather than a chatbot.** Moving
 *   between screens, searching and opening a recipe are the ones a user is
 *   watching happen; everything else the assistant does is performed by the
 *   screen it just opened.
 * - **`openRecipe` accepts a name, because a person does.** The model is told
 *   what is on screen, not a table of ids, so it passes back the words the user
 *   said. An exact id still works — an argument that matches nothing in the
 *   loaded feed is tried as one, which is what makes the action usable from a
 *   deep link or a previous turn.
 * - **Failures name themselves.** `not_found` and `nothing_to_search` let the
 *   model say something useful out loud instead of falling silent; that is the
 *   whole reason handlers answer with a shape rather than a boolean.
 */
/**
 * Whether a phrase could be a recipe id rather than something the user said.
 *
 * Ids are opaque and long; "2" and "the chicken one" are not. Trying anything
 * as an id pushed a detail route for a recipe that cannot exist, which is a
 * worse answer than saying it was not found.
 */
const ID_MIN_LENGTH = 12;

const looksLikeId = (arg: string): boolean =>
  arg.length >= ID_MIN_LENGTH && !arg.includes(CharConstants.space);

export const useAssistantGlobalActions = (): void => {
  const { assistantActionRegistry: registry, assistantSessionStore, recipeListStore } = useStores();
  const stopVoice = assistantSessionStore((s) => s.stopVoice);

  useAssistantAction(
    AssistantAction.ReadScreen,
    useCallback(async (): Promise<AssistantActionResultType> => {
      // Global: the reading comes from the describer stack, so it always reads the innermost screen.
      return { ok: true, title: registry.screenReading };
    }, [registry]),
  );

  useAssistantAction(
    AssistantAction.Navigate,
    useCallback(async (arg?: string): Promise<AssistantActionResultType> => {
      const name = arg ?? CharConstants.empty;
      // Web pages are refused on purpose: opening one ends the voice session.
      if (isAssistantExternalName(name)) {
        return { ok: false, error: AssistantActionError.LeavesTheApp };
      }
      const screen = resolveAssistantScreenName(name);
      if (screen === null) return { ok: false, error: AssistantActionError.UnknownScreen };

      router.navigate(ASSISTANT_NAVIGATION_TARGETS[screen] as Href);
      return { ok: true };
    }, []),
  );

  useAssistantAction(
    AssistantAction.Search,
    useCallback(async (arg?: string): Promise<AssistantActionResultType> => {
      if (arg === undefined || arg === CharConstants.empty) {
        return { ok: false, error: AssistantActionError.NothingToSearch };
      }
      // navigate, not push: the feed is usually already open, so push would stack a copy.
      router.navigate(RoutePaths.recipesWithSearch(arg) as Href);
      // Wait for rows: the registry reads the screen as soon as this returns.
      await waitForRecipeListQuery(recipeListStore, arg);
      return { ok: true };
    }, [recipeListStore]),
  );

  useAssistantAction(
    AssistantAction.GenerateRecipe,
    useCallback(async (arg?: string): Promise<AssistantActionResultType> => {
      if (arg === undefined || arg === CharConstants.empty) {
        return { ok: false, error: AssistantActionError.EmptyPrompt };
      }
      router.push(RoutePaths.createRecipeWithPrompt(arg) as Href);
      return { ok: true };
    }, []),
  );

  useAssistantAction(
    AssistantAction.OpenRecipe,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        if (arg === undefined || arg === CharConstants.empty) {
          return { ok: false, error: AssistantActionError.NotFound };
        }
        // Read at call time: subscribing would re-render the always-mounted pill on every feed change.
        const rowsNow = (): { id: string; name: string }[] => {
          const listState = recipeListStore.getState().state;
          return listState.status === StoreStatus.Loaded ? [...listState.recipes] : [];
        };

        // A position ("the second one") is about rows on screen, not an id.
        const pick = (rows: { id: string; name: string }[]): { id: string; name: string } | undefined => {
          const at = rowAt(
            rows.map((recipe) => recipe.name),
            arg,
          );
          return at === null ? undefined : rows[at];
        };

        let match = pick(rowsNow());
        // An unknown name is searched for, never guessed from an id remembered from an earlier turn.
        if (match === undefined && !looksLikeId(arg) && rowNumberOf(arg) === null) {
          router.navigate(RoutePaths.recipesWithSearch(arg) as Href);
          await waitForRecipeListQuery(recipeListStore, arg);
          match = pick(rowsNow());
        }

        // Only something shaped like an id is opened as one.
        const id = match?.id ?? (looksLikeId(arg) ? arg : null);
        if (id === null) return { ok: false, error: AssistantActionError.NotFound };

        router.push(RoutePaths.recipeDetail(id) as Href);
        return { ok: true, ...(match !== undefined ? { title: match.name } : {}) };
      },
      [recipeListStore],
    ),
  );

  useAssistantAction(
    AssistantAction.GoBack,
    useCallback(async (): Promise<AssistantActionResultType> => {
      // canGoBack: popping an empty stack on web leaves the app.
      if (!router.canGoBack()) return { ok: false, error: AssistantActionError.NothingBehind };
      router.back();
      return { ok: true };
    }, []),
  );

  useAssistantAction(
    AssistantAction.Stop,
    useCallback(async (): Promise<AssistantActionResultType> => {
      await stopVoice();
      return { ok: true };
    }, [stopVoice]),
  );
};
