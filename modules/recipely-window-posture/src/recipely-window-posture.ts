import { requireOptionalNativeModule } from 'expo';
import type { RawWindowPosture } from './raw-window-posture';

const POSTURE_EVENT = 'onPostureChange';

interface PostureEvent {
  readonly posture: RawWindowPosture | null;
}

interface NativeModuleShape {
  getPosture(): RawWindowPosture | null;
  addListener(event: string, listener: (event: PostureEvent) => void): { remove(): void };
}

/**
 * The JavaScript half of `RecipelyWindowPostureModule` (Android only).
 *
 * @remarks
 * - **Optional on purpose.** The module is not linked on iOS (no foldables) and
 *   not bundled on the web, so `requireOptionalNativeModule` answers `null`
 *   there and every call here degrades to "no fold" instead of throwing.
 * - **The getter is synchronous** so the first layout already splits at the
 *   hinge; the event carries every later change (unfold, rotate, span).
 */
const native = requireOptionalNativeModule<NativeModuleShape>('RecipelyWindowPosture');

export const isAvailable = native !== null;

export function getPosture(): RawWindowPosture | null {
  return native?.getPosture() ?? null;
}

export function addPostureListener(listener: (posture: RawWindowPosture | null) => void): () => void {
  if (native === null) return () => undefined;
  const subscription = native.addListener(POSTURE_EVENT, (event) => listener(event.posture));
  return () => subscription.remove();
}
