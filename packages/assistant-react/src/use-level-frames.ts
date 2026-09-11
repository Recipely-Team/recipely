import { useEffect, useLayoutEffect, useRef } from 'react';
import { useAssistantController } from './use-assistant-controller';

const MS_PER_SECOND = 1000;
const SILENT = { input: 0, output: 0 } as const;

/**
 * Calls `onFrame` on every animation frame with both levels — the hook for
 * drawing "the user is talking" and "the assistant is talking" effects.
 *
 * @remarks
 * - **Nothing re-renders.** Write the values straight into an animated value
 *   (`Animated.Value#setValue`, a Reanimated shared value, a canvas uniform)
 *   inside `onFrame`. Putting them in React state would re-render 60 times a
 *   second — exactly what the level API exists to avoid.
 * - **Pause it when nothing moves.** With `enabled` false no frame is
 *   requested at all (a widget mounted at the root would otherwise wake the JS
 *   thread every frame for the app's lifetime); `onFrame` gets one final
 *   all-zero call so a drawing can come to rest.
 * - **`elapsedSeconds` is the time since the previous frame**, for
 *   frame-rate-independent easing (`smoothLevel` from the core package).
 * - **The latest `onFrame` is always the one called**, and a throwing one does
 *   not stop the loop.
 */
export function useLevelFrames(
  onFrame: (levels: { readonly input: number; readonly output: number }, elapsedSeconds: number) => void,
  enabled = true,
): void {
  const controller = useAssistantController();
  const latest = useRef(onFrame);
  useLayoutEffect(() => {
    latest.current = onFrame;
  });

  useEffect(() => {
    if (!enabled) {
      latest.current(SILENT, 0);
      return;
    }
    let frame: number | null = null;
    let previous: number | null = null;
    const loop = (timestamp: number): void => {
      frame = requestAnimationFrame(loop);
      const elapsed = previous === null ? 0 : (timestamp - previous) / MS_PER_SECOND;
      previous = timestamp;
      latest.current({ input: controller.inputLevel.level(), output: controller.outputLevel.level() }, elapsed);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [controller, enabled]);
}
