import { isWeb } from '@infrastructure/constants/platform';
import { ValueConstants } from '@core/constants';

/** A local file to append to a multipart `FormData` body. */
interface FilePart {
  uri: string;
  fileName: string;
  mimeType: string;
}

/**
 * Appends one local file to a `FormData` under `field`.
 *
 * WHY: RN native FormData recognises `{ uri, name, type }` as a file part;
 * browser FormData does not — it serialises the object to "[object Object]"
 * and Multer never sees a file. On web we therefore fetch the local blob URI
 * first and append the real Blob.
 */
export async function appendFilePart(
  formData: FormData,
  field: string,
  part: FilePart,
): Promise<void> {
  if (isWeb()) {
    const resp = await fetch(part.uri);
    const fetched = await resp.blob();
    // A picked HEIC arrives typeless; send the picked type.
    const blob = fetched.type.length > ValueConstants.zero ? fetched : new Blob([fetched], { type: part.mimeType });
    formData.append(field, blob, part.fileName);
  } else {
    formData.append(field, {
      uri: part.uri,
      name: part.fileName,
      type: part.mimeType,
    } as unknown as Blob);
  }
}
