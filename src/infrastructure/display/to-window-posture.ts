import type { RawWindowPosture } from '@/modules/recipely-window-posture';
import { FoldOrientation, type FoldOrientationType } from '@domain/display/fold-orientation';
import { FoldState, type FoldStateType } from '@domain/display/fold-state';
import type { WindowPosture } from '@domain/display/window-posture';

const ORIENTATIONS = new Set<string>(Object.values(FoldOrientation));
const STATES = new Set<string>(Object.values(FoldState));

const isOrientation = (value: string): value is FoldOrientationType => ORIENTATIONS.has(value);
const isState = (value: string): value is FoldStateType => STATES.has(value);

/**
 * Maps the Kotlin module's folding feature to the domain posture. A word this
 * build does not know (a newer native side) is dropped as "no fold" rather than
 * guessed, so a layout never splits along an axis it misread.
 */
export const toWindowPosture = (raw: RawWindowPosture | null): WindowPosture | null => {
  if (raw === null || !isOrientation(raw.orientation) || !isState(raw.state)) return null;
  return {
    isSeparating: raw.isSeparating,
    orientation: raw.orientation,
    state: raw.state,
    hinge: { x: raw.x, y: raw.y, width: raw.width, height: raw.height },
  };
};
