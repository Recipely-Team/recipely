export const PhaseType = {
  Prompt: 'prompt',
  Generating: 'generating',
  Preview: 'preview',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type PhaseType = (typeof PhaseType)[keyof typeof PhaseType];
