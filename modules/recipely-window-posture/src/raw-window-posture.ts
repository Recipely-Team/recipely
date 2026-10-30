/**
 * The fold exactly as the native module sends it (Kotlin or Swift): the hinge
 * bounds already in dp / points, the two enums as bare strings (`vertical` /
 * `horizontal`, `flat` / `halfOpened`). The adapter in infrastructure validates
 * them before anything in the app sees a posture.
 */
export interface RawWindowPosture {
  readonly isSeparating: boolean;
  readonly orientation: string;
  readonly state: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
