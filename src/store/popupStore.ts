import { create } from 'zustand';

export interface Toast {
  id: string;
  variant: 'default' | 'danger' | 'success';
  label: string;
  showClose?: boolean;
  duration?: number;
}

export interface Snackbar {
  id: string;
  label: string;
  variant: 'default' | 'danger';
  hasAction: boolean;
  actionLabel?: string;
  action?: () => void;
}

interface PopupStore {
  // State
  toasts: Toast[];
  snackbars: Snackbar[];

  // Actions
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  addSnackbar: (snackbar: Omit<Snackbar, 'id'>) => void;
  removeSnackbar: (id: string) => void;
  clearAll: () => void;
}

const AUTO_DISMISS_DURATION = 5000; // 5 seconds

export const usePopupStore = create<PopupStore>((set, get) => ({
  toasts: [],
  snackbars: [],

  addToast: (toast) => {
    const id = `toast-${Date.now()}`;
    const newToast: Toast = { ...toast, id };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto dismiss
    const duration = toast.duration ?? AUTO_DISMISS_DURATION;
    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  addSnackbar: (snackbar) => {
    const id = `snackbar-${Date.now()}`;
    const newSnackbar: Snackbar = { ...snackbar, id };

    set((state) => ({
      snackbars: [...state.snackbars, newSnackbar],
    }));

    // Auto dismiss
    setTimeout(() => {
      get().removeSnackbar(id);
    }, AUTO_DISMISS_DURATION);
  },

  removeSnackbar: (id) => {
    set((state) => ({
      snackbars: state.snackbars.filter((s) => s.id !== id),
    }));
  },

  clearAll: () => {
    set({ toasts: [], snackbars: [] });
  },
}));
