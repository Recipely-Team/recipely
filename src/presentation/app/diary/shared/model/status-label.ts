import type { CalorieStatusType } from '@domain/diary/nutrition/calorie-status';
import { t } from '@presentation/i18n';

/** The words for a status — the legend, and the spoken half of every date cell. */
export const statusLabel = (status: CalorieStatusType): string => t().diary.status[status];
