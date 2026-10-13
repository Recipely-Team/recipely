import { t } from '@presentation/i18n';
import { getLocale } from '@presentation/i18n/i18n';
import { ValueConstants } from '@core/constants';
import { ShareCardLayout } from '@presentation/app/recipes/[recipeId]/model/share/share-card-layout';

const MINUTES_PER_HOUR = 60;

/** "35 min", "1 h 15 min", "2 h" in the reader's language. */
const duration = (minutes: number): string => {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const rest = minutes % MINUTES_PER_HOUR;
  if (hours === ValueConstants.zero) return t().recipes.heroTotalMin.replace('{n}', String(rest));
  if (rest === ValueConstants.zero) return t().recipes.shareCardHours.replace('{h}', String(hours));
  return t().recipes.shareCardHoursMinutes.replace('{h}', String(hours)).replace('{m}', String(rest));
};

/**
 * The card's meta line: cuisine · total time · servings, upper-cased for the
 * reader's locale (Turkish keeps its dotted İ). A missing part is left out.
 */
export const shareCardMeta = (cuisine: string | undefined, totalMinutes: number, servings: number): string => {
  const parts = [
    cuisine,
    totalMinutes > ValueConstants.zero ? duration(totalMinutes) : undefined,
    servings > ValueConstants.zero
      ? servings === ValueConstants.one
        ? t().diary.servingsOne
        : t().diary.servingsOther.replace('{n}', String(servings))
      : undefined,
  ].filter((part): part is string => part !== undefined && part.length > ValueConstants.zero);
  return parts.join(ShareCardLayout.separator).toLocaleUpperCase(getLocale());
};
