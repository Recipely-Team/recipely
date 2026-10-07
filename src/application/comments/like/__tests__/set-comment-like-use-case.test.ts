import { SetCommentLikeUseCase } from '@application/comments/like/set-comment-like-use-case';
import type { LikeCommentUseCase } from '@application/comments/like/like-comment-use-case';
import type { UnlikeCommentUseCase } from '@application/comments/like/unlike-comment-use-case';
import { ok } from '@core/result/result-helpers';

const build = () => {
  const like = jest.fn().mockResolvedValue(ok(undefined));
  const unlike = jest.fn().mockResolvedValue(ok(undefined));
  const useCase = new SetCommentLikeUseCase(
    { execute: like } as unknown as LikeCommentUseCase,
    { execute: unlike } as unknown as UnlikeCommentUseCase,
  );
  return { useCase, like, unlike };
};

describe('SetCommentLikeUseCase', () => {
  it('likes the comment when asked to like it', async () => {
    const { useCase, like, unlike } = build();

    await useCase.execute('r1', 'c1', true);

    expect(like).toHaveBeenCalledWith('r1', 'c1');
    expect(unlike).not.toHaveBeenCalled();
  });

  it('removes the like when asked to unlike it', async () => {
    const { useCase, like, unlike } = build();

    await useCase.execute('r1', 'c1', false);

    expect(unlike).toHaveBeenCalledWith('r1', 'c1');
    expect(like).not.toHaveBeenCalled();
  });
});
