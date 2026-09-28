import { useCallback, useState } from 'react';
import type { MediaItem } from '@domain/recipes/media/media-item';

interface PhotoRemoval {
  /** The photo the owner asked to remove, while the question is open. */
  pending: MediaItem | null;
  request: (item: MediaItem) => void;
  confirm: () => void;
  cancel: () => void;
}

/**
 * The question between the Remove button and the request.
 *
 * It is the owner's own picture and may be the only one the recipe has, so
 * nothing goes until they answer yes — the viewer's button only ASKS.
 */
export const usePhotoRemoval = (remove: (item: MediaItem) => Promise<void>): PhotoRemoval => {
  const [pending, setPending] = useState<MediaItem | null>(null);

  const confirm = useCallback((): void => {
    const item = pending;
    setPending(null);
    if (item !== null) void remove(item);
  }, [pending, remove]);

  return { pending, request: setPending, confirm, cancel: () => setPending(null) };
};
