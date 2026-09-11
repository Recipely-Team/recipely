import { useContext } from 'react';
import type { AssistantController } from '@live-assistant/core';
import { AssistantContext } from './assistant-context';

/** The provided controller. Throws outside an `AssistantProvider`, where no hook here can work. */
export function useAssistantController(): AssistantController<unknown> {
  const controller = useContext(AssistantContext);
  if (controller === null) throw new Error('useAssistant* hooks must be used inside <AssistantProvider>.');
  return controller;
}
