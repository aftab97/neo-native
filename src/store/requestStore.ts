import { create } from 'zustand';

interface RequestStore {
  // State
  messageIdUser: string | null;
  abortController: AbortController | null;

  // Actions
  setMessageIdUser: (id: string | null) => void;
  setAbortController: (controller: AbortController | null) => void;
  cancelRequest: () => void;
  reset: () => void;
}

export const useRequestStore = create<RequestStore>((set, get) => ({
  messageIdUser: null,
  abortController: null,

  setMessageIdUser: (id) => set({ messageIdUser: id }),

  setAbortController: (controller) => set({ abortController: controller }),

  cancelRequest: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
      set({ abortController: null });
    }
  },

  reset: () => set({ messageIdUser: null, abortController: null }),
}));
