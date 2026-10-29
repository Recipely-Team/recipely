import * as Posture from '@/modules/recipely-window-posture';
import { toWindowPosture } from '@infrastructure/display/to-window-posture';
import type { WindowPosture } from '@domain/display/window-posture';
import type { WindowPostureInterface } from '@domain/display/window-posture-interface';

/**
 * Adapts `recipely-window-posture` (Jetpack WindowManager on Android, UIKit's fold
 * reserved region on iOS 27.1+) to the domain port. Older iOS answers "no fold".
 */
export class WindowPostureBridge implements WindowPostureInterface {
  current(): WindowPosture | null {
    return toWindowPosture(Posture.getPosture());
  }

  subscribe(listener: (posture: WindowPosture | null) => void): () => void {
    return Posture.addPostureListener((raw) => listener(toWindowPosture(raw)));
  }
}
