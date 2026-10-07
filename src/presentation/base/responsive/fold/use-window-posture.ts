import { useEffect, useState } from 'react';
import type { WindowPosture } from '@domain/display/window-posture';
import type { WindowPostureInterface } from '@domain/display/window-posture-interface';

/**
 * Follows the window's fold posture from the port the composition root hands
 * {@link LayoutProvider}; `null` without a source (tests, previews).
 *
 * @remarks
 * - **Re-read on subscribe.** A posture that changed between the first render
 *   and the effect (the native flow's first emission) is picked up here rather
 *   than waiting for the next change.
 */
export const useWindowPosture = (source: WindowPostureInterface | undefined): WindowPosture | null => {
  const [posture, setPosture] = useState<WindowPosture | null>(() => source?.current() ?? null);

  useEffect(() => {
    if (source === undefined) return undefined;
    setPosture(source.current());
    return source.subscribe(setPosture);
  }, [source]);

  return posture;
};
