/** The rule editor's four steps, in order (spec §3). */
export const EditorStep = {
  Post: 0,
  Keywords: 1,
  Recipe: 2,
  Message: 3,
} as const;

export type EditorStepType = (typeof EditorStep)[keyof typeof EditorStep];
