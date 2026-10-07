import { act, type ReactTestInstance } from 'react-test-renderer';
import { renderComponent } from '@presentation/base/test-support/render-component';
import { NotificationsHeader } from '@presentation/app/notifications/body/notifications-header';
import { NotificationFilterPills } from '@presentation/app/notifications/body/notification-filter-pills';
import { NotificationFilter } from '@presentation/app/notifications/model/notification-filter';
import { t } from '@presentation/i18n';

const pressables = (root: ReactTestInstance, label: string): ReactTestInstance[] =>
  root.findAll((node) => node.props.accessibilityLabel === label && typeof node.props.onPress === 'function');

describe('NotificationsHeader', () => {
  it('offers Mark all read only while something is unread, and runs it', () => {
    const onMarkAllRead = jest.fn();
    const label = t().notifications.markRead;

    const unread = renderComponent(<NotificationsHeader unreadCount={3} onBack={jest.fn()} onMarkAllRead={onMarkAllRead} />);
    act(() => (pressables(unread.root, label)[0].props.onPress as () => void)());
    const allRead = renderComponent(<NotificationsHeader unreadCount={0} onBack={jest.fn()} onMarkAllRead={onMarkAllRead} />);

    expect(onMarkAllRead).toHaveBeenCalledTimes(1);
    expect(pressables(allRead.root, label)).toHaveLength(0);
  });
});

describe('NotificationFilterPills', () => {
  it('shows each filter with its count and reports the one tapped', () => {
    const onChange = jest.fn();
    const copy = t().notifications;
    const { root } = renderComponent(<NotificationFilterPills filter={NotificationFilter.All} totalCount={7} unreadCount={2} onChange={onChange} />);

    const unread = pressables(root, `${copy.unread} (2)`);
    expect(pressables(root, `${copy.all} (7)`)).toHaveLength(1);
    expect(unread).toHaveLength(1);
    act(() => (unread[0].props.onPress as () => void)());

    expect(onChange).toHaveBeenCalledWith(NotificationFilter.Unread);
  });
});
