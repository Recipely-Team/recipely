import { act } from 'react-test-renderer';
import { Text } from 'react-native';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { NotificationsEmpty } from '@presentation/app/notifications/body/notifications-empty';
import { t } from '@presentation/i18n';

const texts = (root: ReturnType<typeof renderComponent>['root']): string[] => root.findAllByType(Text).map((node) => String(node.props.children));

describe('NotificationsEmpty', () => {
  // --- regression: with the Unread filter on and nothing unread, the inbox said "No notifications yet".
  it('says the user is caught up, and offers Show all, when only the unread filter is empty', () => {
    const onShowAll = jest.fn();
    const { root } = renderComponent(<NotificationsEmpty caughtUp onShowAll={onShowAll} />);
    expect(texts(root)).toContain(t().notifications.caughtUp);
    const showAll = root.find((node) => node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function');
    act(() => (showAll.props as { onPress: () => void }).onPress());
    expect(onShowAll).toHaveBeenCalledTimes(1);
  });

  it('keeps the plain empty copy for a truly empty inbox', () => {
    const { root } = renderComponent(<NotificationsEmpty caughtUp={false} onShowAll={jest.fn()} />);
    expect(texts(root)).toContain(t().notifications.empty);
  });
});
