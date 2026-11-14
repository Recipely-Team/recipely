import { ValueConstants } from '@core/constants';
import { normalizeScreenLabel } from '@domain/assistant/screen/normalize-screen-label';

/**
 * Which of the screen's control labels the user meant, by index; null when
 * none or more than one fits.
 *
 * @remarks
 * - **Exact first.** "Kaydet" presses the button labelled Kaydet even when
 *   "Kaydet ve yayınla" is also on screen.
 * - **Then a single containing label.** "yıllık" finds "Yıllık, 4,99 $ / yıl";
 *   two labels that both contain the words are a question back to the user,
 *   never a guess.
 */
export const matchScreenLabel = (labels: readonly string[], query: string): number | null => {
  const wanted = normalizeScreenLabel(query);
  if (wanted.length === ValueConstants.zero) return null;
  const normalized = labels.map(normalizeScreenLabel);
  const exact = normalized.indexOf(wanted);
  if (exact !== ValueConstants.minusOne) return exact;
  const containing = normalized.flatMap((label, index) => (label.includes(wanted) ? [index] : []));
  return containing.length === ValueConstants.one ? (containing[ValueConstants.zero] ?? null) : null;
};
