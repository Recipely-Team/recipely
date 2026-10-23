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
  // Tagged with the source it was read from: a new source is read in the render it arrives in.
  const [reading, setReading] = useState(() => ({ source, posture: source?.current() ?? null }));
  if (reading.source !== source) setReading({ source, posture: source?.current() ?? null });

  useEffect(() => {
    if (source === undefined) return undefined;
    return source.subscribe((posture) => setReading({ source, posture }));
  }, [source]);

  return reading.source === source ? reading.posture : (source?.current() ?? null);
};
