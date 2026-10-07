import { ValueConstants } from '@core/constants';
import type { ReminderSlot } from '@domain/notifications/reminders/reminder-slot';

/** Days of absence that earn a reminder; the gaps widen so a lapsed user is not nagged. */
const ReminderDay = {
  twoDays: 2,
  fourDays: 4,
  oneWeek: 7,
  twoWeeks: 14,
  threeWeeks: 21,
  oneMonth: 30,
} as const;
const REMINDER_DAYS: readonly number[] = Object.values(ReminderDay);

/** Local wall-clock time each reminder fires: early evening, when dinner gets decided. */
const REMINDER_HOUR = 18;
const REMINDER_MINUTE = 0;

/**
 * **The come-back series** counted from the last time the app was opened.
 *
 * @remarks
 * - **Reset on every open:** the caller replaces the whole series each time the app comes to
 *   the foreground, so someone who uses the app never receives one; only absence does.
 * - **At most one a day, then silence:** six reminders over a month, none after day 30 until the
 *   next open. Losing a user to an uninstall costs more than a missed reminder.
 * - **Local time:** each fires at 18:00 on the device's clock; a day shift across DST stays at 18:00.
 */
export const reminderSchedule = (nowMs: number): ReminderSlot[] =>
  REMINDER_DAYS.map((day) => {
    const at = new Date(nowMs);
    at.setDate(at.getDate() + day);
    at.setHours(REMINDER_HOUR, REMINDER_MINUTE, ValueConstants.zero, ValueConstants.zero);
    return { fireAtMs: at.getTime(), day };
  });

