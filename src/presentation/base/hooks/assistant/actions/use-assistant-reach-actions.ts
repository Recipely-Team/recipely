import { useEffect } from 'react';
import { router, usePathname } from 'expo-router';
import type { Href } from 'expo-router';
import { ValueConstants } from '@core/constants';
import { AssistantActionError } from '@domain/assistant/actions/assistant-action-error';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import type { AssistantActionType } from '@domain/assistant/actions/assistant-action-type';
import { ASSISTANT_ACTION_HOMES } from '@presentation/base/hooks/assistant/args/targets/assistant-action-homes';
import { ASSISTANT_NAVIGATION_TARGETS } from '@presentation/base/hooks/assistant/args/targets/assistant-navigation-targets';
import { useStores } from '@presentation/bootstrap/use-stores';

const QUERY_START = '?';

/** How long a screen has to mount and register what it answers. */
const SCREEN_ARRIVAL_TIMEOUT_MS = 4_000;
/** How long to let a freshly-mounted screen finish fetching before asking again. */
const SETTLE_MS = 500;

/**
 * Carries an action to the screen that answers it.
 *
 * @remarks
 * - **Registered in the registry's fallback TIER, not its handler stack.** In
 *   the stack it was outermost only by accident of React's effect order —
 *   children flush before parents, so a screen mounting in the same commit as
 *   the root registered first and put this innermost, where it answered for a
 *   screen the user was already on. The tier makes "after everything else"
 *   true by construction.
 * - **It does not navigate to where the user already is.** Pushing the current
 *   screen stacks a second copy of it, and back stops leaving.
 * - **A reach that fails reports from where it got to.** It does not navigate
 *   back: the failure is known up to four seconds later, by which time the
 *   user has often moved themselves, and undoing a move they made is worse
 *   than leaving them on the screen they were taken to.
 * - **Every mapped action has exactly ONE registering screen, and must.**
 *   `waitForScreenHandler` cannot tell "my target arrived" from "something
 *   else answers this too", so an action registered by two screens would
 *   resolve the wait on the wrong one. `openDraft` is out of the map for this
 *   reason as well as its subject.
 * - **What it will NOT carry is in {@link ASSISTANT_ACTION_HOMES}** — anything
 *   whose subject would have to be invented to have somewhere to go.
 */
export const useAssistantReachActions = (): void => {
  const { assistantActionRegistry: registry } = useStores();
  const pathname = usePathname();

  useEffect(() => {
    // Guards against reach looping: one run per action per effect run.
    const reaching = new Set<string>();

    const undo = Object.entries(ASSISTANT_ACTION_HOMES).map(([action, screen]) => {
      const reach = async (arg?: string): Promise<AssistantActionResultType> => {
        // not_found (a screen declined), not unavailable_here (which invites a retry).
        if (reaching.has(action)) return { ok: false, error: AssistantActionError.NotFound };
        reaching.add(action);
        try {
          return await carry(arg);
        } finally {
          reaching.delete(action);
        }
      };

      const carry = async (arg?: string): Promise<AssistantActionResultType> => {
        const target = ASSISTANT_NAVIGATION_TARGETS[screen];
        const wasAt = pathname;

        // Compare without the query: usePathname never carries one.
        const alreadyThere = wasAt === target.split(QUERY_START)[ValueConstants.zero];
        if (!alreadyThere) router.navigate(target as Href);

        const arrived = await registry.waitForScreenHandler(
          action as AssistantActionType,
          SCREEN_ARRIVAL_TIMEOUT_MS,
        );
        if (!arrived) {
          // Report from where we are; a late back() could undo the user's own navigation.
          return { ok: false, error: AssistantActionError.ScreenDidNotOpen };
        }

        const first = await registry.run(action as AssistantActionType, arg);
        if (first.error !== AssistantActionError.NotReady) return first;

        // One retry after a settle, only on not_ready and only for side-effect-free reads.
        await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));
        return registry.run(action as AssistantActionType, arg);
      };

      return registry.registerFallback(action as AssistantActionType, reach);
    });

    return () => {
      for (const remove of undo) remove();
    };
  }, [registry, pathname]);
};
