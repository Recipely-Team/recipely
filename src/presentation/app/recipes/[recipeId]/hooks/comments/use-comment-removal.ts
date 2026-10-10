import { useCallback, useState } from 'react';

interface CommentRemoval {
  /** The comment the author asked to delete, while the question is open. */
  pendingId: string | null;
  request: (commentId: string) => void;
  confirm: () => void;
  cancel: () => void;
}

/**
 * The question between a comment's trash icon and the delete request.
 *
 * @remarks
 * - **A deleted comment cannot come back**, and the icon sits right under the
 *   reader's thumb, so the tap only ASKS (`comments.deleteConfirm`); the
 *   request goes once the author answers yes.
 */
export const useCommentRemoval = (remove: (commentId: string) => Promise<void>): CommentRemoval => {
  const [pendingId, setPendingId] = useState<string | null>(null);

  const confirm = useCallback((): void => {
    const id = pendingId;
    setPendingId(null);
    if (id !== null) void remove(id);
  }, [pendingId, remove]);

  const cancel = useCallback((): void => setPendingId(null), []);

  return { pendingId, request: setPendingId, confirm, cancel };
};
