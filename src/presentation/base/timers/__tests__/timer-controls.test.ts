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
   * counting both down at once describes a kitchen that cannot exist. Starting
   * one phase replaces the other; timers on OTHER recipes are untouched,
   * because those really do run in parallel.
   */
  describe('one timer per recipe', () => {
    it('stops the running prep timer when the cook timer starts', async () => {
      await startTimer('r1:prep', 'r1', 'Pasta', 5);

      await startTimer('r1:cook', 'r1', 'Pasta', 20);

      expect(timerStore.getState().timers['r1:prep']).toBeUndefined();
      expect(timerStore.getState().timers['r1:cook']).toBeDefined();
    });

    it('cancels the replaced timer’s notifications rather than orphaning them', async () => {
      await startTimer('r1:prep', 'r1', 'Pasta', 5);

      await startTimer('r1:cook', 'r1', 'Pasta', 20);

      expect(notificationService.cancelCalls).toContainEqual(['notif-1', 'notif-2', 'notif-3']);
    });

    it('replaces a PAUSED timer too, so resuming it cannot revive the pair', async () => {
      await startTimer('r1:prep', 'r1', 'Pasta', 5);
      await pauseTimer('r1:prep');

      await startTimer('r1:cook', 'r1', 'Pasta', 20);

      expect(timerStore.getState().timers['r1:prep']).toBeUndefined();
    });

    it('leaves timers belonging to other recipes running', async () => {
      await startTimer('r2:cook', 'r2', 'Soup', 30);

      await startTimer('r1:cook', 'r1', 'Pasta', 20);

      expect(timerStore.getState().timers['r2:cook']).toBeDefined();
      expect(timerStore.getState().timers['r1:cook']).toBeDefined();
    });

    it('applies the rule when a paused timer is resumed', async () => {
      await startTimer('r1:prep', 'r1', 'Pasta', 5);
      await pauseTimer('r1:prep');
      await startTimer('r1:cook', 'r1', 'Pasta', 20);
      // The cook timer replaced prep, so put prep back and pause it by hand:
      // this is the "other phase was started while I sat paused" case.
      await timerStore.getState().add({
        id: 'r1:prep',
        recipeId: 'r1',
        recipeName: 'Pasta',
        durationSeconds: 300,
        endTimeMs: Date.now() + 300_000,
        isPaused: true,
        remainingMsOnPause: 300_000,
        completionNotifIds: [],
      });

      await resumeTimer('r1:prep');

      expect(timerStore.getState().timers['r1:cook']).toBeUndefined();
      expect(timerStore.getState().timers['r1:prep']?.isPaused).toBe(false);
    });

    it('tells the user which way the switch went', async () => {
      await startTimer('r1:prep', 'r1', 'Pasta', 5);
      toastStore.setState({ toasts: [] });

      await startTimer('r1:cook', 'r1', 'Pasta', 20);

      expect(toastStore.getState().toasts.map((toast) => toast.message)).toContain(
        t().timer.switched,
      );
    });

    it('stays quiet when there was nothing to replace', async () => {
      toastStore.setState({ toasts: [] });

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
