/**
 * Every environment variable the app and its config read, declared once.
 *
 * @remarks
 * - **Why they are declared.** `noPropertyAccessFromIndexSignature` makes an
 *   undeclared `process.env.X` a bracket read, `process.env['X']` — and Expo
 *   inlines `EXPO_PUBLIC_*` variables into the bundle only when they are read
 *   with a dot. A bracket read compiles and ships `undefined`. Declaring them
 *   keeps the dot form legal; eslint forbids the bracket form for them.
 * - **All optional**: a local build without a `.env.local` must still type-check;
 *   each reader decides what an unset variable means.
 */
declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_ADMOB_ANDROID_FEED_BANNER_UNIT_ID?: string;
    EXPO_PUBLIC_ADMOB_IOS_FEED_BANNER_UNIT_ID?: string;
    EXPO_PUBLIC_ADSENSE_WEB_FEED_SLOT_ID?: string;
    EXPO_PUBLIC_API_AES_KEY?: string;
    EXPO_PUBLIC_API_BASE_URL?: string;
    EXPO_PUBLIC_FIREBASE_API_KEY?: string;
    EXPO_PUBLIC_FIREBASE_APP_ID?: string;
    EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID?: string;
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
    EXPO_PUBLIC_FIREBASE_PROJECT_ID?: string;
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
    EXPO_PUBLIC_FIREBASE_VAPID_KEY?: string;
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?: string;
    EXPO_PUBLIC_PLAY_INTEGRITY_PROJECT_NUMBER?: string;
    EXPO_PUBLIC_WEB_APP_URL?: string;
    APP_VARIANT?: string;
    BUILD_NUMBER?: string;
    ADMOB_ANDROID_APP_ID?: string;
    ADMOB_IOS_APP_ID?: string;
    CI?: string;
    PROFILE_RENDERS?: string;
  }
}
