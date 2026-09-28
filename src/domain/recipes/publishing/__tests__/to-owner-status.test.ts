import { toOwnerStatus } from '@domain/recipes/publishing/to-owner-status';
import { OwnerStatus } from '@domain/recipes/publishing/owner-status';
import { ModerationStatus } from '@domain/recipes/publishing/moderation-status';
import { toPublishBlockers } from '@domain/recipes/publishing/to-publish-blockers';
import { PublishBlocker } from '@domain/recipes/publishing/publish-blocker';

describe('toOwnerStatus', () => {
  it.each([
    [false, ModerationStatus.Unreviewed, OwnerStatus.Private],
    [false, ModerationStatus.Pending, OwnerStatus.InReview],
    [true, ModerationStatus.Pending, OwnerStatus.InReview],
    [true, ModerationStatus.Approved, OwnerStatus.Published],
    [false, ModerationStatus.Approved, OwnerStatus.Private],
    [false, ModerationStatus.Rejected, OwnerStatus.Rejected],
    [false, 'something-new', OwnerStatus.Private],
  ])('isPublished=%s, %s reads as %s', (isPublished, status, expected) => {
    expect(toOwnerStatus(isPublished, status)).toBe(expected);
  });
});

describe('toPublishBlockers', () => {
  it('keeps the words it knows and drops the rest', () => {
    expect(toPublishBlockers(['photo', 'poem', 'instructions'])).toEqual([
      PublishBlocker.Photo,
      PublishBlocker.Instructions,
    ]);
  });

  it('keeps "not told" apart from "nothing missing"', () => {
    expect(toPublishBlockers(undefined)).toBeUndefined();
    expect(toPublishBlockers([])).toEqual([]);
  });
});
