/**
 * The verify screen opened from the registration email's link: it finishes on
 * arrival, sends the single-use token once, and offers a fresh start when the
 * link is dead.
 */
import { act } from 'react-test-renderer';
import { ErrorMessageKey, NotFoundFailure } from '@core/failure';
import { RoutePaths } from '@presentation/base/constants';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { authStoreOf } from '@presentation/base/test-support/auth-store-of';
import { VerifyLinkCard } from '@presentation/app/verify-code/body/verify-link-card';
import { t } from '@presentation/i18n';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));

const TOKEN = 'A'.repeat(43);

describe('VerifyLinkCard', () => {
  beforeEach(() => mockReplace.mockClear());

  it('finishes the registration from the token as soon as it opens, once', async () => {
    const verifyRegistrationLink = jest.fn(async () => null);
    const authStore = authStoreOf(null, { verifyRegistrationLink });

    const { root } = renderComponent(<VerifyLinkCard token={TOKEN} />, { authStore });
    await act(async () => {});
    await act(async () => {});

    expect(verifyRegistrationLink).toHaveBeenCalledTimes(1);
    expect(verifyRegistrationLink).toHaveBeenCalledWith(TOKEN);
    expect(textContent(root)).toContain(t().verify.linkFinishing);
  });

  it('says the link expired and offers to start again', async () => {
    const failure = new NotFoundFailure('gone', ErrorMessageKey.registrationLinkExpired);
    const authStore = authStoreOf(null, { verifyRegistrationLink: jest.fn(async () => failure) });

    const { root } = renderComponent(<VerifyLinkCard token={TOKEN} />, { authStore });
    await act(async () => {});

    expect(textContent(root)).toContain(t().errors.registrationLinkExpired.short);
    const startAgain = root.find((node) => node.props['label'] === t().verify.startAgain && typeof node.props['onPress'] === 'function');
    act(() => (startAgain.props['onPress'] as () => void)());
    expect(mockReplace).toHaveBeenCalledWith(RoutePaths.register);
  });
});
