/** The comment composer's draft, as `useCommentDraft` exposes it. */
export interface UseCommentDraftResult {
  draft: string;
  onChangeDraft: (text: string) => void;
  /** True while the draft is empty or whitespace — nothing to send. */
  isEmpty: boolean;
  onSubmit: () => void;
}
