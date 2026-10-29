import type { AppVersionState } from '@application/app-version/app-version-state';

export interface AppVersionStore {
  state: AppVersionState;
  /** Asks the backend again — on launch, on return to the foreground, on a 426, and from the gate's Try again. */
  check: () => Promise<void>;
  /** "Not now" on the optional prompt: remembered for this release only. */
  dismissUpdate: () => Promise<void>;
}
