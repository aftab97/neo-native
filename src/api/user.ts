import { useQuery } from '@tanstack/react-query';
import { apiFetchJson } from './fetch';
import { queryKeys } from './queryClient';
import { ENDPOINTS } from '../config/api';
import { UserInfo } from '../types/user';

/**
 * Fetch current user info
 */
export const useGetUser = () => {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: () => apiFetchJson<UserInfo>(ENDPOINTS.USER_INFO),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};
