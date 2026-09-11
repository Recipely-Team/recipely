import type { ReactNode } from 'react';
import type { AssistantController } from '@live-assistant/core';
import { AssistantContext } from './assistant-context';

export interface AssistantProviderProps<Connection> {
  readonly controller: AssistantController<Connection>;
  readonly children?: ReactNode;
}

/**
 * Makes one assistant available to every hook below it.
 *
 * The app builds the controller (so it owns its lifetime and can reach it
 * from outside React — a push notification, a deep link) and hands it here.
 * Create it once, outside render, or in a `useState` initialiser.
 */
export function AssistantProvider<Connection>({ controller, children }: AssistantProviderProps<Connection>) {
  return (
    <AssistantContext.Provider value={controller as AssistantController<unknown>}>{children}</AssistantContext.Provider>
  );
}
