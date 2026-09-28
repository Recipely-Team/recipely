import { ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { HttpClient } from '@infrastructure/network/http/http-client';
import { RecipeRepository } from '@infrastructure/recipes/recipe-repository';
import { ApiRoutes } from '@infrastructure/constants/api/api-routes';
import { FILE_IMPORT_TIMEOUT_MS } from '@infrastructure/constants/api/api-timeouts';
import { ImportFileBatch } from '@domain/recipes/import-file/import-file-batch';
import { ImportFileMimeType } from '@domain/recipes/import-file/import-file-mime-type';

interface UploadCall {
  url: string;
  timeoutMs: number | undefined;
}

const makeHttp = (result: Result<unknown, unknown>): { http: HttpClient; calls: UploadCall[] } => {
  const calls: UploadCall[] = [];
  const stub = {
    uploadMultipart: jest.fn((url: string, _formData: FormData, _onProgress: unknown, timeoutMs?: number) => {
      calls.push({ url, timeoutMs });
      return Promise.resolve(result);
    }),
  } as unknown as HttpClient;
  return { http: stub, calls };
};

const batchOf = (names: string[]): ImportFileBatch => {
  const result = ImportFileBatch.create(
    names.map((name) => ({ uri: `file:///${name}`, fileName: name, mimeType: ImportFileMimeType.Jpeg, sizeBytes: null })),
  );
  if (!result.ok) throw new Error('fixture batch must be valid');
  return result.value;
};

describe('RecipeRepository.importRecipeFromFiles', () => {
  it('posts every page under `files`, in order, to /recipes/import/file on the 70 s budget', async () => {
    const appends: [string, unknown][] = [];
    const spy = jest.spyOn(FormData.prototype, 'append').mockImplementation((field: string, value: unknown) => {
      appends.push([field, value]);
    });
    try {
      const { http, calls } = makeHttp(ok({ draftId: 'd-42' }));
      const result = await new RecipeRepository(http).importRecipeFromFiles(batchOf(['1.jpg', '2.jpg']));

      expect(result.ok && result.value).toEqual({ draftId: 'd-42' });
      expect(calls).toEqual([{ url: ApiRoutes.recipes.importFile, timeoutMs: FILE_IMPORT_TIMEOUT_MS }]);
      expect(ApiRoutes.recipes.importFile).toBe('/recipes/import/file');
      expect(appends.map(([field]) => field)).toEqual(['files', 'files']);
      expect(appends.map(([, value]) => (value as { name: string }).name)).toEqual(['1.jpg', '2.jpg']);
    } finally {
      spy.mockRestore();
    }
  });
});
