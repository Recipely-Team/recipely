import type { ToastInput } from '@presentation/base/feedback/toast-input';
import type { ToastItem } from '@presentation/base/feedback/toast-item';

export interface ToastStore {
  toasts: ToastItem[];
  /** Enqueue a toast and return its id (so the caller can dismiss it early). */
  show: (input: ToastInput) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}
