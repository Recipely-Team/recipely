import { ok } from '@core/result/result-helpers';
import { EnqueueInstagramImportUseCase } from '@application/recipes/import/enqueue-instagram-import-use-case';
import type { RecipeRepositoryInterface } from '@domain/recipes/recipe-repository-interface';

const repoWith = () => {
  const enqueueInstagramImport = jest.fn().mockResolvedValue(ok({ id: 'j1' }));
  return { repo: { enqueueInstagramImport } as unknown as RecipeRepositoryInterface, enqueueInstagramImport };
};

describe('EnqueueInstagramImportUseCase', () => {
  it('queues a valid link', async () => {
    const { repo, enqueueInstagramImport } = repoWith();
    const result = await new EnqueueInstagramImportUseCase(repo).execute({ url: 'https://www.instagram.com/reel/ABC123/' });
    expect(result.ok).toBe(true);
    expect(enqueueInstagramImport).toHaveBeenCalledTimes(1);
  });

  it('refuses something that is not a link without calling the server', async () => {
    const { repo, enqueueInstagramImport } = repoWith();
    const result = await new EnqueueInstagramImportUseCase(repo).execute({ url: 'not a link' });
    expect(result.ok).toBe(false);
    expect(enqueueInstagramImport).not.toHaveBeenCalled();
  });
});
