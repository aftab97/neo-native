import { create } from 'zustand';

type NotificationStore = {
  dismissedIds: Set<string>;
  dismissNotification: (id: string) => void;
  clearDismissed: () => void;
};

export const useNotificationStore = create<NotificationStore>((set) => ({
  dismissedIds: new Set(),
  dismissNotification: (id) =>
    set((state) => ({
      dismissedIds: new Set(state.dismissedIds).add(id),
    })),
  clearDismissed: () =>
    set(() => ({
      dismissedIds: new Set(),
    })),
}));
