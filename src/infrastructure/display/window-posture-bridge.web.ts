import { isObject } from '@core/guards/type-guards';
import { postureFromSegments } from '@infrastructure/display/posture-from-segments';
import type { DisplayRect } from '@domain/display/display-rect';
import type { WindowPosture } from '@domain/display/window-posture';
import type { WindowPostureInterface } from '@domain/display/window-posture-interface';

const SEGMENT_QUERIES = ['(horizontal-viewport-segments: 2)', '(vertical-viewport-segments: 2)'] as const;
const VIEWPORT_KEY = 'viewport';
const DEVICE_POSTURE_KEY = 'devicePosture';
const FOLDED_POSTURE = 'folded';
const CHANGE_EVENT = 'change';
const RESIZE_EVENT = 'resize';

const isRect = (value: unknown): value is DisplayRect =>
  isObject(value) &&
  typeof value.x === 'number' &&
  typeof value.y === 'number' &&
  typeof value.width === 'number' &&
  typeof value.height === 'number';

const readSegments = (): DisplayRect[] | null => {
  if (typeof window === 'undefined' || !(VIEWPORT_KEY in window)) return null;
  const viewport: unknown = window[VIEWPORT_KEY];
  if (!isObject(viewport) || !Array.isArray(viewport.segments)) return null;
  const segments: unknown[] = viewport.segments;
  return segments.every(isRect) ? segments : null;
};

const readDevicePosture = (): EventTarget | null => {
  if (typeof navigator === 'undefined' || !(DEVICE_POSTURE_KEY in navigator)) return null;
  const posture: unknown = navigator[DEVICE_POSTURE_KEY];
  return posture instanceof EventTarget ? posture : null;
};

const readIsFolded = (): boolean => {
  const posture = readDevicePosture();
  return isObject(posture) && posture.type === FOLDED_POSTURE;
};

/**
 * The web half of the posture port: the Viewport Segments API (Chromium 138+,
 * Edge on a spanned Surface Duo) and, for half opened, the Device Posture API.
 *
 * @remarks
 * - **Feature-detected, never assumed.** Every other browser — and the static
 *   export's server render, which has no `window` — answers `null`.
 * - **Three signals, one reading.** The segment media queries fire when the
 *   window starts or stops spanning, `resize` when the segments move, and the
 *   posture `change` when the device folds; each re-reads everything and
 *   reports only when the posture actually changed.
 */
export class WindowPostureBridge implements WindowPostureInterface {
  current(): WindowPosture | null {
    return postureFromSegments(readSegments(), readIsFolded());
  }

  subscribe(listener: (posture: WindowPosture | null) => void): () => void {
    if (typeof window === 'undefined') return () => undefined;
    let last = JSON.stringify(this.current());
    const notify = (): void => {
      const next = this.current();
      const key = JSON.stringify(next);
      if (key === last) return;
      last = key;
      listener(next);
    };
    const queries = typeof window.matchMedia === 'function' ? SEGMENT_QUERIES.map((query) => window.matchMedia(query)) : [];
    const devicePosture = readDevicePosture();
    queries.forEach((query) => query.addEventListener(CHANGE_EVENT, notify));
    devicePosture?.addEventListener(CHANGE_EVENT, notify);
    window.addEventListener(RESIZE_EVENT, notify);
    return () => {
      queries.forEach((query) => query.removeEventListener(CHANGE_EVENT, notify));
      devicePosture?.removeEventListener(CHANGE_EVENT, notify);
      window.removeEventListener(RESIZE_EVENT, notify);
    };
  }
}
