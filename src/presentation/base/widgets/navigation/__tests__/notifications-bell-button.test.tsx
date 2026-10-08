import { act } from 'react-test-renderer';
import { byRole, renderComponent, textContent } from '@presentation/base/test-support/render-component';
import { NotificationsBellButton } from '@presentation/base/widgets/navigation/notifications-bell-button';
import { t } from '@presentation/i18n';

let mockUnread = 0;
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: mockPush })),
}));
jest.mock('@presentation/bootstrap/use-stores', () => ({
  useStores: jest.fn(() => ({
    notificationsStore: jest.fn((selector: (state: { unreadCount: number }) => unknown) =>
      selector({ unreadCount: mockUnread }),
    ),
  })),
}));
jest.mock('@expo/vector-icons/Ionicons', () => {
  const { Text } = jest.requireActual<typeof import('react-native')>('react-native');
  const Icon = (props: { name: string }): React.JSX.Element => <Text>{`icon:${props.name}`}</Text>;
  return Icon;
});

describe('NotificationsBellButton', () => {
  beforeEach(() => {
    mockUnread = 0;
    mockPush.mockClear();
  });

  it('opens the notifications page', () => {
    const { root } = renderComponent(<NotificationsBellButton />);

    act(() => (byRole(root, 'button').props.onPress as () => void)());

    expect(mockPush).toHaveBeenCalledWith('/notifications');
  });

  it('uses the outline bell and a plain label with nothing unread', () => {
    const { root } = renderComponent(<NotificationsBellButton />);

    expect(textContent(root)).toContain('icon:notifications-outline');
    expect(byRole(root, 'button').props.accessibilityLabel).toBe(t().notifications.title);
  });

  it('shows the filled bell, the badge and the count in the label when unread', () => {
    mockUnread = 4;
    const { root } = renderComponent(<NotificationsBellButton />);

    const texts = textContent(root);
    expect(texts).toContain('icon:notifications');
    expect(texts).toContain('4');
    expect(byRole(root, 'button').props.accessibilityLabel).toBe(`${t().notifications.title}, 4`);
  });

  it('caps the badge at "9+" while the label keeps the true count', () => {
    mockUnread = 15;
    const { root } = renderComponent(<NotificationsBellButton />);

    const texts = textContent(root);
    expect(texts).toContain('9+');
    expect(texts).not.toContain('15');
    expect(byRole(root, 'button').props.accessibilityLabel).toBe(`${t().notifications.title}, 15`);
  });
});
