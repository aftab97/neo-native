import { create } from 'zustand';

interface AgentStore {
  // State
  selectedAgent: string | null;

  // Actions
  setSelectedAgent: (agent: string | null) => void;
  reset: () => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  selectedAgent: null,

  setSelectedAgent: (agent) => set({ selectedAgent: agent }),
  reset: () => set({ selectedAgent: null }),
}));
