import type { ReactNode } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAssistantScrollable } from '@presentation/base/hooks/assistant/actions/use-assistant-scrollable';
import { useTheme } from '@presentation/base/theme/context/use-theme';
import { spacing } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface ScreenContainerProps {
  children: ReactNode;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: ViewStyle;
  padded?: boolean;
}

export const ScreenContainer = ({
  children,
  scrollable = false,
  refreshing,
  onRefresh,
  contentStyle,
  padded = true,
}: ScreenContainerProps): React.JSX.Element => {
  const colors = useTheme().colors;
  const padStyle = padded ? styles.padded : undefined;
  // A container that scrolls can be scrolled by the assistant — the screens
  // that use it (settings, the import queue) do not each have to remember to
  // say so, and the ones rendering the plain View branch register nothing.
  const assistantScroll = useAssistantScrollable(scrollable);

  if (scrollable) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView
          {...assistantScroll}
          contentContainerStyle={[styles.scroll, padStyle, contentStyle]}
          refreshControl={
            onRefresh !== undefined ? (
              <RefreshControl refreshing={refreshing === true} onRefresh={onRefresh} />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.flex, padStyle, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: ValueConstants.one,
  },
  flex: {
    flex: ValueConstants.one,
  },
  scroll: {
    flexGrow: 1,
  },
  padded: {
    padding: spacing.lg,
  },
});
