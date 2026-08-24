import { useCallback } from 'react';
import { router, type Href } from 'expo-router';
import { ASSISTANT_NAVIGATION_TARGETS, isAssistantScreenName } from '@presentation/base/hooks/assistant/args/assistant-navigation-targets';
import { rowAt } from '@presentation/base/hooks/assistant/args/row-at';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { RoutePaths } from '@presentation/base/constants/route-paths';
import { StoreStatus } from '@application/store/store-status';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { useStores } from '@presentation/bootstrap/use-stores';
import { CharConstants } from '@core/constants';

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
  const { assistantSessionStore, recipeListStore } = useStores();
  const stopVoice = assistantSessionStore((s) => s.stopVoice);

  useAssistantAction(
    AssistantAction.Navigate,
    useCallback(async (arg?: string): Promise<AssistantActionResultType> => {
      const name = arg ?? CharConstants.empty;
      if (!isAssistantScreenName(name)) return { ok: false, error: 'unknown_screen' };

      // `navigate`, not `push`: asked to go somewhere the user is already
      // standing, `push` stacks a second copy of it and back stops leaving.
      router.navigate(ASSISTANT_NAVIGATION_TARGETS[name] as Href);
      return { ok: true };
    }, []),
  );

  useAssistantAction(
    AssistantAction.Search,
    useCallback(async (arg?: string): Promise<AssistantActionResultType> => {
      if (arg === undefined || arg === CharConstants.empty) {
        return { ok: false, error: 'nothing_to_search' };
      }
      // Opening the feed WITH the query, rather than filling its store behind
      // its back: the field shows what was asked for and the user watches the
      // search happen, which is the whole point of an assistant that drives
      // the app instead of talking about it.
      // `navigate`, not `push`: the feed is usually the screen the user is
      // already on, and pushing it again stacks a second copy whose only
      // difference is the query.
      router.navigate(RoutePaths.recipesWithSearch(arg) as Href);
      return { ok: true };
    }, []),
  );

  useAssistantAction(
    AssistantAction.GenerateRecipe,
    useCallback(async (arg?: string): Promise<AssistantActionResultType> => {
      if (arg === undefined || arg === CharConstants.empty) {
        return { ok: false, error: 'empty_prompt' };
      }
      // Same shape, and the flagship case: the create screen opens with the
      // prompt in place and the generating view runs in front of the user. The
      // recipe TEXT never comes back through the voice session — the screen
      // writes it, and the model is told only that it worked.
      router.push(RoutePaths.createRecipeWithPrompt(arg) as Href);
      return { ok: true };
    }, []),
  );

  useAssistantAction(
    AssistantAction.OpenRecipe,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        if (arg === undefined || arg === CharConstants.empty) {
          return { ok: false, error: 'not_found' };
        }
        // Read at call time rather than subscribed: this hook lives in the
        // pill, which is mounted for the app's whole life, and subscribing
        // re-rendered it on every feed state change for a list only this one
        // handler ever looks at.
        const listState = recipeListStore.getState().state;
        const loaded = listState.status === StoreStatus.Loaded ? listState.recipes : [];

        // `rowAt` rather than a name search, because "the second one" is a
        // thing people say and it used to fall through to the id branch —
        // pushing `/recipes/2` and landing the user on an error screen.
        const at = rowAt(
          loaded.map((recipe) => recipe.name),
          arg,
        );
        const match = at === null ? undefined : loaded[at];

        // Only an argument that could BE an id is tried as one, so a reference
        // from a previous turn or a deep link still opens while a phrase that
        // matched nothing says so instead of opening a page that cannot exist.
        const id = match?.id ?? (looksLikeId(arg) ? arg : null);
        if (id === null) return { ok: false, error: 'not_found' };

        router.push(RoutePaths.recipeDetail(id) as Href);
        return { ok: true, ...(match !== undefined ? { title: match.name } : {}) };
      },
      [recipeListStore],
    ),
  );

  useAssistantAction(
    AssistantAction.GoBack,
    useCallback(async (): Promise<AssistantActionResultType> => {
      // The back gesture a thumb makes. `canGoBack` matters: popping an empty
      // stack on web leaves the app entirely, which is not what "go back"
      // means to anyone.
      if (!router.canGoBack()) return { ok: false, error: 'nothing_behind' };
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
