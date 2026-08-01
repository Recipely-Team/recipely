import type { Failure } from '@presentation/base/types';
import { SeverityType } from '@presentation/base/theme/colors/surfaces/severity-type';
import {
  failureSeverity,
  failureToastMessage,
} from '@presentation/base/errors/failure-lookups';
import { t } from '@presentation/i18n';
import { toastStore } from '@presentation/base/feedback/toast-store';
import type { ToastRetry } from '@presentation/base/feedback/toast-retry';

/**
 * Surfaces a `Failure` as a toast. The message and severity are selected from
 * the failure's class (never its raw `message`), so the same error always reads
 * the same way. This is the default "the user must never get no feedback" path
 * for action failures (save / delete / like / comment).
 */
export const showErrorToast = (failure: Failure, retry?: ToastRetry): string =>
  toastStore.getState().show({
    severity: failureSeverity(failure),
    message: failureToastMessage(failure),
    actionLabel: retry ? (retry.label ?? t().errors.retry) : undefined,
    onAction: retry?.onRetry,
  });

/**
 * Surfaces a plain danger toast for an error the caller has already turned into
 * user-facing copy — e.g. a failure whose class-derived message is too generic
 * for the screen's context. When a raw `Failure` is in hand, prefer
 * {@link showErrorToast}, which selects both message and severity from it.
 */
export const showDangerToast = (message: string): string =>
  toastStore.getState().show({ severity: SeverityType.Danger, message });

/**
 * Surfaces a caution (amber): nothing failed, but the app declined to do what
 * was asked and the user has to resolve something before asking again.
 */
export const showWarningToast = (message: string): string =>
  toastStore.getState().show({ severity: SeverityType.Warning, message });

/** Surfaces a success confirmation (green). */
export const showSuccessToast = (message: string, action?: ToastRetry): string =>
  toastStore.getState().show({
    severity: SeverityType.Success,
    message,
    actionLabel: action?.label,
    onAction: action?.onRetry,
  });

