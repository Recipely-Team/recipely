import { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { AssistantStatus } from '@live-assistant/core';
import type { AssistantState } from '@live-assistant/core';
import { useAssistantController, useAssistantState } from '@live-assistant/react';
import { AssistantOrb } from './orb/assistant-orb';
import { AssistantPanel } from './panel/assistant-panel';
import type { AssistantPanelProps } from './panel/assistant-panel';
import { StatusLine } from './panel/status-line';
import { mergeStrings } from './strings/merge-strings';
import type { AssistantStringsOverride } from './strings/merge-strings';
import { WidgetStringsContext } from './strings/widget-strings-context';
import { mergeTheme } from './theme/merge-theme';
import type { AssistantThemeOverride } from './theme/merge-theme';
import { WidgetThemeContext } from './theme/widget-theme-context';

export const WidgetPlacement = {
  BottomRight: 'bottom-right',
  BottomLeft: 'bottom-left',
  Inline: 'inline',
} as const;

export interface AssistantWidgetProps extends AssistantPanelProps {
  readonly theme?: AssistantThemeOverride;
  readonly strings?: AssistantStringsOverride;
  /** Floating in a bottom corner (default right), or laid out where it is rendered. */
  readonly placement?: (typeof WidgetPlacement)[keyof typeof WidgetPlacement];
}

const selectStatus = (state: AssistantState) => state.status;
const PANEL_WIDTH = 340;
const EDGE = 16;
const PANEL_SHARE = '100%';

/**
 * The drop-in assistant: an orb that starts a session, and a panel with the
 * conversation while one is live.
 *
 * @remarks
 * - **Built only on `@live-assistant/react`'s public hooks.** Anything it draws
 *   an app can draw differently with the same hooks; `renderMessage`,
 *   `renderTool`, `theme` and `strings` cover the common changes without that.
 * - **Every word comes from `strings`.** The defaults are English; pass the
 *   user's language. Nothing here is hard-coded copy.
 * - **Render it inside `AssistantProvider`, once, near the root**, so it
 *   floats over every screen and survives navigation.
 */
export function AssistantWidget({ theme, strings, placement = WidgetPlacement.BottomRight, ...panel }: AssistantWidgetProps) {
  const controller = useAssistantController();
  const status = useAssistantState(selectStatus);
  const mergedTheme = useMemo(() => mergeTheme(theme), [theme]);
  const mergedStrings = useMemo(() => mergeStrings(strings), [strings]);
  const isIdle = status === AssistantStatus.Idle;
  const { width: windowWidth } = useWindowDimensions();
  // A fixed width, so the panel does not jump as the first words arrive; never wider than the screen allows.
  const width = Math.min(PANEL_WIDTH, windowWidth - EDGE * 2);
  const toggle = (): void => void (isIdle ? controller.start() : controller.stop());

  const floating =
    placement === WidgetPlacement.Inline
      ? null
      : [styles.floating, placement === WidgetPlacement.BottomLeft ? styles.left : styles.right];

  return (
    <WidgetThemeContext.Provider value={mergedTheme}>
      <WidgetStringsContext.Provider value={mergedStrings}>
        <View
          style={[
            styles.stack,
            floating,
            { gap: mergedTheme.spacing, width: placement === WidgetPlacement.Inline ? undefined : width },
            placement === WidgetPlacement.BottomLeft ? styles.alignStart : styles.alignEnd,
          ]}
        >
          {isIdle ? (
            <StatusLine />
          ) : (
            <View style={styles.panel}>
              <AssistantPanel {...panel} />
            </View>
          )}
          <AssistantOrb onPress={toggle} />
        </View>
      </WidgetStringsContext.Provider>
    </WidgetThemeContext.Provider>
  );
}

const styles = StyleSheet.create({
  stack: { maxWidth: PANEL_WIDTH, pointerEvents: 'box-none' },
  floating: { position: 'absolute', bottom: EDGE },
  right: { right: EDGE },
  left: { left: EDGE },
  alignEnd: { alignItems: 'flex-end' },
  alignStart: { alignItems: 'flex-start' },
  panel: { width: PANEL_SHARE },
});
