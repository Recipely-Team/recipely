import { useCallback } from 'react';
import { AssistantAction } from '@domain/assistant/actions/assistant-action-type';
import type { AssistantActionResultType } from '@domain/assistant/actions/assistant-action-result';
import { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { CalendarMonth } from '@domain/diary/calendar/calendar-month';
import type { DiaryMonth } from '@domain/diary/month/diary-month';
import { CharConstants } from '@core/constants';
import { useStores } from '@presentation/bootstrap/use-stores';
import { useAssistantAction } from '@presentation/base/hooks/assistant/actions/use-assistant-action';
import { useAssistantScreenContent } from '@presentation/base/hooks/assistant/use-assistant-screen-content';
import { useAssistantScreenReading } from '@presentation/base/hooks/assistant/use-assistant-screen-reading';
import { resolveDiaryDate } from '@presentation/base/hooks/assistant/args/diary/resolve-diary-date';
import { SCREEN_PART_SEPARATOR } from '@presentation/base/hooks/assistant/args/describing/screen-line';
import { calendarReading } from '@presentation/app/diary/calendar/model/calendar-reading';
import { useLocale } from '@presentation/i18n';

/** What the month page lends the assistant. */
interface AssistantCalendarActionsDeps {
  month: CalendarMonth;
  diaryMonth: DiaryMonth | undefined;
  selected: CalendarDate;
  today: CalendarDate;
  showMonth: (month: CalendarMonth) => void;
}

/**
 * The month page by voice: `selectDate` selects the day and turns the
 * calendar to its month (the page stays, so the user sees the day outlined —
 * the Day view shows it on the way back), and `readScreen` reads the month.
 */
export const useAssistantCalendarActions = ({ month, diaryMonth, selected, today, showMonth }: AssistantCalendarActionsDeps): void => {
  const { diaryStore } = useStores();
  const locale = useLocale();

  useAssistantScreenContent(() =>
    [`today=${today.value}`, `selected=${selected.value}`, `month=${month.value}`].join(SCREEN_PART_SEPARATOR),
  );
  useAssistantScreenReading(() => calendarReading(month, diaryMonth, selected, today, locale));

  useAssistantAction(
    AssistantAction.SelectDate,
    useCallback(
      async (arg?: string): Promise<AssistantActionResultType> => {
        const date = resolveDiaryDate(arg ?? CharConstants.empty, CalendarDate.today());
        if (!date.ok) return { ok: false, error: date.error };
        void diaryStore.getState().selectDate(date.value);
        showMonth(CalendarMonth.of(date.value));
        return { ok: true, title: date.value.value };
      },
      [diaryStore, showMonth],
    ),
  );
};
