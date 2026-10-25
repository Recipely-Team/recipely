import { boundedAttestation } from '@infrastructure/integrity/bounded-attestation';

describe('boundedAttestation', () => {
  it('passes a prompt proof through', async () => {
    const proof = { 'X-App-Attestation': 'p' };
    expect(await boundedAttestation(() => Promise.resolve(proof), 'b')).toBe(proof);
  });

  it('sends no proof rather than failing the request when the attestor rejects', async () => {
    expect(await boundedAttestation(() => Promise.reject(new Error('boom')), 'b')).toBeNull();
  });

  it('sends no proof rather than holding the request when the attestor is slow', async () => {
    jest.useFakeTimers();
    const pending = boundedAttestation(() => new Promise(() => {}), 'b', 50);
    jest.advanceTimersByTime(50);
    expect(await pending).toBeNull();
    jest.useRealTimers();
  });
});
