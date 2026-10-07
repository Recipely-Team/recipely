import * as Posture from '@/modules/recipely-window-posture';
import { toWindowPosture } from '@infrastructure/display/to-window-posture';
import type { WindowPosture } from '@domain/display/window-posture';
import type { WindowPostureInterface } from '@domain/display/window-posture-interface';

/**
 * Adapts `recipely-window-posture` (Jetpack WindowManager) to the domain port.
 * On iOS the module is not linked, so both calls answer "no fold".
 */
export class WindowPostureBridge implements WindowPostureInterface {
  current(): WindowPosture | null {
    return toWindowPosture(Posture.getPosture());
  }

  subscribe(listener: (posture: WindowPosture | null) => void): () => void {
    return Posture.addPostureListener((raw) => listener(toWindowPosture(raw)));
  }
}
