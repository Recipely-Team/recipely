import { useEffect, useRef } from 'react';
import type { AssistantActionHandlerType } from '@domain/assistant/actions/assistant-action-handler';
import type { AssistantActionType } from '@domain/assistant/actions/assistant-action-type';
import { useStores } from '@presentation/bootstrap/use-stores';

/**
 * Lets a screen perform one of the assistant's actions while it is mounted.
 *
 * @remarks
 * - **This is how the assistant reaches the UI at all.** Roughly half the
 *   action list — navigate, focus a field, open the photo picker, confirm a
 *   deletion — is something only a rendered screen can do, and the application
 *   layer cannot call into presentation. So screens hand their capability down.
 * - **The handler is read through a ref, not captured.** A voice session spans
 *   many renders and the handler closes over current props; registering the
 *   function itself would re-register on every render, and a re-register that
 *   races an unmount is how the action ends up dead on a screen that
 *   implements it.
 * - **Registration is scoped to mount.** An action the current screen cannot
 *   perform is answered `unavailable_here`, which the model can work with —
 *   better than a handler outliving its screen and acting on a stale one.
 */
export const useAssistantAction = (
  action: AssistantActionType,
  handler: AssistantActionHandlerType,
): void => {
  const { assistantActionRegistry } = useStores();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    // The stable wrapper is what gets registered; it forwards to whatever the
    // latest render passed, so the registry is written once per mount.
    return assistantActionRegistry.register(action, (arg) => handlerRef.current(arg));
  }, [action, assistantActionRegistry]);
};
