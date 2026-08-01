export const FEEDBACK_CATEGORIES = ['bug', 'suggestion', 'help', 'other'] as const; // TO DO: static category name problem

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

/** Fixed category sent for all submissions from this client (no category picker in the UI). */
export const DEFAULT_FEEDBACK_CATEGORY: FeedbackCategory = 'other'; // TO DO: static category name problem
