import { ValueConstants } from '@core/constants';
import { t } from '@presentation/i18n';
import { formatOneDecimal } from '@presentation/base/utils/diary/format-one-decimal';

/** "1 serving" / "1.5 servings" — the diary's only unit (design spec → Food Diary, v1 scope cut). */
export const formatServings = (servings: number, locale: string): string =>
  servings === ValueConstants.one
    ? t().diary.servingsOne
    : t().diary.servingsOther.replace('{n}', formatOneDecimal(servings, locale));
