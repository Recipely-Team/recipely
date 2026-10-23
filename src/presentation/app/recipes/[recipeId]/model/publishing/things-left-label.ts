import type { TranslationsType } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

/** "2 things left" — what the disabled Publish button says while the checklist is open. */
export const thingsLeftLabel = (t: TranslationsType, count: number): string =>
  count === ValueConstants.one
    ? t.publishing.oneThingLeft
    : t.publishing.thingsLeft.replace('{n}', String(count));
