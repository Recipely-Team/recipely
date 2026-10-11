import { act } from 'react-test-renderer';
import type { ApplicationStores } from '@application/di/application-stores';
import { authStoreOf } from '@presentation/base/test-support/auth-store-of';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { RootTabBar } from '@presentation/base/widgets/navigation/root-tab-bar';
import { TabBarKey } from '@presentation/base/widgets/navigation/tab-bar-key';
import { t } from '@presentation/i18n';
import { UserEntity } from '@domain/auth/user-entity';
import { Email } from '@domain/common/email';

const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  usePathname: jest.fn(() => '/recipes'),
  useRouter: jest.fn(() => ({ replace: mockReplace, push: mockPush })),
}));

const signedInUser = (): UserEntity => {
  const email = Email.create('cook@example.com');
  if (!email.ok) throw new Error('fixture email invalid');
  const user = UserEntity.create({ id: 'u1', email: email.value, displayName: 'Cook' });
  if (!user.ok) throw new Error('fixture user invalid');
  return user.value;
};

const pressTab = (root: ReturnType<typeof renderComponent>['root'], label: string): void => {
  const tab = root.find((node) => node.props.accessibilityRole === 'tab' && node.props.accessibilityLabel === label);
  act(() => (tab.props.onPress as () => void)());
};

/**
 * Reported as: "I tapped Diary and got a login screen with no tab bar and no
 * idea why." A guest's press on an account tab was answered by the auth guard's
 * silent bounce to /login. The bar now keeps the guest where they are and the
 * sign-in sheet says what the tab holds; Sign in returns them to it afterwards.
 */
describe('RootTabBar — a guest on an account tab', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockPush.mockClear();
  });

  it.each([
    [TabBarKey.MyRecipes, () => t().navigation.myRecipes, () => t().signInPrompt.myRecipes],
    [TabBarKey.Diary, () => t().navigation.diary, () => t().signInPrompt.diary],
    [TabBarKey.Profile, () => t().navigation.profile, () => t().signInPrompt.profile],
  ])('explains %s instead of navigating', (_key, label, reason) => {
    const { root } = renderComponent(<RootTabBar />, { authStore: authStoreOf(null) } as Partial<ApplicationStores>);

    pressTab(root, label());

    expect(mockReplace).not.toHaveBeenCalled();
    expect(textContent(root)).toContain(reason());
  });

  it('sends the guest to sign in with the tab as the way back', () => {
    const { root } = renderComponent(<RootTabBar />, { authStore: authStoreOf(null) } as Partial<ApplicationStores>);
    pressTab(root, t().navigation.diary);

    const signIn = root.findAll(
      (node) => node.props.accessibilityRole === 'button' && textContent(node).includes(t().signInPrompt.cta),
    )[0];
    act(() => (signIn?.props.onPress as () => void)());

    expect(mockPush).toHaveBeenCalledWith('/login?redirect=%2Fdiary');
  });

  it('still lets a guest switch to a public tab', () => {
    const { root } = renderComponent(<RootTabBar />, { authStore: authStoreOf(null) } as Partial<ApplicationStores>);

    pressTab(root, t().navigation.chefs);

    expect(mockReplace).toHaveBeenCalledWith('/creators');
  });

  it('navigates straight away for a signed-in user', () => {
    const { root } = renderComponent(<RootTabBar />, { authStore: authStoreOf(signedInUser()) } as Partial<ApplicationStores>);

    pressTab(root, t().navigation.diary);

    expect(mockReplace).toHaveBeenCalledWith('/diary');
  });
});
