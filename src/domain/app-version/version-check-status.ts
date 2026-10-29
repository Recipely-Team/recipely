/**
 * What the app must do about its installed version — the backend's `status`
 * from `GET /app/version`, same three names.
 *
 * @remarks
 * - **`UpToDate`** shows nothing; **`UpdateAvailable`** offers the store once per
 *   release and lets the user carry on; **`UpdateRequired`** blocks the app.
 */
export const VersionCheckStatus = {
  UpToDate: 'upToDate',
  UpdateAvailable: 'updateAvailable',
  UpdateRequired: 'updateRequired',
} as const;

export type VersionCheckStatusType = (typeof VersionCheckStatus)[keyof typeof VersionCheckStatus];
