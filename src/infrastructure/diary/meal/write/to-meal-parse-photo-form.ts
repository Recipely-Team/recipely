import { appendFilePart } from '@infrastructure/network/upload/append-file-part';

/** The multipart field names of `POST /diary/meal-parse`. */
const MealParseField = {
  Photo: 'photo',
  Locale: 'locale',
} as const;

/** A local photo (and its locale) → the multipart body: the `photo` file part, then `locale` when known. */
export const toMealParsePhotoForm = async (input: {
  uri: string;
  fileName: string;
  mimeType: string;
  locale: string | null;
}): Promise<FormData> => {
  const form = new FormData();
  await appendFilePart(form, MealParseField.Photo, { uri: input.uri, fileName: input.fileName, mimeType: input.mimeType });
  if (input.locale !== null) form.append(MealParseField.Locale, input.locale);
  return form;
};
