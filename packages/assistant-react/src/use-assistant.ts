import { useMemo, useSyncExternalStore } from 'react';
import type { AssistantState } from '@live-assistant/core';
import { useAssistantController } from './use-assistant-controller';

/**
 * The session state and its controls, for a component that shows the
 * assistant's status and buttons.
 *
 * Re-renders when any state field changes (a few times a turn). A component
 * that needs one field should use `useAssistantState`; one that animates with
 * the voice should read levels with `useLevelFrames`, never state.
 */
export function useAssistant() {
  const controller = useAssistantController();
  const state: AssistantState = useSyncExternalStore(controller.subscribe, controller.getState, controller.getState);
  const controls = useMemo(
    () => ({
      start: () => controller.start(),
      stop: () => controller.stop(),
      toggleMute: () => controller.toggleMute(),
      setMuted: (isMuted: boolean) => controller.setMuted(isMuted),
      sendText: (text: string) => controller.sendText(text),
      clearTranscript: () => controller.clearTranscript(),
    }),
    [controller],
  );
  return { ...state, ...controls };
}
