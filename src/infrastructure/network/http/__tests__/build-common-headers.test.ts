import { buildCommonHeaders } from '@infrastructure/network/http/build-common-headers';
import type { AxiosHttpClientOptions } from '@infrastructure/network/http/axios-http-client-options';

const makeOptions = (overrides: Partial<AxiosHttpClientOptions> = {}): AxiosHttpClientOptions => ({
  baseUrl: 'https://api.test',
  tokenProvider: () => Promise.resolve('tok'),
  localeProvider: () => Promise.resolve('en'),
  ...overrides,
});

describe('buildCommonHeaders', () => {
  it('attaches the bearer token and the active language', async () => {
    const headers = await buildCommonHeaders(makeOptions());

    expect(headers['Authorization']).toBe('Bearer tok');
    expect(headers['Accept-Language']).toBe('en');
  });

  it('omits Authorization when there is no session', async () => {
    const headers = await buildCommonHeaders(
      makeOptions({ tokenProvider: () => Promise.resolve(null) }),
    );

    expect(headers['Authorization']).toBeUndefined();
    expect(headers['Accept-Language']).toBe('en');
  });

  // The regression: the language must be read per request, so a switch is
  // picked up by the very next call instead of the one captured at wiring time.
  it('reads the locale on every call, so a language switch applies immediately', async () => {
    let locale = 'en';
    const options = makeOptions({ localeProvider: () => Promise.resolve(locale) });

    const before = await buildCommonHeaders(options);
    locale = 'tr';
    const after = await buildCommonHeaders(options);

    expect(before['Accept-Language']).toBe('en');
    expect(after['Accept-Language']).toBe('tr');
  });

  // The startup race: a request issued before the saved language is restored
  // must wait for it, not go out with the device seed.
  it('waits for the locale provider to resolve, so a startup request cannot outrun hydration', async () => {
    let resolveLocale: (locale: string) => void = () => {};
    const pending = new Promise<string>((resolve) => {
      resolveLocale = resolve;
    });
    const headers = buildCommonHeaders(makeOptions({ localeProvider: () => pending }));

    resolveLocale('tr');

    expect((await headers)['Accept-Language']).toBe('tr');
  });

  it('gives every request its own id, so an app failure can be found in the API log', async () => {
    let n = 0;
    const options = makeOptions({ requestIdProvider: () => `rid-${++n}` });

    const first = await buildCommonHeaders(options);
    const second = await buildCommonHeaders(options);

    expect(first['X-Request-Id']).toBe('rid-1');
    expect(second['X-Request-Id']).toBe('rid-2');
  });

  it('attests a costly route, bound to its verb, path and request id', async () => {
    const attestationProvider = jest.fn().mockResolvedValue({ 'X-App-Attestation': 'proof' });
    const options = makeOptions({ requestIdProvider: () => 'rid-1', attestationProvider });

    const headers = await buildCommonHeaders(options, { method: 'post', url: '/recipes/generate' });

    expect(attestationProvider).toHaveBeenCalledWith('POST /recipes/generate\nrid-1');
    expect(headers['X-App-Attestation']).toBe('proof');
  });

  it('spends no attestation on a route outside the attested list', async () => {
    const attestationProvider = jest.fn().mockResolvedValue({ 'X-App-Attestation': 'proof' });
    const options = makeOptions({ requestIdProvider: () => 'rid-1', attestationProvider });

    const headers = await buildCommonHeaders(options, { method: 'get', url: '/recipes' });

    expect(attestationProvider).not.toHaveBeenCalled();
    expect(headers['X-App-Attestation']).toBeUndefined();
  });

  it('still sends the request when the attestor has no proof to give', async () => {
    const options = makeOptions({ requestIdProvider: () => 'rid-1', attestationProvider: () => Promise.resolve(null) });

    const headers = await buildCommonHeaders(options, { method: 'post', url: '/recipes/generate' });

    expect(headers['X-Request-Id']).toBe('rid-1');
    expect(headers['X-App-Attestation']).toBeUndefined();
  });
});
