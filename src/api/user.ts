import { useQuery } from '@tanstack/react-query';
import { apiFetchJson } from './fetch';
import { queryKeys } from './queryClient';
import { ENDPOINTS } from './config';
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

interface ProfilePictureResponse {
  profilePicture: string;
}

/**
 * Fetch user profile picture
 */
export const useGetProfilePicture = () => {
  return useQuery({
    queryKey: ['userProfilePicture'],
    queryFn: () => apiFetchJson<ProfilePictureResponse>(ENDPOINTS.USER_PROFILE_PICTURE),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
};
