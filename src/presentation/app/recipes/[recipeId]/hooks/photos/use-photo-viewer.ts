import { useCallback, useEffect, useRef, useState } from 'react';
import { ValueConstants } from '@core/constants';

interface PhotoViewerPosition {
  /** The photo in view — always inside the list that is actually there. */
  current: number;
  goTo: (index: number) => void;
}

/**
 * Which photo the recipe's viewer is showing.
 *
 * @remarks
 * - **Clamped on every read.** Removing the last photo while it is in view
 *   would otherwise leave the index one past the end — the counter read
 *   "3 / 2" and the remove button vanished with it.
 * - **A photo that arrives is shown.** When the list grows, the viewer moves
 *   to the first new photo, so the owner sees what they just added rather
 *   than having to hunt for it at the end of the strip.
 */
export const usePhotoViewer = (count: number): PhotoViewerPosition => {
  const [active, setActive] = useState(ValueConstants.zero);
  const seen = useRef(count);

  useEffect(() => {
    if (count > seen.current) setActive(seen.current);
    seen.current = count;
  }, [count]);

  const goTo = useCallback(
    (index: number): void => {
      if (index >= ValueConstants.zero && index < count) setActive(index);
    },
    [count],
  );

  const current = Math.min(active, Math.max(count - ValueConstants.one, ValueConstants.zero));
  return { current, goTo };
};
