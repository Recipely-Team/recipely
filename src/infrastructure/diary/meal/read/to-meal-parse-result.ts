import { ok } from '@core/result/result-helpers';
import type { Mapper } from '@core/mapper/mapper';
import { ValueConstants } from '@core/constants';
import { DiaryLimits } from '@domain/diary/diary-limits';
import { MealParseNote, type MealParseNoteType } from '@domain/diary/meal/meal-parse-note';
import type { MealParseResult } from '@domain/diary/meal/meal-parse-result';
import type { MealParseDto } from '@infrastructure/diary/meal/dtos/meal-parse-dto';
import { toMealCandidate } from '@infrastructure/diary/meal/read/to-meal-candidate';

const toNote = (wire: string | undefined): MealParseNoteType | null =>
  Object.values(MealParseNote).find((note) => note === wire) ?? null;

/**
 * `POST /diary/meal-parse` response → `MealParseResult`.
 *
 * @remarks
 * - **A candidate that fails mapping is skipped**, not fatal: the user still
 *   gets the rest of the meal, and every row they see is loggable.
 * - **At most twelve items**, the backend's own cap, even if more arrive.
 * - **An unknown note is dropped**; a newer server's remark is not an error.
 */
export const toMealParseResult: Mapper<MealParseDto, MealParseResult> = (dto) => {
  const items = dto.items
    .map(toMealCandidate)
    .flatMap((item) => (item.ok ? [item.value] : []))
    .slice(ValueConstants.zero, DiaryLimits.MealItemsMax);
  return ok({ items, note: toNote(dto.note) });
};
