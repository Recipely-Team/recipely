import type { Failure } from '@core/failure';
import type { PickPhase } from '@presentation/base/widgets/diary/add-food/list/pick-phase';

/** Which face the pick step's list area shows. */
export type ListPhase =
  | { phase: typeof PickPhase.Loading }
  | { phase: typeof PickPhase.Error; failure: Failure }
  | { phase: typeof PickPhase.Empty }
  | { phase: typeof PickPhase.Ready };
