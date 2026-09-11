import { createContext } from 'react';
import type { AssistantController } from '@live-assistant/core';

/** The controller the hooks below read. Provided by `AssistantProvider`. */
export const AssistantContext = createContext<AssistantController<unknown> | null>(null);
