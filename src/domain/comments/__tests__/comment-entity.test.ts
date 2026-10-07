import { CommentEntity } from '@domain/comments/comment-entity';
import type { CommentEntityProps } from '@domain/comments/comment-entity-props';

const makeProps = (overrides: Partial<CommentEntityProps> = {}): CommentEntityProps => ({
  id: 'c1',
  body: 'Looks delicious!',
  authorId: 'author-9',
  recipeId: 'recipe-3',
  createdAt: new Date('2026-05-11T12:00:00.000Z'),
  authorDisplayName: 'Ada Lovelace',
  authorPhotoUrl: 'https://cdn.recipely.io/avatars/ada.webp',
  likeCount: 5,
  ...overrides,
});

const build = (overrides: Partial<CommentEntityProps> = {}): CommentEntity => {
  const result = CommentEntity.create(makeProps(overrides));
  if (!result.ok) {
    throw new Error('Test setup expected a valid Comment');
  }
  return result.value;
};

describe('CommentEntity.withViewerLike', () => {
  it('adds the viewer\'s like to the count', () => {
    expect(build({ likeCount: 5 }).withViewerLike(true).likeCount).toBe(6);
  });

  it('removes the viewer\'s like from the count', () => {
    expect(build({ likeCount: 5 }).withViewerLike(false).likeCount).toBe(4);
  });

  it('clamps the count at zero when removing a like from a comment that already reads zero', () => {
    expect(build({ likeCount: 0 }).withViewerLike(false).likeCount).toBe(0);
  });

  it('returns a new instance and leaves the original unchanged', () => {
    const comment = build({ likeCount: 5 });

    const liked = comment.withViewerLike(true);

    expect(liked).not.toBe(comment);
    expect(comment.likeCount).toBe(5);
  });

  it('preserves every other field on the returned instance', () => {
    const comment = build({ likeCount: 5 });

    const liked = comment.withViewerLike(true);

    expect(liked.id).toBe(comment.id);
    expect(liked.body).toBe(comment.body);
    expect(liked.authorId).toBe(comment.authorId);
    expect(liked.recipeId).toBe(comment.recipeId);
    expect(liked.createdAt).toBe(comment.createdAt);
    expect(liked.authorDisplayName).toBe(comment.authorDisplayName);
    expect(liked.authorPhotoUrl).toBe(comment.authorPhotoUrl);
  });
});

describe('CommentEntity.isAuthoredBy', () => {
  it('is true only for the author, never for a guest', () => {
    const comment = build({ authorId: 'author-9' });
    expect(comment.isAuthoredBy('author-9')).toBe(true);
    expect(comment.isAuthoredBy('someone-else')).toBe(false);
    expect(comment.isAuthoredBy(null)).toBe(false);
  });
});
