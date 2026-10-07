import { Email } from '@domain/common/email';

describe('Email.create', () => {
  it('accepts a well-formed address', () => {
    const r = Email.create('user@example.com');

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.value).toBe('user@example.com');
  });

  it('trims the whitespace an autocomplete leaves around an address', () => {
    const r = Email.create('  user@example.com ');

    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.value).toBe('user@example.com');
  });

  it.each([
    ['empty string', ''],
    ['blank string', '   '],
    ['no @ sign', 'userexample.com'],
    ['missing domain', 'user@'],
    ['missing local part', '@example.com'],
    ['whitespace', 'user @example.com'],
    ['no TLD', 'user@example'],
  ])('rejects %s', (_label, raw) => {
    const r = Email.create(raw);

    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.failure.code).toBe('validation');
      expect(r.failure.field).toBe('email');
    }
  });
});
