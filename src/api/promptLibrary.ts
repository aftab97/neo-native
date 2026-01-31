import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL, ENDPOINTS } from './config';

export interface PromptLibraryPrompt {
  agent: string;        // "Proposal Assistant", "Contracts Assistant", etc.
  subCategory: string;  // "Risk Analysis", etc.
  title: string;        // "What clauses could delay signing?"
  prompt: string;       // Full prompt text
}

export interface PromptLibraryResponse {
  message: string;
  prompts: PromptLibraryPrompt[];
  total: number;
}

/**
 * Fetch prompt library templates
 * Returns prompts organized by agent/category
 */
export const useGetPrompts = () => {
  return useQuery<PromptLibraryResponse>({
    queryKey: ['prompts'],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE_URL}${ENDPOINTS.PROMPT_LIBRARY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch prompts');
      }
      return response.json();
    },
    staleTime: 30 * 60 * 1000, // Consider data fresh for 30 minutes
    retry: 2,
  });
};
