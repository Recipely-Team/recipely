/** Which question the owner's status panel is asking, when it asks one. */
export const PanelConfirm = {
  Publish: 'publish',
  Unpublish: 'unpublish',
} as const;

export type PanelConfirmType = (typeof PanelConfirm)[keyof typeof PanelConfirm];
