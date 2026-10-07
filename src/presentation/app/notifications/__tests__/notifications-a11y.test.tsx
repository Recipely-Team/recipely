import { renderComponent } from '@presentation/base/test-support/render-component';
import { t } from '@presentation/i18n';
import { NotificationFilter } from '@presentation/app/notifications/model/notification-filter';
import { NotificationFilterPills } from '@presentation/app/notifications/body/notification-filter-pills';
import { NotificationsHeader } from '@presentation/app/notifications/body/notifications-header';

const buttons = (root: ReturnType<typeof renderComponent>['root']) =>
  root.findAll((node) => node.props.accessibilityRole === 'button' && typeof node.props.onPress === 'function');

/**
 * Review findings: the All / Unread pills showed which filter was on by colour
 * only, and the back button was announced as the screen's title (rule 10).
 */
describe('notifications accessibility', () => {
  it('tells a screen reader which filter pill is selected', () => {
    const { root } = renderComponent(
      <NotificationFilterPills filter={NotificationFilter.Unread} totalCount={3} unreadCount={1} onChange={jest.fn()} />,
    );
    const states = buttons(root).map((node) => node.props.accessibilityState as { selected?: boolean } | undefined);

    expect(states.map((state) => state?.selected)).toEqual([false, true]);
  });

  it('announces the back button as "back", not as the screen title', () => {
    const { root } = renderComponent(<NotificationsHeader unreadCount={0} onBack={jest.fn()} onMarkAllRead={jest.fn()} />);

    expect(buttons(root)[0]?.props.accessibilityLabel).toBe(t().common.back);
  });
});
