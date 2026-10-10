import { act } from 'react-test-renderer';
import { create } from 'zustand';
import type { ApplicationStores } from '@application/di/application-stores';
import { StoreStatus } from '@application/store/store-status';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { ProfileSettingsSections } from '@presentation/app/profile/body/profile-settings-sections';
import { t } from '@presentation/i18n';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), replace: jest.fn() })),
}));
jest.mock('@presentation/app/profile/sheets/feedback-sheet', () => ({ FeedbackSheet: () => null }));

/**
 * Reported as: "I said yes to reminders and can't find where to turn them off."
 * The reminders switch lived only on `/settings`, which nothing links to; the
 * settings list Profile actually shows had no reminders section at all.
 */
describe('ProfileSettingsSections — reminders', () => {
  it('shows the recipe reminders switch', async () => {
    const getRemindersEnabled = { execute: jest.fn(() => Promise.resolve(true)) };
    const stores = {
      authStore: create(() => ({ state: { status: StoreStatus.Unauthenticated }, signOut: jest.fn() })),
      getRemindersEnabled,
      setRemindersChoice: { execute: jest.fn(() => Promise.resolve(true)) },
    } as unknown as Partial<ApplicationStores>;

    const { root } = renderComponent(<ProfileSettingsSections />, stores);
    await act(async () => Promise.resolve());

    expect(textContent(root)).toContain(t().reminders.setting);
    expect(getRemindersEnabled.execute).toHaveBeenCalled();
  });
});
