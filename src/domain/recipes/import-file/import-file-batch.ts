import { BaseValueObject } from '@core/value-object/base-value-object';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';
import { ErrorMessageKey, ValidationFailure } from '@core/failure';
import { ValueConstants } from '@core/constants';
import type { ImportFile } from '@domain/recipes/import-file/import-file';
import type { AdmittedImportFiles } from '@domain/recipes/import-file/admitted-import-files';
import { ImportFileLimits } from '@domain/recipes/import-file/import-file-limits';
import { ImportFileMimeType } from '@domain/recipes/import-file/import-file-mime-type';

const IMAGE_TYPES: readonly string[] = [
  ImportFileMimeType.Jpeg,
  ImportFileMimeType.Png,
  ImportFileMimeType.Webp,
  ImportFileMimeType.Heic,
  ImportFileMimeType.Heif,
];

const isPdf = (file: ImportFile): boolean => file.mimeType === ImportFileMimeType.Pdf;
const isImage = (file: ImportFile): boolean => IMAGE_TYPES.includes(file.mimeType);
const isOversized = (file: ImportFile): boolean =>
  file.sizeBytes !== null && file.sizeBytes > ImportFileLimits.maxFileBytes;

const refusal = (diagnostic: string, key: string): ValidationFailure =>
  new ValidationFailure(diagnostic, undefined, key);
const unsupported = (): ValidationFailure =>
  refusal(DiagnosticMessage.fileImport.unsupportedFile, ErrorMessageKey.importUnsupportedFile);
const tooLarge = (): ValidationFailure =>
  refusal(DiagnosticMessage.fileImport.fileTooLarge, ErrorMessageKey.fileTooLarge);
const tooMany = (): ValidationFailure =>
  refusal(DiagnosticMessage.fileImport.tooManyFiles, ErrorMessageKey.importTooManyFiles);

/**
 * The pages one file import reads, in order: up to five photos, or one PDF.
 *
 * @remarks
 * - **The server's rules, asked early.** The backend refuses the same batches
 *   with the same keys; checking here spares an upload of up to 50 MB that
 *   could only come back refused, and lets the picker explain it on the spot.
 * - **Never both.** Photos are pages of one recipe read in order; a PDF is a
 *   document of its own. A PDF added to photos, or a second PDF, is too many.
 * - **`admit` keeps what fits.** Picking seven photos into an empty batch adds
 *   the first five and says why the rest stayed out — throwing the whole pick
 *   away would make the user do it again for the sake of two photos.
 */
export class ImportFileBatch extends BaseValueObject<readonly ImportFile[]> {
  private constructor(files: readonly ImportFile[]) {
    super(files);
  }

  static create(files: readonly ImportFile[]): Result<ImportFileBatch, ValidationFailure> {
    if (files.length === ValueConstants.zero) {
      return fail(refusal(DiagnosticMessage.fileImport.noFile, ErrorMessageKey.importNoFile));
    }
    if (files.some((file) => !isPdf(file) && !isImage(file))) return fail(unsupported());
    if (files.some(isOversized)) return fail(tooLarge());

    const pdfs = files.filter(isPdf).length;
    const images = files.length - pdfs;
    const mixed = pdfs > ValueConstants.zero && images > ValueConstants.zero;
    if (mixed || pdfs > ImportFileLimits.maxPdfs || images > ImportFileLimits.maxImages) {
      return fail(tooMany());
    }
    return ok(new ImportFileBatch(files));
  }

  /** Adds `incoming` to `current` as far as the rules allow, and says what was left out. */
  static admit(current: readonly ImportFile[], incoming: readonly ImportFile[]): AdmittedImportFiles {
    let failure: ValidationFailure | null = null;
    const readable = incoming.filter((file) => isPdf(file) || isImage(file));
    if (readable.length < incoming.length) failure = unsupported();
    const sized = readable.filter((file) => !isOversized(file));
    if (sized.length < readable.length) failure = tooLarge();
    if (sized.length === ValueConstants.zero) return { files: current, failure };

    const pdfs = sized.filter(isPdf);
    const holdsPdf = current.some(isPdf);
    if (pdfs.length > ValueConstants.zero || holdsPdf) {
      const alone = current.length === ValueConstants.zero && sized.length === ValueConstants.one;
      return alone ? { files: sized, failure } : { files: current, failure: tooMany() };
    }

    const room = Math.max(ValueConstants.zero, ImportFileLimits.maxImages - current.length);
    if (sized.length > room) failure = tooMany();
    return { files: [...current, ...sized.slice(ValueConstants.zero, room)], failure };
  }

  /** True when `files` is a PDF rather than photos — the picker is then full. */
  static holdsPdf(files: readonly ImportFile[]): boolean {
    return files.some(isPdf);
  }

  /** True when nothing more may be added to `files`. */
  static isFull(files: readonly ImportFile[]): boolean {
    return ImportFileBatch.holdsPdf(files) || files.length >= ImportFileLimits.maxImages;
  }
}
