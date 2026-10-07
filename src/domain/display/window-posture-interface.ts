import type { WindowPosture } from '@domain/display/window-posture';

/**
 * Port for the window's fold posture: Jetpack WindowManager on Android, the
 * Viewport Segments API on the web.
 *
 * @remarks
 * - **`null` means no fold crosses the window** — a phone, a tablet, iOS, a
 *   browser without the API, or a Fold's cover screen.
 * - **`current` is synchronous** so the first layout pass already knows the
 *   posture; `subscribe` reports every change after it.
 */
export interface WindowPostureInterface {
  current(): WindowPosture | null;

  /** Registers a listener and returns the function that removes it. */
  subscribe(listener: (posture: WindowPosture | null) => void): () => void;
}
