import Constants from 'expo-constants';

/** True in the development app variant (`APP_VARIANT=development`, injected as `extra.variant`). */
export const IS_DEV_BUILD: boolean = Constants.expoConfig?.extra?.variant === 'development';
