import { useCallback, useSyncExternalStore } from 'react';
import type { AssistantState } from '@live-assistant/core';
import { useAssistantController } from './use-assistant-controller';

/**
 * One slice of the session state; re-renders only when that slice changes.
 *
 * The selector must return a primitive or a part of the state as it is
 * (`s => s.status`, `s => s.transcript`) — a new object built on every call
 * would never compare equal, and the component would re-render forever.
 */
export function useAssistantState<Selected>(selector: (state: AssistantState) => Selected): Selected {
  const controller = useAssistantController();
  const read = useCallback(() => selector(controller.getState()), [controller, selector]);
  return useSyncExternalStore(controller.subscribe, read, read);
}
