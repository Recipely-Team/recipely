import { CalorieStatus, type CalorieStatusType } from '@domain/diary/nutrition/calorie-status';
import { StatusMarkerKind, type StatusMarkerKindType } from '@presentation/app/diary/shared/model/status-marker-kind';

const MARKERS: Readonly<Record<CalorieStatusType, StatusMarkerKindType | null>> = {
  [CalorieStatus.None]: null,
  [CalorieStatus.Under]: StatusMarkerKind.HollowCircle,
  [CalorieStatus.On]: StatusMarkerKind.Check,
  [CalorieStatus.Over]: StatusMarkerKind.Triangle,
  [CalorieStatus.Far]: StatusMarkerKind.DoubleChevron,
};

/** The marker a status is drawn with; an unlogged day has none. */
export const statusMarkerFor = (status: CalorieStatusType): StatusMarkerKindType | null => MARKERS[status];
