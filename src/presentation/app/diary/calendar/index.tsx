import { Redirect } from 'expo-router';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { PageTitle } from '@presentation/base/widgets/head/page-title';
import { RoutePaths } from '@presentation/base/constants';
import { DiaryCalendarView } from '@presentation/app/diary/calendar/body/diary-calendar-view';
import { t } from '@presentation/i18n';

/**
 * The Diary's month page (design spec → Food Diary §5). A phone layout only:
 * an expanded viewport already shows the month in the Day view's rail, so a
 * link or a resize landing here there goes back to the Day view.
 */
export const DiaryCalendarScreen = (): React.JSX.Element => {
  const { isExpanded } = useLayout();
  if (isExpanded) return <Redirect href={RoutePaths.diary} />;
  return (
    <>
      <PageTitle subject={t().diary.calendarTitle} />
      <DiaryCalendarView />
    </>
  );
};

export default DiaryCalendarScreen;
