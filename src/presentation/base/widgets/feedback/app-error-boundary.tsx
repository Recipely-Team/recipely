import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { ErrorState } from '@presentation/base/widgets/feedback/error-state';
import { t } from '@presentation/i18n';
import { ValueConstants } from '@core/constants';

export interface AppErrorBoundaryProps {
  children: ReactNode;
  /** Records the crash. Filled by the composition root — presentation may not reach Firebase (rule 17). */
  onError: (error: unknown, context: string) => void;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

const CONTEXT = 'AppErrorBoundary';

/**
 * The last thing between a render-time throw and a blank screen.
 *
 * @remarks
 * - **A class, and only because React requires one.** `componentDidCatch` /
 *   `getDerivedStateFromError` have no hook equivalent; this is the one place
 *   in presentation where the framework dictates the shape.
 * - **What it is FOR.** A throw during render unmounts the tree above it. In a
 *   release build that is not a red screen, it is an app that goes white or
 *   closes — and, until now, told us nothing. Everything reaching here is by
 *   definition something nobody predicted, so it is always crash-worthy.
 * - **Recovery is a remount, not a reload.** Clearing the flag re-renders the
 *   children; if the cause was transient (a half-loaded response) the user is
 *   back where they were, and if it was not they get this screen again rather
 *   than a loop of restarts.
 */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // The component stack is the half that says WHERE, and it is lost by the
    // time Crashlytics sees the Error alone.
    this.props.onError(error, `${CONTEXT}${info.componentStack ?? ''}`);
  }

  private readonly handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.root}>
        <ErrorState
          severity="danger"
          icon="sad-outline"
          title={t().errors.unknown.title}
          body={t().errors.unknown.body}
          primaryLabel={t().common.retry}
          onPrimary={this.handleRetry}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: ValueConstants.one,
  },
});
