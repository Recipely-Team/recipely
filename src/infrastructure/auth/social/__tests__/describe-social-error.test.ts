import { describeSocialError } from '@infrastructure/auth/social/describe-social-error';

// The symptom: a dev build's Google sign-in failed with only "Something went wrong";
// the provider's code — the one thing that says why — was thrown away.
describe('describeSocialError', () => {
  it('puts the provider code in front of the message', () => {
    expect(describeSocialError(Object.assign(new Error('DEVELOPER_ERROR'), { code: '10' }), 'fallback')).toBe('10: DEVELOPER_ERROR');
    expect(describeSocialError(Object.assign(new Error('bad token'), { code: 'auth/invalid-credential' }), 'fallback')).toBe(
      'auth/invalid-credential: bad token',
    );
  });

  it('keeps a numeric code', () => {
    expect(describeSocialError(Object.assign(new Error('x'), { code: 12500 }), 'fallback')).toBe('12500: x');
  });

  it('falls back when there is neither a code nor an Error', () => {
    expect(describeSocialError(new Error('plain'), 'fallback')).toBe('plain');
    expect(describeSocialError('weird', 'fallback')).toBe('fallback');
  });
});
