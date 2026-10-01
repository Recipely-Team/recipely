import { t } from '@presentation/i18n';

type UnitWords = ReturnType<typeof t>['diary']['units'];

/** Whether this build has a word for a catalogue unit key — the server may add keys before the app knows them. */
export const hasUnitWord = (key: string): key is keyof UnitWords & string =>
  Object.prototype.hasOwnProperty.call(t().diary.units, key);
