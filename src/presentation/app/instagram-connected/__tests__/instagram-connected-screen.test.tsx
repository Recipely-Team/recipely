/* eslint-disable import/first -- jest.mock() must be hoisted above imports */
const mockRouter = { back: jest.fn(), replace: jest.fn(), canGoBack: () => true };
let mockParams: Record<string, string> = {};
let mockWeb = false;
jest.mock('expo-router', () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockParams }));
jest.mock('@infrastructure/constants/platform', () => ({ isWeb: () => mockWeb, isIos: () => false, isAndroid: () => !mockWeb }));
jest.mock('@presentation/base/feedback/show-toast', () => ({ showErrorToast: jest.fn(), showSuccessToast: jest.fn(), showWarningToast: jest.fn() }));

import { act } from 'react-test-renderer';
import { create } from 'zustand';
import { ok } from '@core/result/result-helpers';
import { StoreStatus } from '@application/store/store-status';
import { CreatorTagOutcome } from '@domain/instagram/connect/creator-tag-outcome';
import { connectionOf } from '@application/instagram/__fixtures__/instagram-fixtures';
import type { StoresType } from '@presentation/bootstrap/stores';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { instagramStoreOf } from '@presentation/base/test-support/instagram-store-of';
import { showWarningToast } from '@presentation/base/feedback/show-toast';
import { InstagramLoginInFlight } from '@presentation/base/utils/instagram/instagram-login-in-flight';
import { InstagramConnectedScreen } from '@presentation/app/instagram-connected';
import { t } from '@presentation/i18n';

const setup = (status: string) => {
  const instagram = instagramStoreOf(connectionOf({ connected: false, status: null }));
  instagram.repo.finalize.mockResolvedValue(ok({ connection: connectionOf(), creatorTag: CreatorTagOutcome.Approved }));
  const authStore = create(() => ({ state: { status }, refreshCreatorClaim: jest.fn().mockResolvedValue(null) }));
  renderComponent(<InstagramConnectedScreen />, { instagramStore: instagram.store, authStore } as unknown as Partial<StoresType>);
  return { instagram, authStore };
};

describe('InstagramConnectedScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = { status: 'authorized', code: 'one-time' };
  });

  // Android routes the return link to the app as well; a cold start has no login behind it.
  it('on a phone never finishes the code, and says the login did not finish when no login is open', async () => {
    mockWeb = false;
    const { instagram } = setup(StoreStatus.Authenticated);
    await act(async () => undefined);
    expect(instagram.repo.finalize).not.toHaveBeenCalled();
    expect(showWarningToast).toHaveBeenCalledWith(t().instagram.loginNotFinished);
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('on a phone stays quiet while the auth session it came from is finishing', async () => {
    mockWeb = false;
    InstagramLoginInFlight.begin();
    try {
      setup(StoreStatus.Authenticated);
      await act(async () => undefined);
      expect(showWarningToast).not.toHaveBeenCalled();
    } finally {
      InstagramLoginInFlight.end();
    }
  });

  it('on the web waits for the session, then finishes the code once', async () => {
    mockWeb = true;
    const { instagram, authStore } = setup(StoreStatus.Loading);
    await act(async () => undefined);
    expect(instagram.repo.finalize).not.toHaveBeenCalled();
    await act(async () => authStore.setState({ state: { status: StoreStatus.Authenticated } }));
    await act(async () => authStore.setState({ state: { status: StoreStatus.Authenticated } }));
    expect(instagram.repo.finalize).toHaveBeenCalledTimes(1);
    expect(instagram.repo.finalize).toHaveBeenCalledWith('one-time');
    expect(mockRouter.replace).toHaveBeenCalledWith('/edit-profile?section=creator');
  });
});
