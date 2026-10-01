import { ImageCredit } from '@domain/recipes/media/image-credit';
import type { ImageCreditDto } from '@infrastructure/recipes/media/image-credit-dto';

/**
 * Reads a wire credit into an `ImageCredit`, or nothing.
 *
 * Absent, `null` and incomplete all read as "no credit line": a credit the app
 * cannot show honestly is left off rather than costing the user the recipe.
 */
export const toImageCredit = (dto: ImageCreditDto | null | undefined): ImageCredit | undefined => {
  if (dto === null || dto === undefined) return undefined;
  const credit = ImageCredit.create(dto.author, dto.license, dto.url);
  return credit.ok ? credit.value : undefined;
};
