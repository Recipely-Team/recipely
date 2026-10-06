import { Password } from '@domain/auth/password';

// The minimum length lived twice in the UI (register and reset-password) and
// could drift from each other and from the backend.
describe('Password', () => {
  it('accepts the minimum length and refuses one shorter', () => {
    expect(Password.create('a'.repeat(Password.minLength)).ok).toBe(true);
    expect(Password.create('a'.repeat(Password.minLength - 1)).ok).toBe(false);
  });

  it('scores strength 0–4 by length, capital, digit and symbol', () => {
    expect(Password.strengthOf('')).toBe(0);
    expect(Password.strengthOf('abcdefgh')).toBe(1);
    expect(Password.strengthOf('Abcdefg1!')).toBe(4);
  });
});
