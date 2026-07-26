import { CommentEntity, type CommentProps } from '@domain/comments/comment-entity';

const makeProps = (overrides: Partial<CommentProps> = {}): CommentProps => ({
  id: 'c1',
  body: 'Looks delicious!',
  authorId: 'author-9',
  recipeId: 'recipe-3',
  createdAt: new Date('2026-05-11T12:00:00.000Z'),
  authorDisplayName: 'Ada Lovelace',
  authorPhotoUrl: 'https://cdn.recipely.io/avatars/ada.webp',
  likeCount: 5,
  likedByMe: false,
  ...overrides,
});

const build = (overrides: Partial<CommentProps> = {}): CommentEntity => {
  const result = CommentEntity.create(makeProps(overrides));
  if (!result.ok) {
    throw new Error('Test setup expected a valid Comment');
  }
  return result.value;
};

describe('CommentEntity.withLikeToggled', () => {
  it('marks an unliked comment as liked and increments the count', () => {
    const comment = build({ likedByMe: false, likeCount: 5 });

    const toggled = comment.withLikeToggled();

    expect(toggled.likedByMe).toBe(true);
    expect(toggled.likeCount).toBe(6);
  });

  it('marks a liked comment as unliked and decrements the count', () => {
    const comment = build({ likedByMe: true, likeCount: 5 });

    const toggled = comment.withLikeToggled();

    expect(toggled.likedByMe).toBe(false);
    expect(toggled.likeCount).toBe(4);
  });

  it('clamps the count at zero when un-liking a comment that already reads zero', () => {
    const comment = build({ likedByMe: true, likeCount: 0 });

    const toggled = comment.withLikeToggled();

    expect(toggled.likedByMe).toBe(false);
    expect(toggled.likeCount).toBe(0);
  });

  it('leaves the original instance unchanged', () => {
    const comment = build({ likedByMe: false, likeCount: 5 });

    comment.withLikeToggled();

    expect(comment.likedByMe).toBe(false);
    expect(comment.likeCount).toBe(5);
  });

  it('returns a new instance, not the receiver', () => {
    const comment = build();

    const toggled = comment.withLikeToggled();

    expect(toggled).not.toBe(comment);
  });

  it('preserves every other field on the returned instance', () => {
    const comment = build({ likedByMe: false, likeCount: 5 });

    const toggled = comment.withLikeToggled();

    expect(toggled.id).toBe(comment.id);
    expect(toggled.body).toBe(comment.body);
    expect(toggled.authorId).toBe(comment.authorId);
    expect(toggled.recipeId).toBe(comment.recipeId);
    expect(toggled.createdAt).toBe(comment.createdAt);
    expect(toggled.authorDisplayName).toBe(comment.authorDisplayName);
    expect(toggled.authorPhotoUrl).toBe(comment.authorPhotoUrl);
  });
});
