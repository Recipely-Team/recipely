import { appendFilePart } from '@infrastructure/network/upload/append-file-part';
import type { FridgeScanInput } from '@domain/fridge/scan/fridge-scan-input';

/** The multipart field names of `POST /fridge/scan`. */
const FridgeScanField = {
  Photos: 'photos',
  Locale: 'locale',
} as const;

/** Photos (and the locale) → the multipart body: one `photos` file part per photo, in order, then `locale` when known. */
export const toFridgeScanForm = async (input: FridgeScanInput): Promise<FormData> => {
  const form = new FormData();
  for (const photo of input.photos) {
    await appendFilePart(form, FridgeScanField.Photos, photo);
  }
  if (input.locale !== null) form.append(FridgeScanField.Locale, input.locale);
  return form;
};
