/**
 * The store pages to update from when the version check names none.
 *
 * @remarks
 * - **https, not `itms-apps://` / `market://`.** Both stores hand an https
 *   listing link to their app, and it still opens in a browser on a device
 *   without the store.
 */
export const StoreLinks = {
  ios: 'https://apps.apple.com/app/id6787391255',
  android: 'https://play.google.com/store/apps/details?id=com.recipely.app',
} as const;
