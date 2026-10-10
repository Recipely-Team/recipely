import { ValueConstants } from '@core/constants';
import { formatOneDecimal } from '@presentation/base/utils/diary/format-one-decimal';
import { t } from '@presentation/i18n';

/** "1 serving" / "2.5 servings" on a planned meal. */
export const formatPlanServings = (servings: number, locale: string): string =>
  servings === ValueConstants.one ? t().mealPlan.servingsOne : t().mealPlan.servingsOther.replace('{n}', formatOneDecimal(servings, locale));
