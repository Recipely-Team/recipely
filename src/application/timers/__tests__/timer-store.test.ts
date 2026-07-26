/**
 * Timer store unit tests.
 */
/* eslint-disable import/first -- jest.mock() must be hoisted above imports */

jest.mock('@infrastructure/constants/storage', () => ({
  SESSION_STORAGE_KEY: 'recipely.session.v1',
  TIMERS_STORAGE_KEY: 'recipely.timers.v1',
}));

import { container } from '@core/di/container-instance';
import { TOKENS } from '@application/di/tokens';
import { FakeKeyValueStore } from '@application/__fixtures__/fake-key-value-store';
import { timerStore } from '@application/timers/timer-store';
import type { TimerEntry } from '@application/timers/timer-entry';

// Register the shared in-memory key-value store under the DI token so the
// store's `getKeyValueStore()` accessor resolves it instead of the platform
// backend. `peek`/`seed` read and plant the persisted JSON in assertions.
const fakeKvStore = new FakeKeyValueStore();

const makeEntry = (overrides: Partial<TimerEntry> = {}): TimerEntry => ({
  id: 'recipe1:step0:5min',
  recipeId: 'recipe1',
  recipeName: 'Pasta',
  durationSeconds: 300,
  endTimeMs: Date.now() + 300_000,
  isPaused: false,
  remainingMsOnPause: 0,
  completionNotifIds: ['notif-1', 'notif-2'],
  ...overrides,
});

const resetAll = (): void => {
  container.register(TOKENS.KeyValueStore, () => fakeKvStore);
  timerStore.setState({ timers: {}, hydrated: false });
  fakeKvStore.clear();
};

