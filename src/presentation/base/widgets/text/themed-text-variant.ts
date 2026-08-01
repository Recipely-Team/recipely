export const ThemedTextVariant = {
  Headline: 'headline',
  Title: 'title',
  Subtitle: 'subtitle',
  Body: 'body',
  Caption: 'caption',
  Label: 'label',
} as const;

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentional enum-style value + type pairing
export type ThemedTextVariant = (typeof ThemedTextVariant)[keyof typeof ThemedTextVariant];
