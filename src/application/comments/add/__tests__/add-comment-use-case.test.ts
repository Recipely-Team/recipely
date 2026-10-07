import { AddCommentUseCase } from '@application/comments/add/add-comment-use-case';
import type { CommentRepositoryInterface } from '@domain/comments/comment-repository-interface';
import { NetworkFailure, ValidationFailure } from '@core/failure';
import { fail } from '@core/result/result-helpers';

const build = () => {
  const add = jest.fn().mockResolvedValue(fail(new NetworkFailure('offline')));
  const useCase = new AddCommentUseCase({ add } as unknown as CommentRepositoryInterface);
  return { useCase, add };
};

describe('AddCommentUseCase', () => {
  it('sends the trimmed body', async () => {
    const { useCase, add } = build();

    await useCase.execute({ recipeId: 'r1', body: '  yum  ' });

    expect(add).toHaveBeenCalledWith('r1', 'yum');
  });

  it('refuses a blank body without a request', async () => {
    const { useCase, add } = build();

    const result = await useCase.execute({ recipeId: 'r1', body: '   ' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.failure).toBeInstanceOf(ValidationFailure);
    expect(add).not.toHaveBeenCalled();
  });
});
