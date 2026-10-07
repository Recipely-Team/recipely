/**
 * Onboarding store unit tests — the device-scoped "don't show again" gate.
 */
import { container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import { FakePreferenceStore } from '@application/__fixtures__/fake-preference-store';
import { PreferenceSlot } from '@domain/storage/preference-slot';
import { onboardingStore } from '@application/onboarding/onboarding-store';

// Register the shared in-memory key-value store under the DI token so the
// store's `getPreferenceStore()` accessor resolves it instead of the platform
// backend.
const fakePrefs = new FakePreferenceStore();

const resetAll = (): void => {
  container.register(TOKENS.PreferenceStore, () => fakePrefs);
  onboardingStore.setState({ hydrated: false, dismissed: false });
  fakePrefs.clear();
};

describe('onboardingStore', () => {
  beforeEach(resetAll);

  describe('hydrate', () => {
    it('resolves as not-dismissed when nothing is persisted', async () => {
      await onboardingStore.getState().hydrate();
      const state = onboardingStore.getState();
      expect(state.hydrated).toBe(true);
      expect(state.dismissed).toBe(false);
    });

    it('resolves as dismissed when the seen marker is persisted', async () => {
      fakePrefs.seed(PreferenceSlot.OnboardingSeen, '1');
      await onboardingStore.getState().hydrate();
      const state = onboardingStore.getState();
      expect(state.hydrated).toBe(true);
      expect(state.dismissed).toBe(true);
    });

    it('treats an unrelated stored value as not-dismissed', async () => {
      fakePrefs.seed(PreferenceSlot.OnboardingSeen, '0');
      await onboardingStore.getState().hydrate();
      expect(onboardingStore.getState().dismissed).toBe(false);
    });

    it('still marks hydrated when the read throws', async () => {
      jest.spyOn(fakePrefs, 'get').mockRejectedValueOnce(new Error('boom'));
      await onboardingStore.getState().hydrate();
      const state = onboardingStore.getState();
      expect(state.hydrated).toBe(true);
      expect(state.dismissed).toBe(false);
    });
  });

  describe('dismiss', () => {
    it('flips the in-memory flag and persists the seen marker', async () => {
      await onboardingStore.getState().dismiss();
      expect(onboardingStore.getState().dismissed).toBe(true);
      expect(fakePrefs.peek(PreferenceSlot.OnboardingSeen)).toBe('1');
    });

    it('keeps the flag set even when persistence fails', async () => {
      jest.spyOn(fakePrefs, 'set').mockRejectedValueOnce(new Error('boom'));
      await onboardingStore.getState().dismiss();
      expect(onboardingStore.getState().dismissed).toBe(true);
    });
  });
});
