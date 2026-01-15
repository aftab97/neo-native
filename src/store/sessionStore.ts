import { create } from 'zustand';

interface SessionStore {
  // State
  sessionExpired: boolean;
  currentSessionId: string | null;

  // Actions
  setSessionExpired: (expired: boolean) => void;
  setCurrentSessionId: (sessionId: string | null) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessionExpired: false,
  currentSessionId: null,

  setSessionExpired: (expired) => set({ sessionExpired: expired }),
  setCurrentSessionId: (sessionId) => set({ currentSessionId: sessionId }),
  reset: () => set({ sessionExpired: false, currentSessionId: null }),
}));
