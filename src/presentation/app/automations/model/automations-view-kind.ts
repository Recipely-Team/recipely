/** Which face the Automations screen shows (spec §2). */
export const AutomationsViewKind = {
  /** The link has not answered yet. */
  Loading: 'loading',
  /** The server offers no Instagram login: nothing to manage. */
  Unavailable: 'unavailable',
  /** Not connected: Connect with Instagram. */
  Locked: 'locked',
  /** Connected (active or expired): the rules. */
  Rules: 'rules',
} as const;

export type AutomationsViewKindType = (typeof AutomationsViewKind)[keyof typeof AutomationsViewKind];
