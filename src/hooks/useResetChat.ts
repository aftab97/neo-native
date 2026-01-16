import { useQueryClient } from "@tanstack/react-query";
import {
  useChatStore,
  useAgentStore,
  useSessionStore,
  useRequestStore,
} from "../store";
import { queryKeys } from "../api/queryClient";

/**
 * Hook to reset chat state when navigating to homepage or agent pages.
 * Follows the web app pattern:
 * - Homepage: clears ['chat'] cache
 * - Agent page: clears ['chat', agentId] cache
 * - Recent chat: NOT cleared (loaded from backend)
 */
export const useResetChat = () => {
  const queryClient = useQueryClient();
  const { setInputValue, setIsPromptPaused } = useChatStore();
  const { setSelectedAgent } = useAgentStore();
  const { setCurrentSessionId } = useSessionStore();
  const { setAbortController } = useRequestStore();

  /**
   * Reset chat for homepage - clears the general ['chat'] cache
   */
  const resetForHomepage = () => {
    // Clear the homepage chat cache
    queryClient.setQueryData(queryKeys.chat(), []);

    // Reset stores
    setCurrentSessionId(null);
    setSelectedAgent(null);
    setInputValue("");
    setIsPromptPaused(false);
    setAbortController(null);
  };

  /**
   * Reset chat for agent page - clears the ['chat', agentId] cache
   */
  const resetForAgent = (agentId: string) => {
    // Clear the agent-specific chat cache
    queryClient.setQueryData(queryKeys.chat(agentId), []);

    // Reset stores but keep the agent selected
    setCurrentSessionId(null);
    setSelectedAgent(agentId);
    setInputValue("");
    setIsPromptPaused(false);
    setAbortController(null);
  };

  /**
   * Reset all chat caches (for "new chat" action)
   */
  const resetAll = () => {
    // Clear homepage cache
    queryClient.setQueryData(queryKeys.chat(), []);

    // Reset stores
    setCurrentSessionId(null);
    setSelectedAgent(null);
    setInputValue("");
    setIsPromptPaused(false);
    setAbortController(null);
  };

  return {
    resetForHomepage,
    resetForAgent,
    resetAll,
  };
};
