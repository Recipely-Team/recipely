import { TabAppBar } from '@presentation/base/widgets/navigation/tab-app-bar';
import { NotificationsBellButton } from '@presentation/base/widgets/navigation/notifications-bell-button';
import { TabAppBarButton } from '@presentation/base/widgets/navigation/tab-app-bar-button';
import { t } from '@presentation/i18n';

export interface DiaryAppBarProps {
  /** Hidden once the calendar sits in the page's own rail (an expanded viewport). */
  showCalendar: boolean;
  onOpenCalendar: () => void;
  onOpenGoals: () => void;
}

/** The Diary tab's top bar on the native shell: the shared tab bar with calendar · goals · notifications (design spec → Tab app bar). */
export const DiaryAppBar = ({ showCalendar, onOpenCalendar, onOpenGoals }: DiaryAppBarProps): React.JSX.Element => {
  const strings = t().diary;
  return (
    <TabAppBar
      title={strings.title}
      actions={
        <>
          {showCalendar ? (
            <TabAppBarButton icon="calendar-outline" accessibilityLabel={strings.openCalendar} onPress={onOpenCalendar} />
          ) : null}
          <TabAppBarButton icon="locate-outline" accessibilityLabel={strings.dailyGoals} onPress={onOpenGoals} />
          <NotificationsBellButton />
        </>
      }
    />
  );
};
