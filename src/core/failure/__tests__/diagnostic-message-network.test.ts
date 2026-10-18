import { DiagnosticMessage } from '@core/failure/diagnostic-message';

/**
 * A request with no response keeps the transport's code — the only detail React
 * Native passes up — so "You're offline" on an online phone can be read later.
 */
describe('DiagnosticMessage.network.noResponse', () => {
  it('carries the transport code and message', () => {
    expect(DiagnosticMessage.network.noResponse('ERR_NETWORK', 'Network Error')).toBe('ERR_NETWORK: Network Error');
  });

  it('still says something when the transport gave neither', () => {
    expect(DiagnosticMessage.network.noResponse(undefined, '')).toBe('no-code: Network unreachable');
  });
});
