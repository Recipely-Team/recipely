import Constants from 'expo-constants';

/** The `extra.variant` value `app.config.ts` stamps on a dev build (from `APP_VARIANT`). */
const DEVELOPMENT_VARIANT = 'development';

/**
 * Whether this binary is the development variant (dev API, dev Firebase, dev-only
 * features). The ONE definition — read it, never re-derive it from `extra.variant`.
 */
export const IS_DEV_BUILD: boolean = Constants.expoConfig?.extra?.variant === DEVELOPMENT_VARIANT;
