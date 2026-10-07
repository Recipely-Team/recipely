import { container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import type { WindowPostureInterface } from '@domain/display/window-posture-interface';

/**
 * The fold-posture port for `LayoutProvider`, which sits above `AppBootstrap`
 * and so cannot read it from the store bundle.
 *
 * @remarks
 * - **Registration happens when `app-bootstrap` is imported**, which the root
 *   layout does before it renders; until then (a test rendering the provider
 *   alone) this answers `undefined` and the layout sees no fold.
 */
export const resolveWindowPosture = (): WindowPostureInterface | undefined =>
  container.has(TOKENS.WindowPosture) ? container.resolve<WindowPostureInterface>(TOKENS.WindowPosture) : undefined;
