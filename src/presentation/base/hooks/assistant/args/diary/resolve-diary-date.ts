import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { ValueConstants } from '@core/constants';
import { foldForMatch } from '@presentation/base/hooks/assistant/args/resolving/fold-for-match';
import type { ArgParse } from '@presentation/base/hooks/assistant/args/diary/arg-parse';
import { DiaryArgError } from '@presentation/base/hooks/assistant/args/diary/diary-arg-error';

const TODAY = 'today';
const YESTERDAY = 'yesterday';

/**
 * A day the model named — `YYYY-MM-DD`, `today` or `yesterday` — against the
 * device's today. A future day is refused, as the date strip refuses a tap on
 * one; the model resolves "last Monday" itself from the date readScreen gives it.
 */
export const resolveDiaryDate = (arg: string, today: CalendarDate): ArgParse<CalendarDate> => {
  const word = foldForMatch(arg);
  if (word === TODAY) return { ok: true, value: today };
  if (word === YESTERDAY) return { ok: true, value: today.addDays(ValueConstants.minusOne) };
  const date = CalendarDate.create(arg.trim());
  if (!date.ok) return { ok: false, error: DiaryArgError.InvalidDate };
  if (date.value.isAfter(today)) return { ok: false, error: DiaryArgError.FutureDate };
  return { ok: true, value: date.value };
};
