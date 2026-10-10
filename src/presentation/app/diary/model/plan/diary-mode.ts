/** The Diary tab's two views — the `mode` query of `/diary`. `Log` (today's diary) is the default. */
export const DiaryMode = {
  Plan: 'plan',
  Log: 'log',
} as const;

export type DiaryModeType = (typeof DiaryMode)[keyof typeof DiaryMode];
