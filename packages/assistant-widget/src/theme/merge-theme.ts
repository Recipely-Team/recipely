import type { AssistantTheme } from './assistant-theme';
import { defaultTheme } from './default-theme';

/** A theme override one level deep: `{ colors: { primary } }` keeps every other colour. */
export type AssistantThemeOverride = Partial<Omit<AssistantTheme, 'colors'>> & {
  readonly colors?: Partial<AssistantTheme['colors']>;
};

export function mergeTheme(override: AssistantThemeOverride = {}): AssistantTheme {
  return { ...defaultTheme, ...override, colors: { ...defaultTheme.colors, ...override.colors } };
}
