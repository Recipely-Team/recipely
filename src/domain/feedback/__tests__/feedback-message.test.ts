import { FeedbackMessage } from '@domain/feedback/feedback-message';
import { ValidationFailure } from '@core/failure';

const created = (subject: string, message: string): FeedbackMessage => {
  const result = FeedbackMessage.create({ subject, message });
  if (!result.ok) throw new Error('expected the feedback to be accepted');
  return result.value;
};

describe('FeedbackMessage', () => {
  it('trims both fields into a wire-ready submission', () => {
    expect(created('  Bug ', ' it crashed \n').submission).toEqual({ subject: 'Bug', message: 'it crashed' });
  });

  it('allows an empty subject', () => {
    expect(created('', 'hello').submission.subject).toBe('');
  });

  it('refuses a blank message on the message field', () => {
    const result = FeedbackMessage.create({ subject: 'Bug', message: '  ' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure).toBeInstanceOf(ValidationFailure);
      expect(result.failure.field).toBe('message');
    }
  });

  it('is equal only when subject and message both are', () => {
    expect(created('Bug', 'x').equals(created(' Bug', 'x '))).toBe(true);
    expect(created('Bug', 'x').equals(created('Idea', 'x'))).toBe(false);
  });
});
