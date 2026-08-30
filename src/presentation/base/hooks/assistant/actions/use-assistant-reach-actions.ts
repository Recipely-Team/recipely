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
    // `reach` asks the registry to run the action again, and the registry falls
    // back HERE when nothing in the stack answers — so a screen handler that
    // declines with `notMine` would send it round for ever.
    //
    // This set belongs to ONE run of the effect, and the effect re-runs on
    // navigation — so a reach that navigates is re-registered with a fresh,
    // empty set while still in flight. Recursion is bounded at two extra hops
    // rather than one, which terminates but is not the "one at a time" it
    // looks like. Anything that widens the deps weakens it further.
    const reaching = new Set<string>();

    const undo = Object.entries(ASSISTANT_ACTION_HOMES).map(([action, screen]) => {
      const reach = async (arg?: string): Promise<AssistantActionResultType> => {
        // `not_found`, not `unavailable_here`: a screen DID answer and declined
        // the subject. `unavailable_here` means "nothing here can do this, look
        // elsewhere", which invites exactly the second attempt this guard cuts.
        // This is the answer `run` would give with no fallback registered.
        if (reaching.has(action)) return { ok: false, error: 'not_found' };
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

        // Compared without the query: `usePathname()` never carries one, and
        // four entries in the targets map do (`?tab=`). A home pointing at one
        // would otherwise never match, and would navigate every time.
        const alreadyThere = wasAt === target.split(QUERY_START)[ValueConstants.zero];
        if (!alreadyThere) router.navigate(target as Href);

        const arrived = await registry.waitForScreenHandler(
          action as AssistantActionType,
          SCREEN_ARRIVAL_TIMEOUT_MS,
        );
        if (!arrived) {
          // Reported from where we are, rather than navigating back. `back()`
          // fires up to four seconds later — long enough that the user has
          // often navigated themselves, and it would undo THEIR move from a
          // screen they chose, with no visible cause. `navigate` also reuses
          // an existing route, so going back from one it popped to lands
          // somewhere they were never standing.
          return { ok: false, error: 'screen_did_not_open' };
        }

        const first = await registry.run(action as AssistantActionType, arg);
        if (first.error !== AssistantActionError.NotReady) return first;

        // One more, once the screen has had a moment to fetch. Only ever on
        // `not_ready`: inferring it from `not_found` would make everything
        // genuinely missing wait for a retry it can never pass, and this
        // re-runs the whole action, so nothing with a side effect may be
        // retried this way.
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
