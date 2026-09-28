/**
 * How much one file import may carry: five photos, or one PDF, each at most
 * 10 MB. The backend enforces the same numbers; these let the picker say so
 * before an upload is spent on it.
 */
export const ImportFileLimits = {
  maxImages: 5,
  maxPdfs: 1,
  maxFileBytes: 10 * 1024 * 1024,
} as const;
