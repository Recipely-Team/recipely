import { useEffect } from 'react';
import { router, usePathname } from 'expo-router';
import type { Href } from 'expo-router';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import type { AssistantActionType } from '@domain/assistant/actions/assistant-action-type';
import { ASSISTANT_ACTION_HOMES } from '@presentation/base/hooks/assistant/args/assistant-action-homes';
import { ASSISTANT_NAVIGATION_TARGETS } from '@presentation/base/hooks/assistant/args/assistant-navigation-targets';
import { useStores } from '@presentation/bootstrap/use-stores';

/** How long a screen has to mount and register what it answers. */
const SCREEN_ARRIVAL_TIMEOUT_MS = 4_000;
/** How long to let a freshly-mounted screen finish fetching before asking again. */
const SETTLE_MS = 500;
/**
 * Answers that mean "ask me again in a moment" rather than "no".
 *
 * A screen registers its handlers on mount, which is before it has its data —
 * so a handler reached the instant it appeared could answer that a draft is
 * missing, or that the cuisine list is unknown, about a screen still loading.
 */
const NOT_READY_YET: readonly string[] = ['taxonomy_not_loaded', 'not_found'];

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
 * - **A reach that fails leaves the user where they were.** Navigating and then
 *   reporting failure stranded them on a screen they never asked for, with an
 *   error chip; if a guard sent the push to sign-in it was worse, because the
 *   assistant is not offered there and vanished mid-action.
 * - **What it will NOT carry is in {@link ASSISTANT_ACTION_HOMES}** — anything
 *   whose subject would have to be invented to have somewhere to go.
 */
export const useAssistantReachActions = (): void => {
  const { assistantActionRegistry: registry } = useStores();
  const pathname = usePathname();

  useEffect(() => {
    // `reach` asks the registry to run the action again, and the registry falls
    // back HERE when nothing in the stack answers — so a screen handler that
    // declines with `notMine` would send it round for ever. One reach per
    // action at a time; the second is the recursion, not a retry.
    const reaching = new Set<string>();

    const undo = Object.entries(ASSISTANT_ACTION_HOMES).map(([action, screen]) => {
      const reach = async (arg?: string): Promise<AssistantActionResultType> => {
        if (reaching.has(action)) return { ok: false, error: 'unavailable_here' };
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

        if (wasAt !== target) router.navigate(target as Href);

        const arrived = await registry.waitForScreenHandler(
          action as AssistantActionType,
          SCREEN_ARRIVAL_TIMEOUT_MS,
        );
        if (!arrived) {
          if (wasAt !== target) router.back();
          return { ok: false, error: 'screen_did_not_open' };
        }

        const first = await registry.run(action as AssistantActionType, arg);
        if (first.ok || !NOT_READY_YET.includes(first.error ?? '')) return first;

        // One more, once the screen has had a moment to fetch. Telling someone
        // their draft is not there, on the screen that is still loading it, is
        // an answer that was never true.
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
