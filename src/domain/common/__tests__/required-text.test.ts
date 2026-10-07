import { RequiredText } from '@domain/common/required-text';
import { ValidationFailure } from '@core/failure';
import { DiagnosticMessage } from '@core/failure/diagnostic-message';

const bodyRequired = (): ValidationFailure =>
  new ValidationFailure(DiagnosticMessage.entity.comment.bodyRequired, 'body');

describe('RequiredText', () => {
  it('keeps text that says something, trimmed', () => {
    const result = RequiredText.create('  pasta for two \n', bodyRequired);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.value).toBe('pasta for two');
  });

  it('keeps inner whitespace as typed', () => {
    const result = RequiredText.create(' a  b ', bodyRequired);

    expect(result.ok && result.value.value).toBe('a  b');
  });

  it.each(['', '   ', '\t\n', '\u00a0'])('refuses blank input %p with the failure the caller named', (raw) => {
    const result = RequiredText.create(raw, bodyRequired);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure).toBeInstanceOf(ValidationFailure);
      expect(result.failure.message).toBe(DiagnosticMessage.entity.comment.bodyRequired);
    }
  });

  it('builds the failure only when the input is blank', () => {
    const failure = jest.fn(bodyRequired);

    RequiredText.create('soup', failure);

    expect(failure).not.toHaveBeenCalled();
  });

  it('is equal to another text with the same trimmed value', () => {
    const a = RequiredText.create('soup', bodyRequired);
    const b = RequiredText.create('  soup  ', bodyRequired);

    expect(a.ok && b.ok && a.value.equals(b.value)).toBe(true);
  });

  it('differs from a text with another value', () => {
    const a = RequiredText.create('soup', bodyRequired);
    const b = RequiredText.create('stew', bodyRequired);

    expect(a.ok && b.ok && a.value.equals(b.value)).toBe(false);
  });
});
