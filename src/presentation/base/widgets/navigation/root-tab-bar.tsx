import { TabBar } from '@presentation/base/widgets/navigation/tab-bar';
import { SignInPromptSheet } from '@presentation/base/widgets/sheets/sign-in-prompt-sheet';
import { useGuestRouteGate } from '@presentation/base/hooks/auth/use-guest-route-gate';
import { useTabBarState } from '@presentation/navigation/use-tab-bar-state';

/**
 * The one and only mobile TabBar, hosted below the Stack so screen
 * transitions animate the content area above it.
 *
 * @remarks
 * - **Visibility and the active tab are pathname-driven**: on tab-less routes
 *   (detail pages, create flows, auth screens, …) the bar does not render at
 *   all — no collapse animation. The TabBar widget additionally hides itself on
 *   the web-shell breakpoint.
 * - **A guest's press on My Recipes, Diary or Profile opens the sign-in sheet**
 *   with what that tab holds, and the guest stays on their tab with the bar —
 *   it used to bounce them to a bare login form with no reason given.
 */
export const RootTabBar = (): React.JSX.Element | null => {
  const gate = useGuestRouteGate();
  const state = useTabBarState(gate.open);
  if (state === null) return null;
  return (
    <>
      <TabBar active={state.active} onChange={state.onChange} />
      <SignInPromptSheet {...gate.prompt} />
    </>
  );
};
