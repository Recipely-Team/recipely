import type { Href, Router } from 'expo-router';

/**
 * Lands on `href` with the auth flow discarded rather than parked underneath.
 *
 * `replace` only swaps the TOP entry, which is not enough once the user reached
 * the auth screen from somewhere else. Continuing without an account from the
 * welcome carousel goes `/onboarding` → push `/login` → replace `/recipes`, and
 * that leaves `[onboarding, recipes]`: one back gesture put a guest who had
 * just chosen to skip signing in right back on the screen asking them to sign
 * in. Coming the other way — a guest on the feed tapping a gated action — it
 * left `[recipes, recipes]`, a back gesture that appeared to do nothing.
 *
 * Popping to the root first collapses whatever the auth detour stacked up, so
 * `replace` then swaps the one remaining entry and the app is the only thing
 * on the stack. `canDismiss` guards the case where there is nothing to pop
 * (entering straight from the launch redirect), which `dismissAll` treats as
 * an error rather than a no-op.
 */
export const enterApp = (router: Router, href: Href): void => {
  if (router.canDismiss()) router.dismissAll();
  router.replace(href);
};
