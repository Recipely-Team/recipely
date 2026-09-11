import { useEffect, useRef } from 'react';
import type { AssistantTool } from '@live-assistant/core';
import { useAssistantController } from './use-assistant-controller';

/**
 * Registers a tool while the calling component is mounted.
 *
 * @remarks
 * - **For tools that belong to a screen** — "scroll this list", "fill this
 *   form" — whose handler needs that screen's state. App-wide tools belong in
 *   the registry the controller was built with.
 * - **The latest `run` is always the one called**, so an inline tool with
 *   closures over current state does not re-register on every render. Only a
 *   change of name re-registers.
 * - **The model must already know the tool.** Registering a handler does not
 *   declare it to a running session; declare every tool the model may call
 *   when the session is configured (for Gemini, at token-mint time).
 */
export function useAssistantTool(tool: AssistantTool): void {
  const controller = useAssistantController();
  const latest = useRef(tool);
  latest.current = tool;
  const name = tool.definition.name;

  useEffect(
    () =>
      controller.tools.register({
        definition: latest.current.definition,
        run: (args, call) => latest.current.run(args, call),
      }),
    [controller, name],
  );
}
