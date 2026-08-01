/**
 * Cloudflare Access service-token headers.
 *
 * @remarks
 * - **Why the dev API needs them.** Access authenticates people with an email
 *   login, which a mobile app cannot complete. A service token is the
 *   machine-to-machine equivalent: two headers Access checks at the edge before
 *   the request ever reaches the Oracle box.
 * - **They are NOT a secret in the app.** They ship in the dev build's bundle
 *   like every `EXPO_PUBLIC_` value, so anyone holding the dev APK can read
 *   them. That is acceptable because the dev build is not distributed — the
 *   point is that the open internet cannot reach the dev database, not that a
 *   determined holder of the APK cannot.
 * - **Production sends nothing.** `api.recipely.net` is public by design and is
 *   protected by authentication and authorisation, not by hiding it.
 */
export const AccessHeader = {
  clientId: 'CF-Access-Client-Id',
  clientSecret: 'CF-Access-Client-Secret',
} as const;

const CLIENT_ID = process.env.EXPO_PUBLIC_CF_ACCESS_CLIENT_ID ?? '';
const CLIENT_SECRET = process.env.EXPO_PUBLIC_CF_ACCESS_CLIENT_SECRET ?? '';

/**
 * The Access headers for this build, or an empty object when there are none —
 * which is the normal case for production.
 */
export const accessServiceTokenHeaders = (): Record<string, string> =>
  CLIENT_ID.length > 0 && CLIENT_SECRET.length > 0
    ? { [AccessHeader.clientId]: CLIENT_ID, [AccessHeader.clientSecret]: CLIENT_SECRET }
    : {};
