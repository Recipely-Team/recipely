import type { Result } from '@core/result/result';
import { fail } from '@core/result/result-helpers';
import { ErrorMessageKey, ValidationFailure, type Failure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { ValueConstants } from '@core/constants';
import { FridgeLimits } from '@domain/fridge/fridge-limits';
import type { FridgeRepositoryInterface } from '@domain/fridge/fridge-repository-interface';
import type { FridgeIngredient } from '@domain/fridge/scan/fridge-ingredient';
import type { FridgeScanInput } from '@domain/fridge/scan/fridge-scan-input';

/**
 * Reads the ingredients in 1–3 fridge or pantry photos.
 *
 * @remarks
 * - **No photo, or more than three, is refused before the request** with the
 *   server's own keys (`no_photos`, `too_many_photos`), so the copy is the
 *   same and no daily AI call is spent on it.
 * - **"Nothing recognised" arrives as a failure** (`nothing_recognised`, 422);
 *   an empty list from an older server is passed on as it is — the screen
 *   reads both as the same state.
 */
export class ScanFridgeUseCase {
  constructor(private readonly repo: FridgeRepositoryInterface) {}

  execute(input: FridgeScanInput): Promise<Result<readonly FridgeIngredient[], Failure>> {
    if (input.photos.length === ValueConstants.zero) {
      return Promise.resolve(fail(new ValidationFailure(DiagnosticMessage.fridge.noPhotos, 'photos', ErrorMessageKey.fridgeNoPhotos)));
    }
    if (input.photos.length > FridgeLimits.photosMax) {
      return Promise.resolve(fail(new ValidationFailure(DiagnosticMessage.fridge.tooManyPhotos, 'photos', ErrorMessageKey.fridgeTooManyPhotos)));
    }
    return this.repo.scan(input);
  }
}
