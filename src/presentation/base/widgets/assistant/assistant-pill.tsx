import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AssistantFab } from '@presentation/base/widgets/assistant/views/assistant-fab';
import { AssistantMiniBar } from '@presentation/base/widgets/assistant/views/assistant-mini-bar';
import { AssistantPanel } from '@presentation/base/widgets/assistant/views/assistant-panel';
import { assistantIsLive } from '@application/assistant/session/assistant-is-live';
import { AssistantView } from '@application/assistant/session/assistant-view';
import { useAssistantFloatingClearance } from '@presentation/base/hooks/assistant/use-assistant-floating-clearance';
import { useAssistantIsOffered } from '@presentation/base/hooks/assistant/use-assistant-is-offered';
import { useAssistantReachActions } from '@presentation/base/hooks/assistant/use-assistant-reach-actions';
import { useAssistantGlobalActions } from '@presentation/base/hooks/assistant/use-assistant-global-actions';
import { useAssistantScreenContext } from '@presentation/base/hooks/assistant/use-assistant-screen-context';
import { useAssistantSession } from '@presentation/base/hooks/assistant/use-assistant-session';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { useTabBarState } from '@presentation/navigation/use-tab-bar-state';
import { controlSizes, spacing, zIndices } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

/**
 * The assistant's permanent handle, mounted once at the root.
 *
 * @remarks
 * - **Three states, one corner.** Closed is a chef waiting; mini is a live
 *   session out of the way; open is the conversation. Minimising a live session
 *   goes to mini rather than closing it, because hanging up is a decision and
 *   should never be what "get this off my screen" does.
 * - **It sits above the timers bar** (see `zIndices`): the assistant can be
 *   speaking and acting on the app's behalf, so the control that stops it must
 *   never be the thing that is covered.
 * - **It registers the global actions**, and the fallback that carries an
 *   action to the screen that answers it, because it is the only component
 *   mounted for the whole app's life. Screen-scoped actions belong to their
 *   screens, which is what makes "save it" mean the recipe in front of you.
 * - **It also clears the screen's own floating control.** The feed's filter
 *   button docks to the same corner at the same height, and the chef landed
 *   squarely on top of it — covering the one control that screen exists to
 *   offer. See `useAssistantFloatingClearance`.
 * - **It clears the tab bar the same way the timers bar does.** Docked to the
 *   safe-area inset alone, it landed squarely on the third tab and swallowed
 *   taps meant for it. Routes without a tab bar — onboarding, auth, detail —
 *   must NOT reserve that height, or the control floats away from the edge.
 * - **Leaving those routes is not the same as hiding.** A session running when
 *   an expired token redirects to sign-in would keep its microphone open with
 *   no control left on screen to close it, so the route change ends it.
 * - **It is absent where it could only get in the way.** Signing in,
 *   registering and recovering a password are screens where every action is
 *   the user's own; the assistant cannot type a password and must not appear
 *   to try. See `useAssistantIsOffered`.
 * - **Voice being unavailable does not remove the assistant.** Both refusals the
 *   backend can send — this user's minutes, everyone's minutes — close voice and
 *   leave typing working, so hiding the launcher would take away the half that
 *   still runs. The panel says which limit was reached instead.
 */
export const AssistantPill = (): React.JSX.Element | null => {
  const insets = useSafeAreaInsets();
  const { isWebShell, isExpanded } = useLayout();
  const { status, view, setView, level, isMuted, toggleMute, toggleVoice } = useAssistantSession();

  // The pill is the one component mounted for the whole app's life, so the
  // actions that work from anywhere — and the screen line every tool result
  // carries — are registered from here.
  useAssistantGlobalActions();
  useAssistantReachActions();
  useAssistantScreenContext();

  const isOffered = useAssistantIsOffered();
  const live = assistantIsLive(status);
  const floatingClearance = useAssistantFloatingClearance();
  const hasTabBar = useTabBarState() !== null && !isWebShell;
  const bottom =
    insets.bottom +
    (hasTabBar ? controlSizes.tabBar : ValueConstants.zero) +
    floatingClearance +
    spacing.lg;

  // Hiding the controls does not stop a session. Landing on the sign-in screen
  // mid-conversation — an expired token redirects there — would otherwise leave
  // the microphone open with nothing on screen able to close it.
  useEffect(() => {
    if (!isOffered && live) void toggleVoice();
  }, [isOffered, live, toggleVoice]);

  // Below every hook, so the order never changes with the route.
  if (!isOffered) return null;

  // Hanging up is a decision. Putting the panel away is not, so it keeps a
  // running session alive in the mini bar and only closes outright when there
  // is nothing left to keep.
  const minimize = (): void => {
    setView(live ? AssistantView.Mini : AssistantView.Closed);
  };

  const end = (): void => {
    if (live) void toggleVoice();
    setView(AssistantView.Closed);
  };

  return (
    <View
      style={[styles.dock, { bottom }, isExpanded ? styles.dockWide : null]}
      pointerEvents="box-none"
    >
      {view === AssistantView.Open ? <AssistantPanel onClose={end} onMinimize={minimize} bottomOffset={bottom} /> : null}

      {view === AssistantView.Mini ? (
        <AssistantMiniBar
          status={status}
          level={level}
          isMuted={isMuted}
          onExpand={() => setView(AssistantView.Open)}
          onToggleMute={toggleMute}
          onEnd={end}
        />
      ) : null}

      {view === AssistantView.Closed ? (
        <AssistantFab status={status} onOpen={() => setView(AssistantView.Open)} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  // Both edges are pinned so the dock spans the screen: the panel's own
  // `width: '100%'` needs something to be a percentage OF, and without a left
  // edge the dock shrank to its widest child, leaving the panel about a third
  // of its cap. `box-none` keeps the empty span click-through, and `flex-end`
  // keeps the control in its corner regardless.
  dock: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: zIndices.assistant,
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  // On a wide window the panel is a docked side column, so the dock stops
  // spanning and lets its child size itself.
  dockWide: { left: 'auto' },
});
