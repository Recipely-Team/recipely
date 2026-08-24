import { useCallback, useEffect, useRef } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import { useStores } from '@presentation/bootstrap/use-stores';

/**
 * Lets the user answer a confirmation out loud.
 *
 * @remarks
 * - **Without this the whole feature stops at its own safety gate.** The
 *   assistant is for someone whose hands are covered in flour; asking "shall I
 *   publish it?" and then requiring a tap to say yes is worse than not asking.
 *   So every sheet that stops the assistant also accepts a spoken answer.
 * - **It does not weaken the gate, it completes it.** The model cannot confirm
 *   anything on its own: `confirm` is a tool call, and a tool call happens
 *   because the USER said yes to a question they were just asked, out loud,
 *   about a sheet they can see. That is the same loop as a tap, with a
 *   different limb.
 * - **Only while the sheet is open.** Registration is scoped to `visible`, so
 *   a stray "yes" with nothing pending answers `unavailable_here` rather than
 *   confirming whatever was last on screen.
 * - **A screen must have at most ONE of these pending at a time.** Both words
 *   are registered on the same two keys, and what decides the winner is which
 *   effect re-ran last — which tracks state changes, not what is drawn on top.
 *   With two live, a user reading a modal could say "yes" and answer the
 *   inline dock behind it: the wrong action runs and the model announces the
 *   one that did not. A caller with two possible sheets decides which is
 *   pending and passes `visible` accordingly, rather than registering both.
 */
export const useAssistantConfirmation = (
  visible: boolean,
  onConfirm: () => void,
  onCancel: () => void,
): void => {
  const { assistantActionRegistry } = useStores();
  const handlers = useRef({ onConfirm, onCancel });
  handlers.current = { onConfirm, onCancel };

  const confirm = useCallback(async () => {
    handlers.current.onConfirm();
    return { ok: true };
  }, []);
  const cancel = useCallback(async () => {
    handlers.current.onCancel();
    return { ok: true };
  }, []);

  useEffect(() => {
    if (!visible) return;

    const unregisterConfirm = assistantActionRegistry.register(AssistantAction.Confirm, confirm);
    const unregisterCancel = assistantActionRegistry.register(AssistantAction.Cancel, cancel);
    return () => {
      unregisterConfirm();
      unregisterCancel();
    };
  }, [visible, assistantActionRegistry, confirm, cancel]);
};
