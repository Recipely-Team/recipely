import { ValueConstants } from '@core/constants';
import { t } from '@presentation/i18n';

/** "2 things left" — what the disabled Publish button says while the checklist is open. */
export const thingsLeftLabel = (count: number): string =>
  count === ValueConstants.one
    ? t().publishing.oneThingLeft
    : t().publishing.thingsLeft.replace('{n}', String(count));
