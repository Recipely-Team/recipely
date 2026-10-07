import { act } from 'react-test-renderer';
import { create } from 'zustand';
import type { ApplicationStores } from '@application/di/application-stores';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { RoutePaths } from '@presentation/base/constants';
import { t } from '@presentation/i18n';
import { ForgotPasswordScreen } from '@presentation/app/forgot-password';

const mockRouter = { back: jest.fn(), replace: jest.fn(), push: jest.fn(), canGoBack: jest.fn(() => false) };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

/**
 * Review finding: back called `router.back()` unconditionally, so on the web a
 * reload or a direct visit to /forgot-password (no history) made the back
 * button and "Back to login" do nothing.
 */
describe('ForgotPasswordScreen', () => {
  it('goes to login when there is no history to go back to', () => {
    const stores = { authStore: create(() => ({ requestPasswordReset: jest.fn() })) } as unknown as Partial<ApplicationStores>;
    const { root } = renderComponent(<ForgotPasswordScreen />, stores);
    const [back] = root.findAll((node) => node.props.accessibilityLabel === t().forgotPassword.backToLogin && typeof node.props.onPress === 'function');

    act(() => (back!.props.onPress as () => void)());

    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith(RoutePaths.login);
  });
});
