import type { en } from '@presentation/i18n/locales/en';
import type { DeepStringify } from '@presentation/i18n/deep-stringify';

export type Translations = DeepStringify<typeof en>;
