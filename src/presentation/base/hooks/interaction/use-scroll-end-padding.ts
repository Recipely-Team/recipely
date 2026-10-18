import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '@presentation/base/theme';

/**
 * Bottom padding for the scroll content of a full screen that has no tab bar:
 * the system navigation bar's height plus the usual gap.
 *
 * @remarks
 * - **Why.** Android draws edge to edge, so the last thing in a scroll view
 *   scrolls down UNDER the navigation bar. On a small phone the login screen's
 *   Google and Apple buttons, and "Continue without an account", ended there —
 *   out of sight and, under the 3-button bar, impossible to tap.
 * - **Tab screens do not need it**: the tab bar already stands on the inset.
 */
export const useScrollEndPadding = (): number => useSafeAreaInsets().bottom + spacing.lg;
