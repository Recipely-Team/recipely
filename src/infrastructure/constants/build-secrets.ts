const DEFAULT_AES_KEY_HEX =
  "0000000000000000000000000000000000000000000000000000000000000000";

/**
 * Credentials baked into the build.
 *
 * @remarks
 * **`API_AES_KEY_HEX` must equal the backend's `API_AES_KEY`.** It ships inside
 * the binary and is extractable by reverse engineering; TLS is the real
 * transport protection, this envelope is not. Override at build time via
 * `EXPO_PUBLIC_API_AES_KEY` (`openssl rand -hex 32`).
 */
export const API_AES_KEY_HEX: string =
  process.env.EXPO_PUBLIC_API_AES_KEY?.toLowerCase() ?? DEFAULT_AES_KEY_HEX;

/** Firebase Console → Authentication → Sign-in method → Google, "Web client". */
export const GOOGLE_WEB_CLIENT_ID: string =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";
