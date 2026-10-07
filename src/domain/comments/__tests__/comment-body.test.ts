import { CommentBody } from '@domain/comments/comment-body';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';

describe('CommentBody', () => {
  it('keeps what the viewer wrote, trimmed', () => {
    const result = CommentBody.create('  Looks delicious! \n');

    expect(result.ok && result.value.value).toBe('Looks delicious!');
  });

  it.each(['', '   ', '\n\t'])('refuses a blank body %p as the comment body failure', (raw) => {
    const result = CommentBody.create(raw);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure).toBeInstanceOf(ValidationFailure);
      expect(result.failure.message).toBe(DiagnosticMessage.entity.comment.bodyRequired);
      expect(result.failure.field).toBe('body');
    }
  });
});
