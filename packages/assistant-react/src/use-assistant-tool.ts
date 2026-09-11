import { useEffect, useLayoutEffect, useRef } from 'react';
import type { AssistantTool } from '@live-assistant/core';
import { useAssistantController } from './use-assistant-controller';

/**
 * Registers a tool while the calling component is mounted.
 *
 * @remarks
 * - **For tools that belong to a screen** — "scroll this list", "fill this
 *   form" — whose handler needs that screen's state. App-wide tools belong in
 *   the registry the controller was built with.
 * - **The latest `run` is always the one called**, so an inline `run` with
 *   closures over current state does not re-register on every render. Only a
 *   new `definition` object does — keep it stable (declare it at module level).
 * - **The model must already know the tool.** Registering a handler does not
 *   declare it to a running session; declare every tool the model may call
 *   when the session is configured (for Gemini, at token-mint time).
 */
export function useAssistantTool(tool: AssistantTool): void {
  const controller = useAssistantController();
  const latest = useRef(tool);
  useLayoutEffect(() => {
    latest.current = tool;
  });
  const { definition } = tool;

  useEffect(
    () =>
      controller.tools.register({
        definition,
        run: (args, call) => latest.current.run(args, call),
      }),
    // A new definition object re-registers, so `definitions()` never goes stale;
    // pass a stable (module-level or memoised) definition to avoid churn.
    [controller, definition],
  );
}
