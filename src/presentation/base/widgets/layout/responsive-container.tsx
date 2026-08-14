import { StyleSheet, View, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { WEB_CONTENT_MAX_WIDTH } from '@presentation/base/responsive/breakpoints';
import type { WebContentRoute } from '@presentation/base/responsive/web-content-route';
import { useLayout } from '@presentation/base/responsive/use-layout';
import { spacing } from '@presentation/base/theme';
import { ValueConstants } from '@core/constants';

export interface ResponsiveContainerProps {
  children: ReactNode;
  /** Route key whose max-width cap should be applied on the web shell. */
  route?: WebContentRoute;
  /** Override the cap with an explicit value (used by ad-hoc forms / cards). */
  maxWidth?: number;
  /** Adds horizontal padding inside the cap. Defaults to true on web shell. */
  gutter?: boolean;
  /** When true the cap fills available vertical space (use as a screen-level wrapper). */
  fill?: boolean;
  style?: ViewStyle;
}

/**
 * Caps content width on any expanded viewport so mobile-first screens (profile,
 * createRecipe, settings, etc.) do not stretch full-bleed across a desktop
 * window or an iPad. Pass-through on phones — children render edge-to-edge.
 */
export const ResponsiveContainer = ({
  children,
  route,
  maxWidth,
  gutter = true,
  fill = false,
  style,
}: ResponsiveContainerProps): React.JSX.Element => {
  const { isExpanded } = useLayout();
  const cap = maxWidth ?? (route ? WEB_CONTENT_MAX_WIDTH[route] : WEB_CONTENT_MAX_WIDTH.default);

  if (!isExpanded) {
    return (
      <View style={[fill ? styles.fill : styles.passthrough, style]}>{children}</View>
    );
  }

  return (
    <View style={fill ? styles.fill : styles.passthrough}>
      <View
        style={[
          styles.cap,
          fill ? styles.fill : null,
          { maxWidth: cap },
          gutter ? styles.gutter : null,
          style,
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  passthrough: {
    width: '100%',
  },
  fill: {
    flex: ValueConstants.one,
    width: '100%',
  },
  cap: {
    width: '100%',
    alignSelf: 'center',
  },
  gutter: {
    paddingHorizontal: spacing.xl,
  },
});
