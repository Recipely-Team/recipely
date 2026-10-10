import { ok } from '@core/result/result-helpers';
import type { Mapper } from '@core/mapper/mapper';
import { isBlank, isString } from '@core/guards/type-guards';
import { FridgeConfidence } from '@domain/fridge/scan/fridge-confidence';
import type { FridgeIngredient } from '@domain/fridge/scan/fridge-ingredient';
import type { FridgeScanDto } from '@infrastructure/fridge/dtos/fridge-scan-dto';

/**
 * `POST /fridge/scan` response → the ingredients the user reviews.
 *
 * @remarks
 * - **Anything but `high` reads as low confidence**, so a newer server's third
 *   level shows dimmed ("not sure") rather than as a certainty.
 * - **A nameless row is skipped**, not fatal: the rest of the scan still lands.
 */
export const toFridgeIngredients: Mapper<FridgeScanDto, readonly FridgeIngredient[]> = (dto) =>
  ok(
    dto.ingredients.flatMap((row) =>
      isString(row.name) && !isBlank(row.name)
        ? [{ name: row.name.trim(), confidence: row.confidence === FridgeConfidence.High ? FridgeConfidence.High : FridgeConfidence.Low }]
        : [],
    ),
  );
