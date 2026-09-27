import { FocalPoint } from '@domain/recipes/media/focal-point';
import type { FocusDto } from '@infrastructure/recipes/media/focus-dto';

/**
 * Reads a wire focus into a `FocalPoint`, or nothing.
 *
 * A server that predates the field, a photo the sweep has not reached, and a
 * pair outside the frame all read as "no focus" — the crop stays centred, and
 * a bad point never costs the user the whole recipe.
 */
export const toFocalPoint = (dto: FocusDto | undefined): FocalPoint | undefined => {
  if (dto === undefined) return undefined;
  const point = FocalPoint.create(dto.x, dto.y);
  return point.ok ? point.value : undefined;
};
