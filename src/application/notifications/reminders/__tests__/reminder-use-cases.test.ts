/**
 * Come-back reminder use cases: opt-in only, cleared on a no or a revoked permission,
 * rotating copy, and the "ask on a return visit" gate.
 */
import { FakeNotificationService } from '@application/__fixtures__/fake-notification-service';
import { FakePreferenceStore } from '@application/__fixtures__/fake-preference-store';
import { PreferenceSlot } from '@domain/storage/preference-slot';
import { RemindersChoice } from '@domain/notifications/reminders/reminders-choice';
import { RefreshRemindersUseCase } from '@application/notifications/reminders/refresh-reminders-use-case';
import { SetRemindersChoiceUseCase } from '@application/notifications/reminders/set-reminders-choice-use-case';
import { GetRemindersEnabledUseCase } from '@application/notifications/reminders/get-reminders-enabled-use-case';
import { ShouldOfferRemindersUseCase } from '@application/notifications/reminders/should-offer-reminders-use-case';

const DAY = 86_400_000;
const NOW = 20 * DAY;
const COPIES = [
  { title: 'A', body: 'a' },
  { title: 'B', body: 'b' },
  { title: 'C', body: 'c' },
];

const setup = () => {
  const notifications = new FakeNotificationService();
  const prefs = new FakePreferenceStore();
  const refresh = new RefreshRemindersUseCase(notifications, prefs);
  return {
    notifications,
    prefs,
    refresh,
    setChoice: new SetRemindersChoiceUseCase(notifications, prefs, refresh),
    getEnabled: new GetRemindersEnabledUseCase(notifications, prefs),
    shouldOffer: new ShouldOfferRemindersUseCase(prefs),
  };
};

describe('RefreshRemindersUseCase', () => {
  it('schedules nothing for a user who never said yes, and clears any old series', async () => {
    const { notifications, refresh } = setup();
    await refresh.execute(COPIES, NOW);
    expect(notifications.reminderCalls).toEqual([[]]);
  });

  it('clears the series when the OS permission was revoked', async () => {
    const { notifications, prefs, refresh } = setup();
    prefs.seed(PreferenceSlot.RemindersChoice, RemindersChoice.On);
    notifications.permissionGranted = false;
    await refresh.execute(COPIES, NOW);
    expect(notifications.reminderCalls).toEqual([[]]);
  });

  it('schedules the whole series with rotating copy once opted in', async () => {
    const { notifications, prefs, refresh } = setup();
    prefs.seed(PreferenceSlot.RemindersChoice, RemindersChoice.On);
    await refresh.execute(COPIES, NOW);
    const series = notifications.reminderCalls[0]!;
    expect(series.map((r) => r.day)).toEqual([2, 4, 7, 14, 21, 30]);
    // Day 20 % 3 copies = start at variant 2, then wrap.
    expect(series.map((r) => r.title)).toEqual(['C', 'A', 'B', 'C', 'A', 'B']);
  });

  it('runs overlapping refreshes one after another, so a launch never schedules two series', async () => {
    const { notifications, prefs, refresh } = setup();
    prefs.seed(PreferenceSlot.RemindersChoice, RemindersChoice.On);
    let inFlight = 0;
    let maxInFlight = 0;
    const original = notifications.replaceReminders.bind(notifications);
    notifications.replaceReminders = async (reminders) => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      await original(reminders);
      inFlight--;
    };
    await Promise.all([refresh.execute(COPIES, NOW), refresh.execute(COPIES, NOW), refresh.execute(COPIES, NOW)]);
    expect(maxInFlight).toBe(1);
    expect(notifications.reminderCalls).toHaveLength(3);
  });

  it('starts the next day on a different line', async () => {
    const { notifications, prefs, refresh } = setup();
    prefs.seed(PreferenceSlot.RemindersChoice, RemindersChoice.On);
    await refresh.execute(COPIES, NOW);
    await refresh.execute(COPIES, NOW + DAY);
    expect(notifications.reminderCalls[1]![0]!.title).not.toBe(notifications.reminderCalls[0]![0]!.title);
  });
});

describe('SetRemindersChoiceUseCase', () => {
  it('stores a yes and schedules the series when the OS allows it', async () => {
    const { notifications, prefs, setChoice } = setup();
    await expect(setChoice.execute(true, COPIES, NOW)).resolves.toBe(true);
    expect(prefs.peek(PreferenceSlot.RemindersChoice)).toBe(RemindersChoice.On);
    expect(notifications.requestPermissionsCount).toBe(1);
    expect(notifications.reminderCalls.at(-1)).toHaveLength(6);
  });

  it('stores a no when the OS permission prompt is declined', async () => {
    const { notifications, prefs, setChoice } = setup();
    notifications.permissionGranted = false;
    await expect(setChoice.execute(true, COPIES, NOW)).resolves.toBe(false);
    expect(prefs.peek(PreferenceSlot.RemindersChoice)).toBe(RemindersChoice.Off);
  });

  it('turning off never asks the OS and clears the series', async () => {
    const { notifications, prefs, setChoice } = setup();
    prefs.seed(PreferenceSlot.RemindersChoice, RemindersChoice.On);
    await expect(setChoice.execute(false, COPIES, NOW)).resolves.toBe(false);
    expect(notifications.requestPermissionsCount).toBe(0);
    expect(notifications.reminderCalls.at(-1)).toEqual([]);
  });
});

describe('GetRemindersEnabledUseCase', () => {
  it('is on only with a stored yes and a granted permission', async () => {
    const { notifications, prefs, getEnabled } = setup();
    await expect(getEnabled.execute()).resolves.toBe(false);
    prefs.seed(PreferenceSlot.RemindersChoice, RemindersChoice.On);
    await expect(getEnabled.execute()).resolves.toBe(true);
    notifications.permissionGranted = false;
    await expect(getEnabled.execute()).resolves.toBe(false);
  });
});

describe('ShouldOfferRemindersUseCase', () => {
  it('records the first open and does not ask on it', async () => {
    const { prefs, shouldOffer } = setup();
    await expect(shouldOffer.execute(NOW)).resolves.toBe(false);
    expect(prefs.peek(PreferenceSlot.FirstOpenAt)).toBe(String(NOW));
  });

  it('asks on a return visit a day later, and never after an answer', async () => {
    const { prefs, shouldOffer } = setup();
    await shouldOffer.execute(NOW);
    await expect(shouldOffer.execute(NOW + DAY)).resolves.toBe(true);
    prefs.seed(PreferenceSlot.RemindersChoice, RemindersChoice.Off);
    await expect(shouldOffer.execute(NOW + 2 * DAY)).resolves.toBe(false);
  });
});
