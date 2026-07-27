/**
 * timer-controls orchestration tests.
 */
/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

jest.mock('@infrastructure/constants/storage', () => ({
  SESSION_STORAGE_KEY: 'recipely.session.v1',
  TIMERS_STORAGE_KEY: 'recipely.timers.v1',
}));

import { container } from '@core/di/container-instance';
import { TOKENS } from '@application/di/tokens';
import { FakeKeyValueStore } from '@application/__fixtures__/fake-key-value-store';
import { FakeNotificationService } from '@application/__fixtures__/fake-notification-service';
import { timerStore } from '@application/timers/timer-store';
import {
  startTimer,
  stopTimer,
  pauseTimer,
  resumeTimer,
} from '@presentation/base/timers/timer-controls';
import { triggeredAlarms } from '@presentation/base/timers/triggered-alarms';
import { toastStore } from '@presentation/base/feedback/toast-store';
import { alarmStore } from '@application/timers/alarm-store';
import { t } from '@presentation/i18n';

// Shared in-memory / recording fakes resolved via the DI tokens. The
// notification fake's default `scheduledIds` are the ids the assertions below
// expect to land on the timer entry's `completionNotifIds`.
const fakeKvStore = new FakeKeyValueStore();
const notificationService = new FakeNotificationService();

const resetAll = (): void => {
  container.register(TOKENS.KeyValueStore, () => fakeKvStore);
  container.register(TOKENS.NotificationService, () => notificationService);
  timerStore.setState({ timers: {}, hydrated: false });
  fakeKvStore.clear();
  notificationService.scheduleCalls = [];
  notificationService.cancelCalls = [];
  toastStore.setState({ toasts: [] });
  alarmStore.setState({ alarms: [] });
};

