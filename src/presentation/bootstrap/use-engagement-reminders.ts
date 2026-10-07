import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import type { RefreshRemindersUseCase } from '@application/notifications/reminders/refresh-reminders-use-case';
import { getNotificationService } from '@application/notifications/get-notification-service';
import { AppStateStatusValue } from '@infrastructure/constants/app-state-status';
import { isWeb } from '@infrastructure/constants/platform';
import { analyticsService } from '@infrastructure/firebase/analytics-service';
import { AnalyticsEvent } from '@infrastructure/constants/analytics/analytics-event';
import { t, useLocale } from '@presentation/i18n';

/**
 * Keeps the come-back reminder series pushed out to "N days after the last open".
 *
 * @remarks
 * - **Every open resets it:** on mount and on each return to the foreground the series is replaced,
 *   so an active user never receives one. The use case clears it for anyone who has not opted in.
 * - **Re-run on a language change**, so pending reminders speak the language the user just picked.
 * - **Opens are measured:** a tapped reminder logs `reminder_opened` with its day and copy variant,
 *   which is how a variant that annoys rather than brings people back gets found.
 * - **Lives in bootstrap:** it reports to analytics, and only the composition root reaches infrastructure.
 */
export const useEngagementReminders = (refresh: RefreshRemindersUseCase): void => {
  const locale = useLocale();

  useEffect(() => {
    if (isWeb()) return undefined;
    const run = (): void => {
      void refresh.execute(t().reminders.messages, Date.now());
    };
    run();
    const appState = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === AppStateStatusValue.active) run();
    });
    return () => appState.remove();
  }, [refresh, locale]);

  useEffect(
    () =>
      getNotificationService().onReminderOpened(({ day, variant }) => {
        void analyticsService.logEvent(AnalyticsEvent.reminderOpened, { day, variant });
      }),
    [],
  );
};
