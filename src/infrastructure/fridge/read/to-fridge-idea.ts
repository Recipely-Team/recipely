import { fail, ok } from '@core/result/result-helpers';
import type { Mapper } from '@core/mapper/mapper';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { isBlank, isString } from '@core/guards/type-guards';
import { CharConstants, ValueConstants } from '@core/constants';
import { DIFFICULTY_VALUES } from '@domain/recipes/difficulty';
import type { FridgeIdea } from '@domain/fridge/ideas/fridge-idea';
import type { FridgeIdeaDto } from '@infrastructure/fridge/dtos/fridge-idea-dto';

/** The most missing items the server sends; more are cut, never shown. */
const MISSING_MAX = 5;

const names = (raw: readonly unknown[]): string[] =>
  raw.flatMap((name) => (isString(name) && !isBlank(name) ? [name.trim()] : []));

/**
 * One wire idea → `FridgeIdea`. A difficulty outside `EASY` / `MEDIUM` / `HARD`
 * or a blank title fails, and the list mapper drops that idea.
 */
export const toFridgeIdea: Mapper<FridgeIdeaDto, FridgeIdea, ValidationFailure> = (dto) => {
  const difficulty = DIFFICULTY_VALUES.find((value) => value === dto.difficulty);
  if (difficulty === undefined || !isString(dto.title) || isBlank(dto.title)) {
    return fail(new ValidationFailure(DiagnosticMessage.fridge.difficultyInvalid(String(dto.difficulty)), 'difficulty'));
  }
  return ok({
    title: dto.title.trim(),
    summary: isString(dto.summary) ? dto.summary.trim() : CharConstants.empty,
    totalMinutes: Number.isFinite(dto.totalMinutes) ? Math.max(ValueConstants.zero, Math.round(dto.totalMinutes)) : ValueConstants.zero,
    difficulty,
    uses: names(dto.uses ?? []),
    missing: names(dto.missing ?? []).slice(ValueConstants.zero, MISSING_MAX),
  });
};
