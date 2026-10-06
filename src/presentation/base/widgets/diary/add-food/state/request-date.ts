import type { CalendarDate } from '@domain/diary/calendar/calendar-date';
import { AddFoodRequestKind } from '@presentation/base/widgets/diary/add-food/request/add-food-request-kind';
import type { AddFoodRequestType } from '@presentation/base/widgets/diary/add-food/request/add-food-request';

/** The day a request logs to — an edit stays on its entry's day. */
export const requestDate = (request: AddFoodRequestType): CalendarDate =>
  request.kind === AddFoodRequestKind.Edit ? request.entry.date : request.date;
