import { FakeRecipeRepository } from '@application/__fixtures__/fake-recipe-repository';
import { ImportRecipeFromFilesUseCase } from '@application/recipes/import-file/import-recipe-from-files-use-case';
import { configureFileImportStore } from '@application/recipes/import-file/file-import-store';
import { StoreStatus } from '@application/store/store-status';
import { ErrorMessageKey } from '@core/failure';
import type { ImportFile } from '@domain/recipes/import-file/import-file';
import { ImportFileMimeType } from '@domain/recipes/import-file/import-file-mime-type';

const photo = (name: string): ImportFile => ({
  uri: `file:///${name}`,
  fileName: name,
  mimeType: ImportFileMimeType.Jpeg,
  sizeBytes: null,
});
const pdf: ImportFile = { uri: 'file:///r.pdf', fileName: 'r.pdf', mimeType: ImportFileMimeType.Pdf, sizeBytes: 10 };

describe('ImportRecipeFromFilesUseCase', () => {
  it('sends a valid batch to the repository, in order, and returns its draft', async () => {
    const repo = new FakeRecipeRepository();
    const result = await new ImportRecipeFromFilesUseCase(repo).execute([photo('1.jpg'), photo('2.jpg')]);

    expect(result.ok && result.value.draftId).toBe('draft-1');
    expect(repo.lastImportFilesCall?.value.map((f) => f.fileName)).toEqual(['1.jpg', '2.jpg']);
  });

  it.each([
    ['nothing', [], ErrorMessageKey.importNoFile],
    ['six photos', ['1', '2', '3', '4', '5', '6'].map((n) => photo(`${n}.jpg`)), ErrorMessageKey.importTooManyFiles],
    ['a photo with a PDF', [photo('1.jpg'), pdf], ErrorMessageKey.importTooManyFiles],
    ['a GIF', [{ ...photo('a.gif'), mimeType: 'image/gif' }], ErrorMessageKey.importUnsupportedFile],
  ])('refuses %s without a round trip', async (_label, files, key) => {
    const repo = new FakeRecipeRepository();
    const result = await new ImportRecipeFromFilesUseCase(repo).execute(files);

    expect(result.ok ? undefined : result.failure.messageKey).toBe(key);
    expect(repo.lastImportFilesCall).toBeNull();
  });
});

describe('configureFileImportStore', () => {
  it('lands on the receipt, and forgets a late answer after clear()', async () => {
    const store = configureFileImportStore({
      importRecipeFromFilesUseCase: new ImportRecipeFromFilesUseCase(new FakeRecipeRepository()),
    });

    await store.getState().importFiles([photo('1.jpg')]);
    const state = store.getState().state;
    expect(state.status === StoreStatus.Loaded && state.receipt.draftId).toBe('draft-1');

    const late = store.getState().importFiles([photo('1.jpg')]);
    store.getState().clear();
    await late;
    expect(store.getState().state.status).toBe(StoreStatus.Idle);
  });
});
