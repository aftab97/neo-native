import { useMemo } from 'react';
import { useGetUser } from '../api/user';
import { CURRENT_ENV, SHOW_ALL_AGENTS } from '../api/env';
import { rbacGroups } from '../ui/components/agents/rbac';
import { AGENTS } from '../ui/components/agents/agents';

/**
 * Hook to get available services based on user's RBAC groups
 * Matches web app's useAvailableServices hook
 *
 * When SHOW_ALL_AGENTS is true in env.ts, all agents are returned
 * regardless of user group membership (useful for dev/testing)
 */
export const useAvailableServices = (): {
  isLoading: boolean;
  services: string[];
} => {
  const { data, isLoading } = useGetUser();

  const services = useMemo(() => {
    // Bypass RBAC check if SHOW_ALL_AGENTS is enabled
    if (SHOW_ALL_AGENTS) {
      return AGENTS.map((agent) => agent.id);
    }

    if (isLoading || !data?.groups) return [];

    const availableServices: string[] = [];

    for (const [service, requiredGroup] of Object.entries(rbacGroups[CURRENT_ENV])) {
      if (data.groups.includes(requiredGroup)) {
        availableServices.push(service);
      }
    }

    return availableServices;
  }, [data?.groups, isLoading]);

  return {
    isLoading,
    services,
  };
};
