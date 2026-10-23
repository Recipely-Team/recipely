import type { TranslationsType } from '@presentation/i18n';
import type { CalorieStatusType } from '@domain/diary/nutrition/calorie-status';

/** The words for a status — the legend, and the spoken half of every date cell. */
export const statusLabel = (t: TranslationsType, status: CalorieStatusType): string => t.diary.status[status];
