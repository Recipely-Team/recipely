import { useEffect, useRef } from 'react';
import { useAssistantController } from './use-assistant-controller';

const MS_PER_SECOND = 1000;

/**
 * Calls `onFrame` on every animation frame with both levels — the hook for
 * drawing "the user is talking" and "the assistant is talking" effects.
 *
 * @remarks
 * - **Nothing re-renders.** Write the values straight into an animated value
 *   (`Animated.Value#setValue`, a Reanimated shared value, a canvas uniform)
 *   inside `onFrame`. Putting them in React state would re-render 60 times a
 *   second — exactly what the level API exists to avoid.
 * - **`elapsedSeconds` is the time since the previous frame**, for
 *   frame-rate-independent easing (`smoothLevel` from the core package).
 * - **The latest `onFrame` is always the one called**; it may be an inline
 *   function without restarting the loop.
 */
export function useLevelFrames(
  onFrame: (levels: { readonly input: number; readonly output: number }, elapsedSeconds: number) => void,
): void {
  const controller = useAssistantController();
  const latest = useRef(onFrame);
  latest.current = onFrame;

  useEffect(() => {
    let frame: number | null = null;
    let previous: number | null = null;
    const loop = (timestamp: number): void => {
      const elapsed = previous === null ? 0 : (timestamp - previous) / MS_PER_SECOND;
      previous = timestamp;
      latest.current({ input: controller.inputLevel.level(), output: controller.outputLevel.level() }, elapsed);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [controller]);
}
