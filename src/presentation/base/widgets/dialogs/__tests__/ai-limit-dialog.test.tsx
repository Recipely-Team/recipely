import { act } from 'react-test-renderer';
import { configureAiLimitStore } from '@application/subscriptions/ai-limit-store';
import type { ApplicationStores } from '@application/di/application-stores';
import { renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { AiLimitDialog } from '@presentation/base/widgets/dialogs/ai-limit-dialog';
import { RoutePaths } from '@presentation/base/constants';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/recipes',
}));

const DAILY = { scope: 'daily' as const, limit: 200, used: 200, resetsAt: new Date('2026-11-15T00:00:00.000Z') };

const mount = () => {
  const aiLimitStore = configureAiLimitStore();
  const view = renderComponent(<AiLimitDialog />, { aiLimitStore } as Partial<ApplicationStores>);
  return { aiLimitStore, ...view };
};

/** Spec §2: the free cap says which limit, how much was used, when it resets, and offers Premium. */
describe('AiLimitDialog', () => {
  beforeEach(() => mockPush.mockReset());

  it('renders nothing until a request is refused for the cap', () => {
    const { root } = mount();
    expect(textContent(root)).toEqual([]);
  });

  it('says which limit, with the server counts, and Upgrade closes it before opening Premium', () => {
    const { root, aiLimitStore } = mount();
    act(() => aiLimitStore.getState().report(DAILY));

    const text = textContent(root);
    expect(text).toContain('Daily AI limit reached');
    expect(text).toContain('You used all 200 AI requests included in the free plan today.');
    expect(text).toContain('200 / 200');
    expect(text).toContain('Free plan: 200 per day, 2,000 per month');

    const upgrade = root.find((node) => node.props['accessibilityRole'] === 'button' && textContent(node).includes('Upgrade to Premium'));
    act(() => (upgrade.props['onPress'] as () => void)());
    expect(aiLimitStore.getState().limit).toBeNull();
    expect(mockPush).toHaveBeenCalledWith(RoutePaths.premium);
  });

  it('"Got it" just closes it', () => {
    const { root, aiLimitStore } = mount();
    act(() => aiLimitStore.getState().report({ ...DAILY, scope: 'monthly', limit: 2000, used: 2000 }));
    expect(textContent(root)).toContain('Monthly AI limit reached');

    const gotIt = root.find((node) => node.props['accessibilityRole'] === 'button' && node.props['accessibilityLabel'] === undefined && textContent(node).includes('Got it'));
    act(() => (gotIt.props['onPress'] as () => void)());
    expect(aiLimitStore.getState().limit).toBeNull();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
