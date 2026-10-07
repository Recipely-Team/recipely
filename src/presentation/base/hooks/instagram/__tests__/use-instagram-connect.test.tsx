/* eslint-disable import/first -- jest.mock() must be hoisted above imports */
jest.mock('@presentation/base/utils/instagram/open-instagram-login', () => ({ openInstagramLogin: jest.fn() }));
jest.mock('@presentation/base/utils/instagram/instagram-return-url', () => ({ instagramReturnUrl: () => 'recipely://instagram-connected' }));
jest.mock('@presentation/base/feedback/show-toast', () => ({
  showErrorToast: jest.fn(),
  showSuccessToast: jest.fn(),
  showWarningToast: jest.fn(),
}));

import { act } from 'react-test-renderer';
import { NotFoundFailure, ErrorMessageKey } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import { CreatorTagOutcome } from '@domain/instagram/connect/creator-tag-outcome';
import type { ApplicationStores } from '@application/di/application-stores';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { instagramStoreOf } from '@presentation/base/test-support/instagram-store-of';
import { connectionOf } from '@application/instagram/__fixtures__/instagram-fixtures';
import { openInstagramLogin } from '@presentation/base/utils/instagram/open-instagram-login';
import { showErrorToast, showSuccessToast, showWarningToast } from '@presentation/base/feedback/show-toast';
import { useInstagramConnect } from '@presentation/base/hooks/instagram/use-instagram-connect';
import { InstagramConnectPhase } from '@presentation/base/widgets/instagram/instagram-connect-phase';
import { t } from '@presentation/i18n';

const openLogin = jest.mocked(openInstagramLogin);

const setup = () => {
  const instagram = instagramStoreOf(connectionOf({ connected: false, status: null }));
  instagram.repo.finalize.mockResolvedValue(ok({ connection: connectionOf(), creatorTag: CreatorTagOutcome.Approved }));
  const refreshCreatorClaim = jest.fn().mockResolvedValue(null);
  const authStore = { getState: () => ({ refreshCreatorClaim }) };
  const hook: { current: ReturnType<typeof useInstagramConnect> | null } = { current: null };
  const Probe = (): null => {
    hook.current = useInstagramConnect();
    return null;
  };
  renderComponent(<Probe />, { instagramStore: instagram.store, authStore } as unknown as Partial<ApplicationStores>);
  const connect = async (): Promise<void> => {
    await act(async () => hook.current?.connect());
    await act(async () => undefined);
  };
  return { instagram, refreshCreatorClaim, hook, connect };
};

describe('useInstagramConnect', () => {
  beforeEach(() => jest.clearAllMocks());

  it('asks for the login with this app’s return link, finishes with the code it came back with, and re-reads the claims', async () => {
    openLogin.mockResolvedValue('recipely://instagram-connected?status=authorized&code=one-time');
    const { instagram, refreshCreatorClaim, hook, connect } = setup();
    await connect();
    expect(instagram.repo.startLogin).toHaveBeenCalledWith('recipely://instagram-connected');
    expect(openLogin).toHaveBeenCalledWith('https://www.instagram.com/oauth/authorize', 'recipely://instagram-connected');
    expect(instagram.repo.finalize).toHaveBeenCalledWith('one-time');
    expect(refreshCreatorClaim).toHaveBeenCalled();
    expect(showSuccessToast).toHaveBeenCalledWith(t().instagram.connectedToast);
    expect(hook.current?.phase).toBe(InstagramConnectPhase.Idle);
  });

  it('reads a closed login and a refusal as cancelled, linking nothing', async () => {
    openLogin.mockResolvedValueOnce(null).mockResolvedValueOnce('recipely://instagram-connected?status=error&reason=denied');
    const { instagram, hook, connect } = setup();
    await connect();
    expect(hook.current?.phase).toBe(InstagramConnectPhase.Cancelled);
    await connect();
    expect(hook.current?.phase).toBe(InstagramConnectPhase.Cancelled);
    expect(instagram.repo.finalize).not.toHaveBeenCalled();
  });

  it('says so when Instagram could not finish, and when the code is spent', async () => {
    openLogin.mockResolvedValueOnce('recipely://instagram-connected?status=error&reason=failed');
    const { instagram, connect } = setup();
    await connect();
    expect(showWarningToast).toHaveBeenCalledWith(t().instagram.loginFailed);

    const spent = new NotFoundFailure('gone', ErrorMessageKey.instagramLinkInvalid);
    instagram.repo.finalize.mockResolvedValueOnce(fail(spent));
    openLogin.mockResolvedValueOnce('recipely://instagram-connected?status=authorized&code=old');
    await connect();
    expect(showErrorToast).toHaveBeenCalledWith(spent);
  });

  it('warns when the account is linked but its handle is another creator’s tag', async () => {
    openLogin.mockResolvedValue('recipely://instagram-connected?status=authorized&code=c');
    const { instagram, connect } = setup();
    instagram.repo.finalize.mockResolvedValue(ok({ connection: connectionOf(), creatorTag: CreatorTagOutcome.Taken }));
    await connect();
    expect(showWarningToast).toHaveBeenCalledWith(t().instagram.tagTakenToast.replace('{h}', '@mertmutfakta'));
  });
});
