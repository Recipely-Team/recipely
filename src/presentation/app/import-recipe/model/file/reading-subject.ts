import type { Translations } from '@presentation/i18n/translations';
import type { FilePage } from '@presentation/app/import-recipe/model/file/file-page';
import { ImportFileBatch } from '@domain/recipes/import-file/import-file-batch';
import { ValueConstants } from '@core/constants';
import { COUNT_TOKEN } from '@presentation/app/import-recipe/model/file/count-token';

/** What the reading screen says it is reading: "your PDF", "your photo", "your 3 photos". */
export const readingSubject = (pages: readonly FilePage[], copy: Translations['fileImport']): string => {
  if (ImportFileBatch.holdsPdf(pages.map((page) => page.file))) return copy.yourPdf;
  if (pages.length === ValueConstants.one) return copy.yourPhoto;
  return copy.yourPhotos.replace(COUNT_TOKEN, String(pages.length));
};