describe('timerStore', () => {
  beforeEach(resetAll);

  describe('add', () => {
    it('stores the entry in memory', async () => {
      const entry = makeEntry();
      await timerStore.getState().add(entry);
      expect(timerStore.getState().timers[entry.id]).toEqual(entry);
    });

    it('persists to kv-store', async () => {
      const entry = makeEntry();
      await timerStore.getState().add(entry);
      const persisted = JSON.parse(fakeKvStore.peek('recipely.timers.v1') ?? '{}') as Record<string, TimerEntry>;
      expect(persisted[entry.id]).toEqual(entry);
    });

    it('allows multiple active timers', async () => {
      const a = makeEntry({ id: 'r1:step0:5min', recipeId: 'r1' });
      const b = makeEntry({ id: 'r2:step1:10min', recipeId: 'r2', durationSeconds: 600 });
      await timerStore.getState().add(a);
      await timerStore.getState().add(b);
      expect(Object.keys(timerStore.getState().timers)).toHaveLength(2);
    });
  });

  describe('remove', () => {
    it('deletes the entry from memory and storage', async () => {
      const entry = makeEntry();
      await timerStore.getState().add(entry);
      await timerStore.getState().remove(entry.id);
      expect(timerStore.getState().timers[entry.id]).toBeUndefined();
      const persisted = JSON.parse(fakeKvStore.peek('recipely.timers.v1') ?? '{}') as Record<string, TimerEntry>;
      expect(persisted[entry.id]).toBeUndefined();
    });

    it('is a no-op when the entry does not exist', async () => {
      await expect(timerStore.getState().remove('nonexistent')).resolves.not.toThrow();
    });
  });

  describe('pause', () => {
    it('sets isPaused and records remainingMsOnPause', async () => {
      const now = Date.now();
      const entry = makeEntry({ endTimeMs: now + 120_000 });
      await timerStore.getState().add(entry);
      await timerStore.getState().pause(entry.id);
      const updated = timerStore.getState().timers[entry.id];
      expect(updated?.isPaused).toBe(true);
      expect(updated?.remainingMsOnPause).toBeGreaterThan(119_000);
      expect(updated?.remainingMsOnPause).toBeLessThanOrEqual(120_000);
    });

    it('persists paused state', async () => {
      const entry = makeEntry({ endTimeMs: Date.now() + 60_000 });
      await timerStore.getState().add(entry);
      await timerStore.getState().pause(entry.id);
      const persisted = JSON.parse(fakeKvStore.peek('recipely.timers.v1') ?? '{}') as Record<string, TimerEntry>;
      expect(persisted[entry.id]?.isPaused).toBe(true);
    });

    it('is a no-op when entry does not exist', async () => {
      await expect(timerStore.getState().pause('ghost')).resolves.not.toThrow();
    });

    it('is a no-op when already paused', async () => {
      const entry = makeEntry({ isPaused: true, remainingMsOnPause: 60_000 });
      await timerStore.getState().add(entry);
      await timerStore.getState().pause(entry.id);
      expect(timerStore.getState().timers[entry.id]?.remainingMsOnPause).toBe(60_000);
    });
  });

  describe('resume', () => {
    it('clears isPaused and sets new endTimeMs', async () => {
      const entry = makeEntry({ isPaused: true, remainingMsOnPause: 90_000 });
      await timerStore.getState().add(entry);
      const newEnd = Date.now() + 90_000;
      await timerStore.getState().resume(entry.id, newEnd);
      const updated = timerStore.getState().timers[entry.id];
      expect(updated?.isPaused).toBe(false);
      expect(updated?.endTimeMs).toBe(newEnd);
    });

    it('persists resumed state', async () => {
      const entry = makeEntry({ isPaused: true, remainingMsOnPause: 30_000 });
      await timerStore.getState().add(entry);
      const newEnd = Date.now() + 30_000;
      await timerStore.getState().resume(entry.id, newEnd);
      const persisted = JSON.parse(fakeKvStore.peek('recipely.timers.v1') ?? '{}') as Record<string, TimerEntry>;
      expect(persisted[entry.id]?.isPaused).toBe(false);
      expect(persisted[entry.id]?.endTimeMs).toBe(newEnd);
    });

    it('is a no-op when entry does not exist', async () => {
      await expect(timerStore.getState().resume('ghost', Date.now() + 1000)).resolves.not.toThrow();
    });

    it('is a no-op when entry is not paused', async () => {
      const originalEnd = Date.now() + 60_000;
      const entry = makeEntry({ isPaused: false, endTimeMs: originalEnd });
      await timerStore.getState().add(entry);
      await timerStore.getState().resume(entry.id, Date.now() + 999_000);
      expect(timerStore.getState().timers[entry.id]?.endTimeMs).toBe(originalEnd);
    });
  });

  describe('hydrate', () => {
    it('sets hydrated = true even when storage is empty', async () => {
      await timerStore.getState().hydrate();
      expect(timerStore.getState().hydrated).toBe(true);
    });

    it('restores active timers', async () => {
      const entry = makeEntry({ endTimeMs: Date.now() + 300_000 });
      fakeKvStore.seed('recipely.timers.v1', JSON.stringify({ [entry.id]: entry }));
      await timerStore.getState().hydrate();
      expect(timerStore.getState().timers[entry.id]).toBeDefined();
    });

    it('keeps expired timers so the alarm can be triggered', async () => {
      const entry = makeEntry({ endTimeMs: Date.now() - 1000, isPaused: false });
      fakeKvStore.seed('recipely.timers.v1', JSON.stringify({ [entry.id]: entry }));
      await timerStore.getState().hydrate();
      expect(timerStore.getState().timers[entry.id]).toBeDefined();
    });

    it('keeps paused timers regardless of endTimeMs', async () => {
      const entry = makeEntry({ endTimeMs: Date.now() - 5000, isPaused: true, remainingMsOnPause: 60_000 });
      fakeKvStore.seed('recipely.timers.v1', JSON.stringify({ [entry.id]: entry }));
      await timerStore.getState().hydrate();
      expect(timerStore.getState().timers[entry.id]?.isPaused).toBe(true);
    });

    it('handles corrupt storage without throwing', async () => {
      fakeKvStore.seed('recipely.timers.v1', 'NOT_VALID_JSON{{');
      await expect(timerStore.getState().hydrate()).resolves.not.toThrow();
      expect(timerStore.getState().hydrated).toBe(true);
    });

    it('handles multiple concurrent timers', async () => {
      const entries: Record<string, TimerEntry> = {};
      for (let i = 0; i < 5; i++) {
        const e = makeEntry({ id: `r${String(i)}:step0:5min`, recipeId: `r${String(i)}` });
        entries[e.id] = e;
      }
      fakeKvStore.seed('recipely.timers.v1', JSON.stringify(entries));
      await timerStore.getState().hydrate();
      expect(Object.keys(timerStore.getState().timers)).toHaveLength(5);
    });
  });
});
