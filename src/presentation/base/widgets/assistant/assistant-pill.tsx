import { useEffect } from 'react';
import { assistantNoticeTone } from '@presentation/base/widgets/assistant/assistant-notice-tone';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AssistantFab } from '@presentation/base/widgets/assistant/views/assistant-fab';
import { AssistantMiniBar } from '@presentation/base/widgets/assistant/views/assistant-mini-bar';
import { AssistantOrbSurface } from '@presentation/base/widgets/assistant/views/assistant-orb-surface';
import { assistantNotice } from '@presentation/base/widgets/assistant/assistant-notice';
import { t } from '@presentation/i18n';
import { AssistantPanel } from '@presentation/base/widgets/assistant/views/assistant-panel';
import { assistantIsLive } from '@application/assistant/session/assistant-is-live';
import { AssistantView } from '@application/assistant/session/assistant-view';
import { useAssistantFloatingClearance } from '@presentation/base/hooks/assistant/use-assistant-floating-clearance';
import { useAssistantIsOffered } from '@presentation/base/hooks/assistant/use-assistant-is-offered';
import { useAssistantTimerActions } from '@presentation/base/hooks/assistant/actions/use-assistant-timer-actions';
import { useAssistantReachActions } from '@presentation/base/hooks/assistant/actions/use-assistant-reach-actions';
import { useAssistantGlobalActions } from '@presentation/base/hooks/assistant/actions/use-assistant-global-actions';
import { useAssistantReportActions } from '@presentation/base/hooks/assistant/actions/use-assistant-report-actions';
import { useAssistantScreenContext } from '@presentation/base/hooks/assistant/use-assistant-screen-context';
import { useOsAssistantInvocations } from '@presentation/base/hooks/assistant/os/use-os-assistant-invocations';
import { useOsAssistantCredentials } from '@presentation/base/hooks/assistant/os/use-os-assistant-credentials';
import { useOsEntityCatalogueSync } from '@presentation/base/hooks/assistant/os/use-os-entity-catalogue-sync';
import { useAssistantSession } from '@presentation/base/hooks/assistant/use-assistant-session';
import { useKeyboardHeight } from '@presentation/base/hooks/interaction/use-keyboard-height';
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
 * - **It registers the global actions**, the timer controls — which belong
 *   here because the timers bar is app-wide and its actions were not — and the
 *   fallback that carries an action to the screen that answers it, because it
 *   is the only component mounted for the whole app's life. Screen-scoped actions belong to their
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
  const {
    status,
    view,
    setView,
    level,
    isMuted,
    transcript,
    deniedReason,
    error,
    clearError,
    toggleMute,
    toggleVoice,
    sendText,
  } = useAssistantSession();

  // The pill lives for the whole app, so global actions and the screen line register here.
  useAssistantGlobalActions();
  useAssistantReachActions();
  useAssistantReportActions();
  useAssistantTimerActions();
  useAssistantScreenContext();
  // Last on purpose: effects run in order, so the global and reach tiers exist first.
  useOsAssistantInvocations();
  // Here, not on a screen: it must keep running through sign-out to clear the catalogue.
  useOsEntityCatalogueSync();
  // Same reason: withdrawing the token on sign-out must still run.
  useOsAssistantCredentials();

  const isOffered = useAssistantIsOffered();
  const live = assistantIsLive(status);
  const floatingClearance = useAssistantFloatingClearance();
  const hasTabBar = useTabBarState() !== null && !isWebShell;
  const edge = isExpanded ? spacing.xl : spacing.lg;
  const bottom =
    insets.bottom +
    (hasTabBar ? controlSizes.tabBar : ValueConstants.zero) +
    floatingClearance +
    edge;
  // isExpanded is width, so a tablet takes this branch with a software keyboard: lift the dock.
  const keyboardHeight = useKeyboardHeight();
  const dockBottom = bottom + keyboardHeight;

  // Hiding the controls must not leave a session running (e.g. on an expired-session redirect).
  useEffect(() => {
    if (!isOffered && live) void toggleVoice();
  }, [isOffered, live, toggleVoice]);

  // Below every hook, so the order never changes with the route.
  if (!isOffered) return null;

  // Minimise keeps a running session in the mini bar; close only when nothing is running.
  const minimize = (): void => {
    setView(live ? AssistantView.Mini : AssistantView.Closed);
  };

  const end = (): void => {
    if (live) void toggleVoice();
    setView(AssistantView.Closed);
  };

  /**
   * Opening the assistant starts it listening.
   *
   * Tapping the launcher used only to raise the panel, so speaking required a
   * second, separate press — "ilk tıkladığımızda direk başlamıyor". The tap on
   * a microphone IS the request to talk; making the user confirm it once the
   * panel was already up was a step that carried no decision.
   *
   * Guarded on `live` so re-opening a session that is already running (from the
   * mini bar, or a second tap that raced the first) does not hang it up.
   */
  const open = (): void => {
    setView(AssistantView.Open);
    if (!live) void toggleVoice();
  };

  // On a phone the orb is the only form, so Mini and Open are the same surface.
  const isOpen = view === AssistantView.Open || view === AssistantView.Mini;

  if (!isExpanded) {
    return (
      <>
        {isOpen ? (
          <AssistantOrbSurface
            status={status}
            level={level}
            isMuted={isMuted}
            transcript={transcript}
            notice={error !== null ? t().assistant.requestFailed : assistantNotice(status, deniedReason)}
            noticeTone={assistantNoticeTone(error !== null, deniedReason)}
            onToggleVoice={toggleVoice}
            onToggleMute={toggleMute}
            onSend={(text) => {
              clearError();
              sendText(text);
            }}
            onClose={end}
            restingBottom={bottom}
          />
        ) : null}

        {view === AssistantView.Closed ? (
          <View style={[styles.dock, { bottom }]} pointerEvents="box-none">
            <AssistantFab status={status} onOpen={open} />
          </View>
        ) : null}
      </>
    );
  }

  return (
    <View style={[styles.dock, styles.dockWide, { bottom: dockBottom }]} pointerEvents="box-none">
      {view === AssistantView.Open ? (
        <AssistantPanel onClose={end} onMinimize={minimize} bottomOffset={dockBottom} />
      ) : null}

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
        <AssistantFab status={status} onOpen={open} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  // Both edges pinned so the panel's full width has a span; box-none keeps it click-through.
  dock: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: zIndices.assistant,
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  dockWide: { left: 'auto', right: spacing.xl },
});
