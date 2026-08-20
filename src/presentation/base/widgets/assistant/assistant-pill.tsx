import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { useTabBarState } from '@presentation/navigation/use-tab-bar-state';
import { ValueConstants } from '@core/constants';
import { AssistantMicOrb } from '@presentation/base/widgets/assistant/assistant-mic-orb';
import { AssistantStatus } from '@application/assistant/session/assistant-status';
import { AssistantPanel } from '@presentation/base/widgets/assistant/assistant-panel';
import { assistantStatusLabel } from '@presentation/base/widgets/assistant/assistant-status-label';
import { ThemedText } from '@presentation/base/widgets/text/themed-text';
import { useAssistantSession } from '@presentation/base/hooks/assistant/use-assistant-session';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { borderWidths, controlSizes, layoutSizes, radii, spacing, zIndices } from '@presentation/base/theme';
import { shadows } from '@presentation/base/theme/tokens/effects/shadows';
import { t } from '@presentation/i18n';

/**
 * The assistant's permanent handle, mounted once at the root.
 *
 * @remarks
 * - **A pill, not a sheet.** This assistant works by driving the app where the
 *   user can watch — "create a recipe" opens the create screen and fills the
 *   draft in. A modal takeover would hide the one thing worth seeing, so the
 *   control stays small and the screen underneath stays live.
 * - **Two targets, two jobs.** The orb starts and stops the microphone; the
 *   label opens the panel. Tapping the pill to talk and tapping it to read are
 *   different intentions, and one target for both meant a user who wanted to
 *   check the transcript hung up the call instead.
 * - **It sits above the timers bar** (see `zIndices`): the assistant can be
 *   speaking and acting on the app's behalf, so the control that stops it must
 *   never be the thing that is covered.
 * - **It clears the tab bar the same way the timers bar does.** Docked to the
 *   safe-area inset alone, it landed squarely on the third tab and swallowed
 *   taps meant for it. Routes without a tab bar — onboarding, auth, detail —
 *   must NOT reserve that height, or the pill floats away from the edge.
 */
export const AssistantPill = (): React.JSX.Element => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isWebShell } = useLayout();
  const { status, isPanelOpen, openPanel, toggleVoice } = useAssistantSession();

  const hasTabBar = useTabBarState() !== null && !isWebShell;
  const bottom =
    insets.bottom +
    (hasTabBar ? controlSizes.tabBar : ValueConstants.zero) +
    spacing.lg;

  return (
    <View style={[styles.dock, { bottom }]} pointerEvents="box-none">
      {isPanelOpen ? <AssistantPanel /> : null}

      <View
        style={[
          styles.pill,
          shadows.md,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Pressable
          onPress={toggleVoice}
          accessibilityRole="button"
          accessibilityLabel={status === AssistantStatus.Idle ? t().assistant.start : t().assistant.stop}
        >
          <AssistantMicOrb status={status} />
        </Pressable>

        <Pressable
          onPress={isPanelOpen ? undefined : openPanel}
          accessibilityRole="button"
          accessibilityLabel={t().assistant.open}
          style={styles.label}
        >
          <ThemedText variant="caption" muted numberOfLines={1}>
            {assistantStatusLabel(status)}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Both edges are pinned so the dock spans the screen: the panel's own
  // `width: '100%'` needs something to be a percentage OF, and without a left
  // edge the dock shrank to its widest child — the pill — leaving the panel
  // about a third of its cap. `box-none` keeps the empty span click-through,
  // and `flex-end` keeps the pill in its corner regardless.
  dock: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: zIndices.assistant,
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: radii.round,
    borderWidth: borderWidths.hairline,
  },
  label: { paddingRight: spacing.sm, maxWidth: layoutSizes.assistantLabelMaxWidth },
});
