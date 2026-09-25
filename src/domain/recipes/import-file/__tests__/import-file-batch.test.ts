import { ErrorMessageKey } from '@core/failure';
import type { ImportFile } from '@domain/recipes/import-file/import-file';
import { ImportFileBatch } from '@domain/recipes/import-file/import-file-batch';
import { ImportFileLimits } from '@domain/recipes/import-file/import-file-limits';
import { ImportFileMimeType } from '@domain/recipes/import-file/import-file-mime-type';

const photo = (name: string, sizeBytes: number | null = 1000): ImportFile => ({
  uri: `file:///${name}`,
  fileName: name,
  mimeType: ImportFileMimeType.Jpeg,
  sizeBytes,
});
const pdf = (name = 'recipe.pdf'): ImportFile => ({
  uri: `file:///${name}`,
  fileName: name,
  mimeType: ImportFileMimeType.Pdf,
  sizeBytes: 1000,
});
const photos = (count: number): ImportFile[] => Array.from({ length: count }, (_, i) => photo(`p${i}.jpg`));
const keyOf = (result: ReturnType<typeof ImportFileBatch.create>): string | undefined =>
  result.ok ? undefined : result.failure.messageKey;

describe('ImportFileBatch.create — the backend rules, asked before the upload', () => {
  it('takes one to five photos, in order', () => {
    const result = ImportFileBatch.create(photos(ImportFileLimits.maxImages));
    expect(result.ok && result.value.value.map((f) => f.fileName)).toEqual(['p0.jpg', 'p1.jpg', 'p2.jpg', 'p3.jpg', 'p4.jpg']);
  });

  it('takes one PDF on its own', () => {
    expect(ImportFileBatch.create([pdf()]).ok).toBe(true);
  });

  it('refuses an empty batch with no_file', () => {
    expect(keyOf(ImportFileBatch.create([]))).toBe(ErrorMessageKey.importNoFile);
  });

  it('refuses a sixth photo with too_many_files', () => {
    expect(keyOf(ImportFileBatch.create(photos(6)))).toBe(ErrorMessageKey.importTooManyFiles);
  });

  it('refuses photos and a PDF together, and two PDFs, with too_many_files', () => {
    expect(keyOf(ImportFileBatch.create([photo('a.jpg'), pdf()]))).toBe(ErrorMessageKey.importTooManyFiles);
    expect(keyOf(ImportFileBatch.create([pdf('a.pdf'), pdf('b.pdf')]))).toBe(ErrorMessageKey.importTooManyFiles);
  });

  it('refuses a type it cannot read with unsupported_file', () => {
    const gif = { ...photo('a.gif'), mimeType: 'image/gif' };
    expect(keyOf(ImportFileBatch.create([gif]))).toBe(ErrorMessageKey.importUnsupportedFile);
  });

  it('refuses a file over 10 MB, and lets an unknown size through to the server', () => {
    expect(keyOf(ImportFileBatch.create([photo('big.jpg', ImportFileLimits.maxFileBytes + 1)]))).toBe(
      ErrorMessageKey.fileTooLarge,
    );
    expect(ImportFileBatch.create([photo('shrunk.jpg', null)]).ok).toBe(true);
  });
});

describe('ImportFileBatch.admit — a pick keeps what fits', () => {
  it('adds the first photos up to five and says why the rest stayed out', () => {
    const admitted = ImportFileBatch.admit(photos(3), photos(4));
    expect(admitted.files).toHaveLength(ImportFileLimits.maxImages);
    expect(admitted.failure?.messageKey).toBe(ErrorMessageKey.importTooManyFiles);
  });

  it('refuses a PDF once photos are picked, keeping the photos', () => {
    const current = photos(2);
    const admitted = ImportFileBatch.admit(current, [pdf()]);
    expect(admitted.files).toBe(current);
    expect(admitted.failure?.messageKey).toBe(ErrorMessageKey.importTooManyFiles);
  });

  it('refuses photos once a PDF is picked', () => {
    const admitted = ImportFileBatch.admit([pdf()], [photo('a.jpg')]);
    expect(admitted.files).toHaveLength(1);
    expect(admitted.failure?.messageKey).toBe(ErrorMessageKey.importTooManyFiles);
  });

  it('drops an oversized photo and keeps the others', () => {
    const admitted = ImportFileBatch.admit([], [photo('a.jpg'), photo('big.jpg', ImportFileLimits.maxFileBytes + 1)]);
    expect(admitted.files.map((f) => f.fileName)).toEqual(['a.jpg']);
    expect(admitted.failure?.messageKey).toBe(ErrorMessageKey.fileTooLarge);
  });

  it('says a batch is full at five photos or at one PDF', () => {
    expect(ImportFileBatch.isFull(photos(4))).toBe(false);
    expect(ImportFileBatch.isFull(photos(5))).toBe(true);
    expect(ImportFileBatch.isFull([pdf()])).toBe(true);
  });
});
