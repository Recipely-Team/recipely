import { InFlightInvocations } from '@domain/assistant/os/in-flight-invocations';

describe('InFlightInvocations', () => {
  it('lets a request run once when the event and the queue both see it', () => {
    const inFlight = new InFlightInvocations();

    expect(inFlight.claim('req-1')).toBe(true);
    expect(inFlight.claim('req-1')).toBe(false);
  });

  it('lets the same request run again only after it is released', () => {
    const inFlight = new InFlightInvocations();
    inFlight.claim('req-1');
    inFlight.release('req-1');

    expect(inFlight.claim('req-1')).toBe(true);
  });

  it('tracks each id separately', () => {
    const inFlight = new InFlightInvocations();

    expect(inFlight.claim('a')).toBe(true);
    expect(inFlight.claim('b')).toBe(true);
  });
});
