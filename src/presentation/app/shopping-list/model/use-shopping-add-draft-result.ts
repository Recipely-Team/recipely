/** The Shopping list add field, as `useShoppingAddDraft` exposes it. */
export interface UseShoppingAddDraftResult {
  draft: string;
  onChangeDraft: (text: string) => void;
  isAdding: boolean;
  onAdd: () => void;
}
