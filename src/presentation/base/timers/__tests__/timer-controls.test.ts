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
});
