/**
 * The `?source=` the import screen is opened with: a link (the default), or
 * files. Shared because the create screen opens it and the import screen reads it.
 */
export const ImportSource = {
  Link: 'link',
  File: 'file',
} as const;

export type ImportSourceType = (typeof ImportSource)[keyof typeof ImportSource];
