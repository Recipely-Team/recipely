import Constants from 'expo-constants';

/**
 * True in the internal dev build, false in what ships to a store.
 *
 * @remarks
 * Distinct from `__DEV__`, which is false in every distributed artifact —
 * including the dev APK, which is built in release mode. So `__DEV__` cannot
 * gate anything meant to help while testing a real build, and this can.
 * Never gate BEHAVIOUR on it: a build that behaves differently from the one
 * users get is a build that proves nothing.
 */
export const IS_DEV_BUILD: boolean = Constants.expoConfig?.extra?.variant === 'development';
