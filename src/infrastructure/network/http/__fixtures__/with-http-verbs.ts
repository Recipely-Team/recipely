import type { HttpClient } from '@infrastructure/network/http/http-client';
import { HttpMethod } from '@infrastructure/network/http/http-method';
import type { RecordedRequest } from '@infrastructure/network/http/__fixtures__/recorded-request';

type RequestFn = (config: RecordedRequest) => Promise<unknown>;

/**
 * Builds an `HttpClient` double whose verb helpers all funnel into one handler.
 *
 * A test still arranges and asserts on `{ method, url, data }` and does not
 * care whether the repository called `post(url, body)` or `request(config)` —
 * which is the point: the verb helpers are sugar over `request`, so a double
 * that only implements `request` would silently stop intercepting the moment a
 * repository moved to the sugar.
 */
export const withHttpVerbs = (request: RequestFn): HttpClient =>
  ({
    request,
    get: (url: string, config?: RecordedRequest) =>
      request({ ...config, method: HttpMethod.Get, url }),
    post: (url: string, data?: unknown, config?: RecordedRequest) =>
      request({ ...config, method: HttpMethod.Post, url, data }),
    put: (url: string, data?: unknown, config?: RecordedRequest) =>
      request({ ...config, method: HttpMethod.Put, url, data }),
    patch: (url: string, data?: unknown, config?: RecordedRequest) =>
      request({ ...config, method: HttpMethod.Patch, url, data }),
    delete: (url: string, config?: RecordedRequest) =>
      request({ ...config, method: HttpMethod.Delete, url }),
  }) as unknown as HttpClient;
