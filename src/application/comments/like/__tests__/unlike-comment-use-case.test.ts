import { UnlikeCommentUseCase } from '@application/comments/like/unlike-comment-use-case';
import { NetworkFailure } from '@core/failure';
import { fail, ok } from '@core/result/result-helpers';
import type { Result } from '@core/result/result';
import type { Failure } from '@core/failure';
import type { CommentRepositoryInterface } from '@domain/comments/comment-repository-interface';

interface UnlikeCall {
  recipeId: string;
  commentId: string;
}

const makeRepo = (
  result: Result<void, Failure>,
): { repo: CommentRepositoryInterface; calls: UnlikeCall[] } => {
  const calls: UnlikeCall[] = [];
  const repo = {
    unlike: (recipeId: string, commentId: string) => {
      calls.push({ recipeId, commentId });
      return Promise.resolve(result);
    },
  } as unknown as CommentRepositoryInterface;
  return { repo, calls };
};

describe('UnlikeCommentUseCase.execute', () => {
  it('delegates to repo.unlike with the recipe and comment ids', async () => {
    const { repo, calls } = makeRepo(ok(undefined));
    const useCase = new UnlikeCommentUseCase(repo);

    await useCase.execute('recipe-3', 'comment-7');

    expect(calls).toEqual([{ recipeId: 'recipe-3', commentId: 'comment-7' }]);
  });

  it('returns the success Result from the repository', async () => {
    const { repo } = makeRepo(ok(undefined));
    const useCase = new UnlikeCommentUseCase(repo);

    const result = await useCase.execute('recipe-3', 'comment-7');

    expect(result.ok).toBe(true);
  });

  it('propagates the failure Result from the repository unchanged', async () => {
    const failure = new NetworkFailure('offline');
    const { repo } = makeRepo(fail(failure));
    const useCase = new UnlikeCommentUseCase(repo);

    const result = await useCase.execute('recipe-3', 'comment-7');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure).toBe(failure);
  });
});
