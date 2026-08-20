/**
 * The words a cook uses to move through a recipe's steps.
 *
 * "Next" is asked for far more often than a number, so it is the default when
 * `readStep` arrives with no argument at all.
 */
export const StepCursor = {
  Next: 'next',
  Previous: 'previous',
  Current: 'current',
} as const;
