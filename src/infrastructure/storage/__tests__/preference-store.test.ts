/**
 * Preference store adapter tests: each slot must read and write the exact key
 * existing installs already hold, or that setting silently resets for every user.
 */
import { ok } from '@core/result/result-helpers';
import type { KeyValueStoreInterface } from '@domain/storage/key-value-store-interface';
import { PreferenceSlot } from '@domain/storage/preference-slot';
import { PreferenceStore } from '@infrastructure/storage/preference-store';

/** The keys shipped before the port existed — literal on purpose, so a rename fails here. */
const SHIPPED_KEYS = [
  [PreferenceSlot.Timers, 'recipely.timers.v1'],
  [PreferenceSlot.Language, 'recipely.language.v1'],
  [PreferenceSlot.OnboardingSeen, 'recipely.onboarding.seen.v1'],
  [PreferenceSlot.RemindersChoice, 'recipely.reminders.choice.v1'],
  [PreferenceSlot.FirstOpenAt, 'recipely.first-open-at.v1'],
] as const;

const memoryKv = (mem: Map<string, string>): KeyValueStoreInterface => ({
  getItem: async (key) => ok(mem.get(key) ?? null),
  setItem: async (key, value) => {
    mem.set(key, value);
    return ok(undefined);
  },
  removeItem: async (key) => {
    mem.delete(key);
    return ok(undefined);
  },
});

describe('PreferenceStore', () => {
  it.each(SHIPPED_KEYS)("keeps a returning user's %s setting under %s", async (slot, key) => {
    const mem = new Map([[key as string, 'stored-before-upgrade']]);
    const store = new PreferenceStore(memoryKv(mem));

    const read = await store.get(slot);
    await store.set(slot, 'written-after');

    expect(read.ok && read.value).toBe('stored-before-upgrade');
    expect(mem.get(key)).toBe('written-after');
  });

  it('answers null for a slot never written', async () => {
    const read = await new PreferenceStore(memoryKv(new Map())).get(PreferenceSlot.Language);

    expect(read.ok && read.value).toBeNull();
  });
});
