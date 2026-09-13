/**
 * What a screen knows about the rows it is describing.
 *
 * @remarks
 * The model discriminates on these words, so they are defined once and every
 * describer takes one — there is no default. A screen that said `none` while
 * its rows were still on their way stated a fact the model passed on as "you
 * have none", over a list that filled in a moment later ("oluşturduğum
 * tarifleri aç dedim, yok dedi, ama o arada tarifler yükleniyordu"), and a
 * screen whose load FAILED said the same thing about rows nobody had seen.
 */
export const ListState = {
  /** The rows are on their way; whatever is there now is not the answer. */
  Loading: 'loading',
  /** These rows are the truth, empty or not. */
  Ready: 'ready',
  /** The load failed: how many there are is not known. */
  Failed: 'failed',
} as const;

export type ListStateType = (typeof ListState)[keyof typeof ListState];
