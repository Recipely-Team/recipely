import type { Result } from '@core/result/result';
import { fail, ok } from '@core/result/result-helpers';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { isBlank } from '@core/guards/type-guards';
import { parseAmount } from '@domain/recipes/ingredients/quantity/parse-amount';

/**
 * A typed amount → a line's quantity: blank is none, "1,5" / "1.5" / "½" is
 * that number, and anything else — a range, a word, a zero — is refused, so
 * the edit is caught before the server would refuse it.
 */
export const readShoppingQuantity = (text: string): Result<number | null, ValidationFailure> => {
  if (isBlank(text)) return ok(null);
  const trimmed = text.trim();
  const parsed = parseAmount(trimmed);
  if (parsed === null || parsed.upTo !== null || parsed.length !== trimmed.length) {
    return fail(new ValidationFailure(DiagnosticMessage.shopping.quantityInvalid, 'quantity'));
  }
  return ok(parsed.amount);
};
