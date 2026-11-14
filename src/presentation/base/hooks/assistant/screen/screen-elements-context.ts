import { createContext } from 'react';
import type { ScreenElementRegistry } from '@application/assistant/screen/screen-element-registry';

/**
 * Where on-screen texts and controls register for the assistant.
 *
 * @remarks
 * - **Null means nobody is listening**: a component test that renders a
 *   `ThemedText` without the app around it registers nothing and needs no setup.
 */
export const ScreenElementsContext = createContext<ScreenElementRegistry | null>(null);
