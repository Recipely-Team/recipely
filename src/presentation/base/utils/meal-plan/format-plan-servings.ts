import type { TranslationsType } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';
import { formatOneDecimal } from '@presentation/base/utils/diary/format-one-decimal';

/** "1 serving" / "2.5 servings" on a planned meal. */
export const formatPlanServings = (t: TranslationsType, servings: number, locale: string): string =>
  servings === ValueConstants.one ? t.mealPlan.servingsOne : t.mealPlan.servingsOther.replace('{n}', formatOneDecimal(servings, locale));
