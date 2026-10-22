import { encryptEnvelope, keyFromHex } from '@infrastructure/crypto/aes-envelope';
import { uploadMultipart } from '@infrastructure/network/upload/upload-multipart';
import { ValidationFailure } from '@core/failure';

/** A stand-in XHR that answers `send` with the status and body the test set. */
class FakeXhr {
  static status = 200;
  static body = '';
  status = 0;
  responseText = '';
  timeout = 0;
  upload = {};
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  open(): void {}
  setRequestHeader(): void {}
  send(): void {
    this.status = FakeXhr.status;
    this.responseText = FakeXhr.body;
    this.onload?.();
  }
}

// Regression: the uploader swallowed a decrypt failure the same way the axios
// path did, so an avatar upload answered on another key resolved `ok`.
describe('uploadMultipart', () => {
  const appKey = keyFromHex('a'.repeat(64));
  const otherKey = keyFromHex('b'.repeat(64));
  const options = {
    baseUrl: 'https://api.test',
    tokenProvider: () => Promise.resolve(null),
    localeProvider: () => Promise.resolve('en'),
  };
  const realXhr = global.XMLHttpRequest;

  beforeAll(() => {
    global.XMLHttpRequest = FakeXhr as unknown as typeof XMLHttpRequest;
  });

  afterAll(() => {
    global.XMLHttpRequest = realXhr;
  });

  it('returns the data of a reply sealed with the app key', async () => {
    FakeXhr.body = JSON.stringify(encryptEnvelope({ data: { url: 'https://img' } }, appKey));

    const result = await uploadMultipart(options, appKey, '/upload', new FormData());

    expect(result).toEqual({ ok: true, value: { url: 'https://img' } });
  });

  it('fails a 2xx reply sealed with another key instead of resolving it as success', async () => {
    FakeXhr.body = JSON.stringify(encryptEnvelope({ data: {} }, otherKey));

    const result = await uploadMultipart(options, appKey, '/upload', new FormData());

    expect(result.ok).toBe(false);
    expect(!result.ok && result.failure).toBeInstanceOf(ValidationFailure);
  });
});
