import type { TextInputProps } from 'react-native';

/**
 * Shared contract for the `auto-grow-text-input` platform pair. Declared once,
 * here, so the native and web implementations cannot drift apart.
 */
export interface AutoGrowTextInputProps extends Omit<TextInputProps, 'multiline'> {
  /**
   * Resting height of the empty field. The box never shrinks below this and
   * grows from here as the text wraps — pass a `controlSizes.*` token, never a
   * literal.
   */
  minHeight: number;
}
