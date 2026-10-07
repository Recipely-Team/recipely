import { CharConstants , TimeConstants, ValueConstants } from '@core/constants';

/** A number, optionally a range ("10-15", "10 to 15"): group 1 is its first value. */
const AMOUNT = String.raw`(\d+(?:[.,]\d+)?)(?:\s*(?:-|–|to|bis|ila|a|à)\s*\d+(?:[.,]\d+)?)?\s*`;

/** Latin-script units: whole words, so "2 hot pans" is not two hours. */
const LATIN_MINUTE = 'minutes|minuten|minutos|minuti|minute|minuto|mins|min|menit';
const LATIN_HOUR = 'hours|hour|hrs|hr|h|stunden|stunde|std|horas|hora|heures|heure|ore|ora|jam';

/** Units in scripts and languages that glue suffixes on ("10分钟", "5 dakikada"). */
const GLUED_MINUTE = 'dakika|dk|минут|мин|分钟|分間|分|분|मिनट|دقائق|دقيقة';
const GLUED_HOUR = 'saat|час|小时|時間|시간|घंटे|घंटा|ساعات|ساعة';

const DURATION = new RegExp(
  `${AMOUNT}(?:(?<latinMin>${LATIN_MINUTE})(?!\\p{L})|(?<latinHour>${LATIN_HOUR})(?!\\p{L})|(?<gluedMin>${GLUED_MINUTE})|(?<gluedHour>${GLUED_HOUR}))`,
  'iu',
);

/**
 * The minutes a step's own text names ("simmer for 10-15 minutes" → 10), or
 * `null` when it names none.
 *
 * @remarks
 * - **The first duration wins, at its low end.** A range is a "check it from
 *   here" — the timer rings at the earliest point the cook should look.
 * - **Hours count** ("bake 1.5 hours" → 90); decimals take a comma or a dot.
 * - **The recipe languages the app ships in**, not English alone: the step text
 *   is whatever the author wrote.
 */
export const stepDurationMinutes = (step: string): number | null => {
  const match = DURATION.exec(step);
  const amount = match?.[ValueConstants.one];
  if (match === null || amount === undefined) return null;

  const value = Number.parseFloat(amount.replace(CharConstants.comma, CharConstants.dot));
  const isHours = match.groups?.latinHour !== undefined || match.groups?.gluedHour !== undefined;
  const minutes = Math.round(isHours ? value * TimeConstants.minutesPerHour : value);
  return minutes > ValueConstants.zero ? minutes : null;
};
