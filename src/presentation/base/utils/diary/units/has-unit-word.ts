import type { TranslationsType } from '@presentation/i18n';

type UnitWords = TranslationsType['diary']['units'];

/** Whether this build has a word for a catalogue unit key — the server may add keys before the app knows them. */
export const hasUnitWord = (t: TranslationsType, key: string): key is keyof UnitWords & string =>
  Object.prototype.hasOwnProperty.call(t.diary.units, key);
