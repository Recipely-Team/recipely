/**
 * The folding feature exactly as the Kotlin module sends it: the hinge bounds
 * already converted to dp, the two enums as bare strings (`vertical` /
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
