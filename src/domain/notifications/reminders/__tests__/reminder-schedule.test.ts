import { reminderSchedule } from '@domain/notifications/reminders/reminder-schedule';
import { shouldOfferReminders } from '@domain/notifications/reminders/should-offer-reminders';
import { RemindersChoice } from '@domain/notifications/reminders/reminders-choice';

const DAY = 86_400_000;

describe('reminderSchedule', () => {
  const now = new Date(2026, 9, 8, 9, 30).getTime();

  it('spaces six reminders over a month, the gaps widening', () => {
    expect(reminderSchedule(now).map((s) => s.day)).toEqual([2, 4, 7, 14, 21, 30]);
  });

  it('fires each one at 18:00 local time on its day', () => {
    for (const slot of reminderSchedule(now)) {
      const at = new Date(slot.fireAtMs);
      expect([at.getHours(), at.getMinutes()]).toEqual([18, 0]);
      expect(at.getDate()).toBe(new Date(2026, 9, 8 + slot.day).getDate());
    }
  });

  it('never fires before its day, even when opened late in the evening', () => {
    const late = new Date(2026, 9, 8, 23, 50).getTime();
    expect(reminderSchedule(late)[0]!.fireAtMs - late).toBeGreaterThan(DAY);
  });
});

describe('shouldOfferReminders', () => {
  const first = 1_000_000;

  it('waits for a return visit a day after the first open', () => {
    expect(shouldOfferReminders(null, first, first + DAY - 1)).toBe(false);
    expect(shouldOfferReminders(null, first, first + DAY)).toBe(true);
  });

  it('is never asked again once answered, either way', () => {
    expect(shouldOfferReminders(RemindersChoice.On, first, first + 5 * DAY)).toBe(false);
    expect(shouldOfferReminders(RemindersChoice.Off, first, first + 5 * DAY)).toBe(false);
  });

  it('is not asked before the first open was recorded', () => {
    expect(shouldOfferReminders(null, null, first)).toBe(false);
  });
});
