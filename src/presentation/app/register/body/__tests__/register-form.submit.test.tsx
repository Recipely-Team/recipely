import { act, type ReactTestInstance } from 'react-test-renderer';
import type { ApplicationStores } from '@application/di/application-stores';
import { ok } from '@core/result/result-helpers';
import { authStoreOf } from '@presentation/base/test-support/auth-store-of';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { RegisterForm } from '@presentation/app/register/body/register-form';
import { t } from '@presentation/i18n';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn(), canGoBack: () => true }),
  useLocalSearchParams: () => ({ redirect: '/recipes/42' }),
}));

const type = (root: ReactTestInstance, placeholder: string, text: string): void => {
  const field = root.find((n) => n.props.placeholder === placeholder && typeof n.props.onChangeText === 'function');
  act(() => (field.props.onChangeText as (v: string) => void)(text));
};

const pressSignUp = async (root: ReactTestInstance): Promise<void> => {
  const button = root.findAll(
    (n) => n.props.accessibilityRole === 'button' && typeof n.props.onPress === 'function' && textContent(n).includes(t().register.signUp),
  )[0];
  await act(async () => (button?.props.onPress as () => void)());
};

describe('RegisterForm — Sign up', () => {
  beforeEach(() => mockPush.mockClear());

  /**
   * Reported as: "the Sign up button does nothing." It stayed disabled until
   * every rule passed, and the message naming the failing rule only appeared
   * from the keyboard's Return key — a forgotten terms box read as a dead button.
   */
  it('stays pressable on an incomplete form and says which rule failed', async () => {
    const register = jest.fn();
    const { root } = renderComponent(<RegisterForm />, { authStore: authStoreOf(null, { register }) } as Partial<ApplicationStores>);

    await pressSignUp(root);

    expect(register).not.toHaveBeenCalled();
    expect(textContent(root)).toContain(t().register.errorName);
  });

  /**
   * Reported as: "I signed up to save a recipe and ended up on the feed." The
   * register → verify path dropped the redirect login had been given.
   */
  it('carries the post-sign-in redirect on to verify-code', async () => {
    const register = jest.fn(async () => ok({ email: 'cook@example.com', expiresInSeconds: 600, expiresAt: '2026-10-10T12:00:00.000Z' }));
    const { root } = renderComponent(<RegisterForm />, { authStore: authStoreOf(null, { register }) } as Partial<ApplicationStores>);

    type(root, t().register.namePlaceholder, 'Cook');
    type(root, t().register.emailPlaceholder, 'cook@example.com');
    type(root, t().register.passwordPlaceholder, 'Sup3r-secret!');
    type(root, t().register.confirmPlaceholder, 'Sup3r-secret!');
    const terms = root.find((n) => n.props.accessibilityRole === 'checkbox' && typeof n.props.onPress === 'function');
    act(() => (terms.props.onPress as () => void)());
    await pressSignUp(root);

    expect(register).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ params: expect.objectContaining({ redirect: '/recipes/42' }) }),
    );
  });
});
