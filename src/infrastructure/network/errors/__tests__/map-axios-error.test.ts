import { AxiosError } from 'axios';
import { mapAxiosError } from '@infrastructure/network/errors/map-axios-error';
import { FailureCode } from '@core/failure';

/**
 * React Native passes only axios's code and "Network Error" up from the native
 * transport. The code was dropped, so "You're offline" on an online phone
 * reached us with nothing to tell a refused connection from a dead one.
 */
describe('mapAxiosError — a request that got no response', () => {
  it('keeps the transport code in the network failure', () => {
    const error = new AxiosError('Network Error', 'ERR_NETWORK', undefined, {});

    const failure = mapAxiosError(error);

    expect(failure.code).toBe(FailureCode.Network);
    expect(failure.message).toBe('ERR_NETWORK: Network Error');
  });
});
