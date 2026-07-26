import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { Ionicons } from '@expo/vector-icons';
import { UnknownFailure } from '@core/failure';
import { ErrorState } from '@presentation/base/widgets/feedback/error-state';
import {
  failureContent,
  failureIcon,
  failureSeverity,
} from '@presentation/base/errors/failure-lookups';
import { t } from '@presentation/i18n';
import type { Failure } from '@presentation/base/types';
import type { StateViewStatus } from '@presentation/app/recipes/[recipeId]/model/state-view-status';
import { ValueConstants } from '@core/constants';

export interface StateViewProps {
  status: StateViewStatus;
  failure?: Failure;
  onRetry?: () => void;
  retryLabel?: string;
  /** Optional secondary action on the error state (e.g. "Get help"). */
  onSecondary?: () => void;
  secondaryLabel?: string;
  /** Small optional diagnostic code shown under the error actions. */
  code?: string;
  /** Empty-state copy + icon (the empty branch is always `neutral` severity). */
  emptyTitle?: string;
  emptyMessage?: string;
  emptyIcon?: keyof typeof Ionicons.glyphMap;
  children?: ReactNode;
}

const FALLBACK_EMPTY_ICON: keyof typeof Ionicons.glyphMap = 'file-tray-outline';

/**
 * Renders loading / error / empty / content branches from a discriminated
 * `status`. Error and empty states use the shared `ErrorState` design — fully
 * localized, severity-aware, and always offering a way out. The user-facing
 * copy is derived from the failure's class, never its raw message.
 */
export const StateView = ({
  status,
  failure,
  onRetry,
  retryLabel,
  onSecondary,
  secondaryLabel,
  code,
  emptyTitle,
  emptyMessage,
  emptyIcon,
  children,
}: StateViewProps): React.JSX.Element => {
  switch (status) {
    case 'loading':
      return (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      );
    case 'error': {
      const f = failure ?? new UnknownFailure();
      const content = failureContent(f);
      return (
        <ErrorState
          severity={failureSeverity(f)}
          icon={failureIcon(f)}
          title={content.title}
          body={content.body}
          primaryLabel={onRetry !== undefined ? (retryLabel ?? t().errors.retry) : undefined}
          onPrimary={onRetry}
          secondaryLabel={secondaryLabel}
          onSecondary={onSecondary}
          code={code}
        />
      );
    }
    case 'empty':
      return (
        <ErrorState
          severity="neutral"
          icon={emptyIcon ?? FALLBACK_EMPTY_ICON}
          title={emptyTitle ?? t().common.empty}
          body={emptyMessage}
          primaryLabel={onRetry !== undefined ? (retryLabel ?? t().common.retry) : undefined}
          onPrimary={onRetry}
        />
      );
    case 'content':
      return <>{children}</>;
  }
};

const styles = StyleSheet.create({
  center: {
    flex: ValueConstants.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
