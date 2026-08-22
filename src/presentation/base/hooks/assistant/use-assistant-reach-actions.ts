import { useEffect } from 'react';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import type { AssistantActionType } from '@domain/assistant/actions/assistant-action-type';
import { ASSISTANT_ACTION_HOMES } from '@presentation/base/hooks/assistant/args/assistant-action-homes';
import { ASSISTANT_NAVIGATION_TARGETS } from '@presentation/base/hooks/assistant/args/assistant-navigation-targets';
import { useStores } from '@presentation/bootstrap/use-stores';

/** How long a pushed screen has to mount and register what it answers. */
const SCREEN_ARRIVAL_TIMEOUT_MS = 4_000;

/**
 * Lets an action reach the screen that answers it.
 *
 * @remarks
 * - **Registered once, at the root, so it sits OUTERMOST.** The registry walks
 *   each action's stack innermost-first, which means a screen that is already
 *   open always answers first and this only runs when nothing did — it never
 *   competes with the screen it would navigate to.
 * - **It delegates rather than re-running the action.** Calling `run` again
 *   would find this handler in the same stack and loop; asking the registry for
 *   the handler that is not this one cannot.
 * - **It waits for the screen to arrive.** Navigation is not instant and
 *   handlers register on mount, so pushing and immediately looking always found
 *   nothing.
 * - **A route that never arrives is reported, not retried.** An auth guard can
 *   send the push somewhere else entirely, and an assistant that says it filled
 *   a field it never reached is worse than one that says it could not.
 */
export const useAssistantReachActions = (): void => {
  const { assistantActionRegistry: registry } = useStores();

  useEffect(() => {
    const undo = Object.entries(ASSISTANT_ACTION_HOMES).map(([action, screen]) => {
      const handler = async (arg?: string): Promise<AssistantActionResultType> => {
        const target = ASSISTANT_NAVIGATION_TARGETS[screen];
        if (target === undefined) return { ok: false, error: 'unknown_screen' };

        router.push(target as Href);
        const arrived = await registry.waitForHandlerOtherThan(
          action as AssistantActionType,
          handler,
          SCREEN_ARRIVAL_TIMEOUT_MS,
        );
        if (!arrived) return { ok: false, error: 'screen_did_not_open' };

        const owner = registry.handlerOtherThan(action as AssistantActionType, handler);
        if (owner === null) return { ok: false, error: 'screen_did_not_open' };
        return owner(arg);
      };

      return registry.register(action as AssistantActionType, handler);
    });

    return () => {
      for (const remove of undo) remove();
    };
  }, [registry]);
};
