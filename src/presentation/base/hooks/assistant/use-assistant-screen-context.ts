import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { useStores } from '@presentation/bootstrap/use-stores';

/**
 * Tells the assistant which screen the user is looking at.
 *
 * @remarks
 * - **One short line, carried inside every tool result.** Sending it as its own
 *   turn would be billed as a model turn; riding along in a response the model
 *   is already waiting for costs about fifteen tokens.
 * - **A path, not a description.** The model reads the same words it can pass
 *   back to `navigate`, so nothing has to translate between what it is told and
 *   what it can say.
 * - **Registered as a getter**, because the assistant navigates while it works
 *   and a value captured once would describe a screen the user has left.
 */
export const useAssistantScreenContext = (): void => {
  const { assistantActionRegistry } = useStores();
  const pathname = usePathname();

  useEffect(() => {
    assistantActionRegistry.setScreenDescriber(() => `screen=${pathname}`);
  }, [assistantActionRegistry, pathname]);
};