describe('timer-controls', () => {
  beforeEach(resetAll);

  describe('startTimer', () => {
    it('adds entry with all notification ids and a future endTimeMs', async () => {
      const before = Date.now();
      await startTimer('r1:prep', 'r1', 'Pasta', 5);

      const entry = timerStore.getState().timers['r1:prep'];
      expect(entry).toBeDefined();
      expect(entry?.recipeId).toBe('r1');
      expect(entry?.durationSeconds).toBe(300);
      expect(entry?.isPaused).toBe(false);
      expect(entry?.completionNotifIds).toEqual(['notif-1', 'notif-2', 'notif-3']);
      expect(entry?.endTimeMs).toBeGreaterThanOrEqual(before + 300_000);
    });

    it('schedules alarm notifications', async () => {
      await startTimer('r1:prep', 'r1', 'Pasta', 5);
      expect(notificationService.scheduleCalls).toHaveLength(1);
    });

    it('cancels the previous run’s notifications when the same timer is restarted', async () => {
      await startTimer('r1:prep', 'r1', 'Pasta', 5);
      notificationService.cancelCalls = [];

      await startTimer('r1:prep', 'r1', 'Pasta', 5);

      // `add()` overwrites the entry holding the old notification ids, so
      // without this the first run's alerts stay scheduled and still fire.
      expect(notificationService.cancelCalls).toContainEqual(['notif-1', 'notif-2', 'notif-3']);
      expect(timerStore.getState().timers['r1:prep']).toBeDefined();
    });

    it('is a no-op for a non-positive duration', async () => {
      await startTimer('r1:cook', 'r1', 'Pasta', 0);
      expect(timerStore.getState().timers['r1:cook']).toBeUndefined();
      expect(notificationService.scheduleCalls).toHaveLength(0);
    });
  });

  describe('stopTimer', () => {
    it('removes the timer and cancels all notifications', async () => {
      await startTimer('r1:prep', 'r1', 'Pasta', 5);
      await stopTimer('r1:prep');

      expect(timerStore.getState().timers['r1:prep']).toBeUndefined();
      expect(notificationService.cancelCalls).toContainEqual(['notif-1', 'notif-2', 'notif-3']);
    });

    it('is a no-op when the timer does not exist', async () => {
      await expect(stopTimer('ghost')).resolves.not.toThrow();
    });

    /**
     * Two timers can be ringing at once. Stopping one — from its chip, from the
     * notification's dismiss action, or from the overlay — must take only that
     * alarm off the queue and leave the other one on screen.
     */
    it('takes the stopped timer out of the alarm queue and leaves the rest', async () => {
      await startTimer('r1:prep', 'r1', 'Pasta', 5);
      alarmStore.getState().trigger('r1:prep', 'Pasta');
      alarmStore.getState().trigger('r2:cook', 'Soup');

      await stopTimer('r1:prep');

      expect(alarmStore.getState().alarms.map((a) => a.timerId)).toEqual(['r2:cook']);
    });
  });

  describe('pauseTimer', () => {
    it('pauses a running timer and records remaining time', async () => {
      await startTimer('r1:prep', 'r1', 'Pasta', 5);
      await pauseTimer('r1:prep');

      const entry = timerStore.getState().timers['r1:prep'];
      expect(entry?.isPaused).toBe(true);
      expect(entry?.remainingMsOnPause).toBeGreaterThan(290_000);
    });

    it('is a no-op when already paused', async () => {
      await startTimer('r1:prep', 'r1', 'Pasta', 5);
      await pauseTimer('r1:prep');
      const firstRemaining = timerStore.getState().timers['r1:prep']?.remainingMsOnPause;
      await pauseTimer('r1:prep');
      expect(timerStore.getState().timers['r1:prep']?.remainingMsOnPause).toBe(firstRemaining);
    });
  });

  describe('resumeTimer', () => {
    it('resumes a paused timer with a fresh endTimeMs and new notification ids', async () => {
      await startTimer('r1:prep', 'r1', 'Pasta', 5);
      await pauseTimer('r1:prep');
      const before = Date.now();
      await resumeTimer('r1:prep');

      const entry = timerStore.getState().timers['r1:prep'];
      expect(entry?.isPaused).toBe(false);
      expect(entry?.endTimeMs).toBeGreaterThanOrEqual(before);
      expect(entry?.completionNotifIds).toEqual(['notif-1', 'notif-2', 'notif-3']);
    });

    it('is a no-op when the timer is not paused', async () => {
      await startTimer('r1:prep', 'r1', 'Pasta', 5);
      const originalEnd = timerStore.getState().timers['r1:prep']?.endTimeMs;
      await resumeTimer('r1:prep');
      expect(timerStore.getState().timers['r1:prep']?.endTimeMs).toBe(originalEnd);
    });
  });

  /**
   * A recipe's prep and cook times are consecutive phases of the same dish, so
   * counting both down at once describes a kitchen that cannot exist. The
   * RUNNING one wins: a second start is refused and explained, never granted by
   * discarding the countdown already on the clock — a mistaken tap must not be
   * able to reset a 40-minute bake. Timers on OTHER recipes really do run in
   * parallel and are untouched.
   */
  describe('one timer per recipe', () => {
    it('refuses to start the cook timer while prep is running', async () => {
      await startTimer('r1:prep', 'r1', 'Pasta', 5);

      await startTimer('r1:cook', 'r1', 'Pasta', 20);

      expect(timerStore.getState().timers['r1:cook']).toBeUndefined();
    });

    it('leaves the running timer exactly as it was', async () => {
      await startTimer('r1:prep', 'r1', 'Pasta', 5);
      const running = timerStore.getState().timers['r1:prep'];

      await startTimer('r1:cook', 'r1', 'Pasta', 20);

      expect(timerStore.getState().timers['r1:prep']).toEqual(running);
      expect(notificationService.cancelCalls).toHaveLength(0);
    });

    it('explains why nothing happened', async () => {
      await startTimer('r1:prep', 'r1', 'Pasta', 5);

      await startTimer('r1:cook', 'r1', 'Pasta', 20);

      expect(toastStore.getState().toasts.map((toast) => toast.message)).toContain(
        t().timer.alreadyRunning,
      );
    });

    it('is blocked by a PAUSED timer too, which the user still means to finish', async () => {
      await startTimer('r1:prep', 'r1', 'Pasta', 5);
      await pauseTimer('r1:prep');

      await startTimer('r1:cook', 'r1', 'Pasta', 20);

      expect(timerStore.getState().timers['r1:cook']).toBeUndefined();
      expect(timerStore.getState().timers['r1:prep']).toBeDefined();
    });

    it('starts once the running timer is stopped', async () => {
      await startTimer('r1:prep', 'r1', 'Pasta', 5);
      await startTimer('r1:cook', 'r1', 'Pasta', 20);

      await stopTimer('r1:prep');
      await startTimer('r1:cook', 'r1', 'Pasta', 20);

      expect(timerStore.getState().timers['r1:cook']).toBeDefined();
    });

    it('leaves timers belonging to other recipes running', async () => {
      await startTimer('r2:cook', 'r2', 'Soup', 30);

      await startTimer('r1:cook', 'r1', 'Pasta', 20);

      expect(timerStore.getState().timers['r2:cook']).toBeDefined();
      expect(timerStore.getState().timers['r1:cook']).toBeDefined();
    });

    it('refuses to resume a paused timer while the other phase runs', async () => {
      await startTimer('r1:prep', 'r1', 'Pasta', 5);
      await pauseTimer('r1:prep');
      // The other phase was started elsewhere while this one sat paused.
      await timerStore.getState().add({
        id: 'r1:cook',
        recipeId: 'r1',
        recipeName: 'Pasta',
        durationSeconds: 1200,
        endTimeMs: Date.now() + 1_200_000,
        isPaused: false,
        remainingMsOnPause: 0,
        completionNotifIds: [],
      });

      await resumeTimer('r1:prep');

      expect(timerStore.getState().timers['r1:prep']?.isPaused).toBe(true);
      expect(timerStore.getState().timers['r1:cook']).toBeDefined();
    });

    it('stays quiet when there is nothing in the way', async () => {
      await startTimer('r1:cook', 'r1', 'Pasta', 20);

      expect(toastStore.getState().toasts).toHaveLength(0);
    });
  });

  /**
   * Timer ids are deterministic (`<recipeId>:<slot>`), and the session-wide
   * "already alarmed" set is what stops the one-second sweep re-raising the
   * alarm every tick. Left uncleared, the SECOND run of the same prep timer
   * expired in silence — the alarm overlay never appeared again.
   */
  describe('triggered-alarm marks', () => {
    it('clears the mark when the timer is started again', async () => {
      triggeredAlarms.mark('r1:prep');

      await startTimer('r1:prep', 'r1', 'Pasta', 5);

      expect(triggeredAlarms.has('r1:prep')).toBe(false);
    });

    it('clears the mark when a paused timer is resumed', async () => {
      await startTimer('r1:prep', 'r1', 'Pasta', 5);
      await pauseTimer('r1:prep');
      triggeredAlarms.mark('r1:prep');

      await resumeTimer('r1:prep');

      expect(triggeredAlarms.has('r1:prep')).toBe(false);
    });

    it('clears the mark when the timer is stopped', async () => {
      await startTimer('r1:prep', 'r1', 'Pasta', 5);
      triggeredAlarms.mark('r1:prep');

      await stopTimer('r1:prep');

      expect(triggeredAlarms.has('r1:prep')).toBe(false);
    });
  });
});
