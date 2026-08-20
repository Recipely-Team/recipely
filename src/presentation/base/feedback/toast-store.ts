import { ValueConstants } from "@core/constants";
import { MAX_VISIBLE_TOASTS } from "@presentation/base/feedback/toast-model";
import type { ToastStoreState } from "@presentation/base/feedback/toast-store-state";
import { create } from "zustand";

let counter = ValueConstants.zero;
const nextId = (): string => {
  counter++;
  return `toast-${Date.now()}-${counter}`;
};

/**
 * Global, app-wide toast queue. A singleton module store (mirrors `alarmStore`)
 * so any layer can surface feedback via the `showToast` / `showErrorToast`
 * helpers without prop-drilling. Rendered once by `ToastHost` at the root.
 */
export const toastStore = create<ToastStoreState>((set) => ({
  toasts: [],
  show: (input) => {
    const id = nextId();
    // Keep only the most recent MAX_VISIBLE_TOASTS so a burst never floods the UI.
    set((s) => ({
      toasts: [...s.toasts, { ...input, id }].slice(-MAX_VISIBLE_TOASTS),
    }));
    return id;
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((toast) => toast.id !== id) })),
  clear: () => set({ toasts: [] }),
}));
