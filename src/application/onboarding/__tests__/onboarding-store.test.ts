/**
 * Onboarding store unit tests — the device-scoped "don't show again" gate.
 */
import { container } from '@core/di/container';
import { TOKENS } from '@application/di/tokens';
import { FakeKeyValueStore } from '@application/__fixtures__/fake-key-value-store';
import { ONBOARDING_SEEN_STORAGE_KEY } from '@infrastructure/constants/storage';
import { onboardingStore } from '@application/onboarding/onboarding-store';

// Register the shared in-memory key-value store under the DI token so the
// store's `getKeyValueStore()` accessor resolves it instead of the platform
// backend.
const fakeKvStore = new FakeKeyValueStore();

const resetAll = (): void => {
  container.register(TOKENS.KeyValueStore, () => fakeKvStore);
  onboardingStore.setState({ hydrated: false, dismissed: false });
  fakeKvStore.clear();
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
      fakeKvStore.seed(ONBOARDING_SEEN_STORAGE_KEY, '1');
      await onboardingStore.getState().hydrate();
      const state = onboardingStore.getState();
      expect(state.hydrated).toBe(true);
      expect(state.dismissed).toBe(true);
    });

    it('treats an unrelated stored value as not-dismissed', async () => {
      fakeKvStore.seed(ONBOARDING_SEEN_STORAGE_KEY, '0');
      await onboardingStore.getState().hydrate();
      expect(onboardingStore.getState().dismissed).toBe(false);
    });

    it('still marks hydrated when the read throws', async () => {
      jest.spyOn(fakeKvStore, 'getItem').mockRejectedValueOnce(new Error('boom'));
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
      expect(fakeKvStore.peek(ONBOARDING_SEEN_STORAGE_KEY)).toBe('1');
    });

    it('keeps the flag set even when persistence fails', async () => {
      jest.spyOn(fakeKvStore, 'setItem').mockRejectedValueOnce(new Error('boom'));
      await onboardingStore.getState().dismiss();
      expect(onboardingStore.getState().dismissed).toBe(true);
    });
  });
});
